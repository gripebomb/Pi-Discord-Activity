import RPC from "discord-rpc";
import type { PresencePayload } from "../shared/types.js";
import { defaultConfig } from "../shared/config.js";

RPC.register(defaultConfig.rpcClientId);

export class DiscordPresenceClient {
  private readonly client = new RPC.Client({ transport: "ipc" });
  private ready = false;

  async connect(): Promise<void> {
    if (this.ready) return;

    this.client.on("ready", () => {
      this.ready = true;
      console.log("Discord RPC connected");
    });

    await this.client.login({ clientId: defaultConfig.rpcClientId });
  }

  async setPresence(payload: PresencePayload): Promise<void> {
    if (!this.ready) {
      await this.connect();
    }

    const stateParts = [payload.model, humanizeState(payload.state)];
    if (!payload.privacyMode && payload.projectName && defaultConfig.includeProjectName) {
      stateParts.push(payload.projectName);
    }

    await this.client.setActivity({
      details: `Using ${defaultConfig.appName}`,
      state: stateParts.join(" • "),
      startTimestamp: payload.startedAt,
      largeImageKey: "pi",
      largeImageText: defaultConfig.appName,
      smallImageKey: normalizeKey(payload.provider),
      smallImageText: payload.provider
    });
  }

  async clearPresence(): Promise<void> {
    if (!this.ready) return;
    await this.client.clearActivity();
  }
}

function humanizeState(state: PresencePayload["state"]): string {
  return {
    starting: "Starting",
    thinking: "Thinking",
    tooling: "Running Tools",
    editing: "Editing Files",
    idle: "Idle",
    error: "Error"
  }[state];
}

function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_]/g, "-");
}
