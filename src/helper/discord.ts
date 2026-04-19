import RPC from "discord-rpc";
import type { PresencePayload } from "../shared/types.js";
import { defaultConfig } from "../shared/config.js";

RPC.register(defaultConfig.rpcClientId);

type RpcClientLike = {
  on(event: string, listener: (...args: any[]) => void): unknown;
  login(args: { clientId: string }): Promise<unknown>;
  setActivity(activity: Record<string, unknown>): Promise<unknown>;
  clearActivity(): Promise<unknown>;
};

type Scheduler = typeof setTimeout;
type Canceler = typeof clearTimeout;

export class DiscordPresenceClient {
  private readonly client: RpcClientLike;
  private readonly schedule: Scheduler;
  private readonly cancel: Canceler;
  private ready = false;
  private listenersBound = false;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 3;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private connectPromise: Promise<void> | null = null;
  private pendingPresence: PresencePayload | null = null;

  constructor(
    client: RpcClientLike = new RPC.Client({ transport: "ipc" }),
    schedule: Scheduler = setTimeout,
    cancel: Canceler = clearTimeout
  ) {
    this.client = client;
    this.schedule = schedule;
    this.cancel = cancel;
  }

  async connect(): Promise<void> {
    if (this.ready) return;
    this.bindListeners();

    if (!this.connectPromise) {
      this.connectPromise = this.client
        .login({ clientId: defaultConfig.rpcClientId })
        .then(() => undefined)
        .finally(() => {
          this.connectPromise = null;
        });
    }

    await this.connectPromise;
  }

  async setPresence(payload: PresencePayload): Promise<void> {
    this.pendingPresence = payload;

    if (!this.ready) {
      try {
        await this.connect();
      } catch (error) {
        console.error("Discord RPC not ready, queued presence update", error);
        return;
      }
    }

    if (!this.ready) {
      return;
    }

    await this.client.setActivity(buildActivity(payload));
  }

  async clearPresence(): Promise<void> {
    this.pendingPresence = null;

    if (this.reconnectTimer) {
      this.cancel(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (!this.ready) return;
    await this.client.clearActivity();
  }

  private bindListeners(): void {
    if (this.listenersBound) {
      return;
    }

    this.listenersBound = true;

    this.client.on("ready", () => {
      this.ready = true;
      this.reconnectAttempts = 0;

      if (this.reconnectTimer) {
        this.cancel(this.reconnectTimer);
        this.reconnectTimer = null;
      }

      console.log("Discord RPC connected");
      void this.flushPendingPresence();
    });

    this.client.on("disconnected", () => {
      this.ready = false;
      console.log("Discord RPC disconnected");
      this.scheduleReconnect();
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("Max reconnection attempts reached, giving up");
      return;
    }

    if (this.reconnectTimer) {
      this.cancel(this.reconnectTimer);
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 5000);
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts + 1} in ${delay}ms`);

    this.reconnectTimer = this.schedule(() => {
      void this.attemptReconnect();
    }, delay);
  }

  private async attemptReconnect(): Promise<void> {
    if (this.ready) {
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("Max reconnection attempts reached, giving up");
      return;
    }

    this.reconnectAttempts += 1;
    console.log(`Attempting reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    try {
      await this.connect();
    } catch (error) {
      console.error("Reconnect attempt failed:", error);
      this.scheduleReconnect();
    }
  }

  private async flushPendingPresence(): Promise<void> {
    if (!this.ready || !this.pendingPresence) {
      return;
    }

    const payload = this.pendingPresence;
    await this.client.setActivity(buildActivity(payload));
  }
}

export function buildActivity(payload: PresencePayload): Record<string, unknown> {
  const stateParts = [payload.model, humanizeState(payload.state)];
  if (!payload.privacyMode && payload.projectName && defaultConfig.includeProjectName) {
    stateParts.push(payload.projectName);
  }

  return {
    details: `Using ${defaultConfig.appName}`,
    state: stateParts.join(" • "),
    startTimestamp: payload.startedAt,
    largeImageKey: "pi",
    largeImageText: defaultConfig.appName,
    smallImageKey: normalizeKey(payload.provider),
    smallImageText: payload.provider
  };
}

export function humanizeState(state: PresencePayload["state"]): string {
  return {
    starting: "Starting",
    thinking: "Thinking",
    tooling: "Running Tools",
    editing: "Editing Files",
    idle: "Idle",
    error: "Error"
  }[state];
}

export function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_]/g, "-");
}
