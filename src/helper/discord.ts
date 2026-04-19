import RPC from "discord-rpc";
import type { PresencePayload } from "../shared/types.js";
import { defaultConfig } from "../shared/config.js";

RPC.register(defaultConfig.rpcClientId);

type RpcClientLike = {
  on(event: string, listener: (...args: any[]) => void): unknown;
  login(args: { clientId: string }): Promise<unknown>;
  setActivity(activity: Record<string, unknown>): Promise<unknown>;
  clearActivity(): Promise<unknown>;
  destroy?(): void;
};

type RpcClientFactory = () => RpcClientLike;
type Scheduler = typeof setTimeout;
type Canceler = typeof clearTimeout;

export class DiscordPresenceClient {
  private client: RpcClientLike;
  private readonly createClient: RpcClientFactory;
  private readonly schedule: Scheduler;
  private readonly cancel: Canceler;
  private ready = false;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private connectPromise: Promise<void> | null = null;
  private pendingPresence: PresencePayload | null = null;
  private needsClientRefresh = false;

  constructor(
    clientOrFactory: RpcClientLike | RpcClientFactory = () => new RPC.Client({ transport: "ipc" }),
    schedule: Scheduler = setTimeout,
    cancel: Canceler = clearTimeout
  ) {
    this.createClient =
      typeof clientOrFactory === "function"
        ? (clientOrFactory as RpcClientFactory)
        : () => clientOrFactory as RpcClientLike;
    this.schedule = schedule;
    this.cancel = cancel;
    this.client = this.createClient();
    this.bindListeners(this.client);
  }

  async connect(): Promise<void> {
    if (this.ready) {
      return;
    }

    if (this.needsClientRefresh) {
      this.refreshClient();
    }

    if (!this.connectPromise) {
      const activeClient = this.client;
      this.connectPromise = activeClient
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
        debugLog("Discord RPC not ready, queued presence update", error);
        this.scheduleReconnect();
        return;
      }
    }

    if (!this.ready) {
      this.scheduleReconnect();
      return;
    }

    try {
      await this.client.setActivity(buildActivity(payload));
    } catch (error) {
      this.handleDisconnect("setActivity_failed", error);
    }
  }

  async clearPresence(): Promise<void> {
    this.pendingPresence = null;

    if (this.reconnectTimer) {
      this.cancel(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (!this.ready) {
      return;
    }

    try {
      await this.client.clearActivity();
    } catch (error) {
      debugLog("Failed to clear Discord activity", error);
    }
  }

  private bindListeners(client: RpcClientLike): void {
    client.on("ready", () => {
      this.ready = true;
      this.reconnectAttempts = 0;
      this.needsClientRefresh = false;

      if (this.reconnectTimer) {
        this.cancel(this.reconnectTimer);
        this.reconnectTimer = null;
      }

      debugLog("Discord RPC connected");
      void this.flushPendingPresence();
    });

    client.on("disconnected", (...args: any[]) => {
      this.handleDisconnect("disconnected", ...args);
    });

    client.on("error", (...args: any[]) => {
      this.handleDisconnect("error", ...args);
    });
  }

  private handleDisconnect(reason: string, ...details: any[]): void {
    if (this.ready || !this.needsClientRefresh) {
      debugLog(`Discord RPC disconnected (${reason})`, ...details);
    }

    this.ready = false;
    this.needsClientRefresh = true;

    if (this.connectPromise) {
      this.connectPromise = null;
    }

    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || this.pendingPresence === null) {
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 5000);
    debugLog(`Scheduling reconnect attempt ${this.reconnectAttempts + 1} in ${delay}ms`);

    this.reconnectTimer = this.schedule(() => {
      this.reconnectTimer = null;
      void this.attemptReconnect();
    }, delay);
  }

  private async attemptReconnect(): Promise<void> {
    if (this.ready || this.pendingPresence === null) {
      return;
    }

    this.reconnectAttempts += 1;
    debugLog(`Attempting reconnect (${this.reconnectAttempts})...`);

    try {
      await this.connect();
    } catch (error) {
      debugLog("Reconnect attempt failed", error);
      this.scheduleReconnect();
    }
  }

  private refreshClient(): void {
    try {
      this.client.destroy?.();
    } catch {
      // best effort cleanup only
    }

    this.client = this.createClient();
    this.bindListeners(this.client);
    this.needsClientRefresh = false;
  }

  private async flushPendingPresence(): Promise<void> {
    if (!this.ready || !this.pendingPresence) {
      return;
    }

    try {
      await this.client.setActivity(buildActivity(this.pendingPresence));
    } catch (error) {
      this.handleDisconnect("flushPendingPresence_failed", error);
    }
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

function debugLog(message: string, ...details: unknown[]): void {
  if (!defaultConfig.debugLogging) {
    return;
  }

  console.log(`[pi-discord-presence] ${message}`, ...details);
}
