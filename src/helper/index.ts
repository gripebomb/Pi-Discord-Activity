import { DiscordPresenceClient } from "./discord.js";
import { createPresenceServer } from "./server.js";
import type { PresencePayload } from "../shared/types.js";
import { defaultConfig } from "../shared/config.js";

const discord = new DiscordPresenceClient();
let lastSentAt = 0;

async function handlePresence(payload: PresencePayload): Promise<void> {
  const now = Date.now();
  if (now - lastSentAt < defaultConfig.debounceMs) {
    return;
  }

  lastSentAt = now;
  await discord.setPresence(payload);
}

export async function startHelper(): Promise<void> {
  await discord.connect();
  createPresenceServer(handlePresence);

  const shutdown = async () => {
    await discord.clearPresence();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());
}
