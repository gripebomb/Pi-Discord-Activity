import { DiscordPresenceClient } from "./discord.js";
import { createPresenceServer } from "./server.js";
import type { PresencePayload } from "../shared/types.js";
import { defaultConfig } from "../shared/config.js";

const RECOVERABLE_DISCORD_ERROR_PATTERNS = [
  "Could not connect",
  "connection closed",
  "ECONNREFUSED",
  "EPIPE",
  "socket hang up"
];

const discord = new DiscordPresenceClient();

export function createPresenceHandler(
  client: Pick<DiscordPresenceClient, "setPresence">,
  debounceMs = defaultConfig.debounceMs,
  now: () => number = Date.now,
  schedule: typeof setTimeout = setTimeout,
  cancel: typeof clearTimeout = clearTimeout
) {
  let lastSentAt = 0;
  let lastSentPayload: PresencePayload | null = null;
  let pendingPayload: PresencePayload | null = null;
  let pendingUpdate: ReturnType<typeof setTimeout> | null = null;

  async function sendPresence(payload: PresencePayload): Promise<void> {
    lastSentAt = now();
    lastSentPayload = payload;
    pendingPayload = null;
    await client.setPresence(payload);
  }

  function isEquivalent(a: PresencePayload | null, b: PresencePayload): boolean {
    return !!a && a.state === b.state && a.model === b.model && a.provider === b.provider && a.projectName === b.projectName;
  }

  async function handlePresence(payload: PresencePayload): Promise<void> {
    if (pendingUpdate) {
      cancel(pendingUpdate);
      pendingUpdate = null;
    }

    if (isEquivalent(lastSentPayload, payload)) {
      pendingPayload = null;
      return;
    }

    pendingPayload = payload;
    const timeSinceLastSend = now() - lastSentAt;

    if (lastSentPayload && timeSinceLastSend < debounceMs) {
      pendingUpdate = schedule(() => {
        const nextPayload = pendingPayload;
        pendingUpdate = null;
        if (!nextPayload || isEquivalent(lastSentPayload, nextPayload)) {
          return;
        }
        void sendPresence(nextPayload);
      }, debounceMs);
      return;
    }

    await sendPresence(payload);
  }

  function flushPendingUpdate(): void {
    if (pendingUpdate) {
      cancel(pendingUpdate);
      pendingUpdate = null;
    }
    pendingPayload = null;
  }

  return { handlePresence, flushPendingUpdate };
}

export async function performShutdown(
  client: Pick<DiscordPresenceClient, "clearPresence">,
  flushPendingUpdate: () => void,
  exit: (code: number) => never | void = process.exit,
  delayMs = 100,
  sleep: (ms: number) => Promise<void> = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  exitCode = 0,
  reason?: string
): Promise<void> {
  if (reason && defaultConfig.debugLogging) {
    console.log(`Received ${reason}, shutting down gracefully...`);
  }

  flushPendingUpdate();
  await client.clearPresence();
  await sleep(delayMs);
  if (defaultConfig.debugLogging) {
    console.log("Shutdown complete");
  }
  exit(exitCode);
}

export function isRecoverableDiscordRuntimeError(error: unknown): boolean {
  const seen = new Set<unknown>();
  let current = error;

  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);

    const message = current instanceof Error ? current.message : String(current);
    const code = "code" in current && typeof (current as { code?: unknown }).code === "string" ? (current as { code: string }).code : "";

    if (
      RECOVERABLE_DISCORD_ERROR_PATTERNS.some((pattern) => message.includes(pattern)) ||
      RECOVERABLE_DISCORD_ERROR_PATTERNS.some((pattern) => code.includes(pattern))
    ) {
      return true;
    }

    current = "cause" in current ? (current as { cause?: unknown }).cause : undefined;
  }

  if (typeof error === "string") {
    return RECOVERABLE_DISCORD_ERROR_PATTERNS.some((pattern) => error.includes(pattern));
  }

  return false;
}

export async function startHelper(): Promise<void> {
  const { handlePresence, flushPendingUpdate } = createPresenceHandler(discord);
  createPresenceServer(handlePresence);

  void discord.connect().catch((error) => {
    if (defaultConfig.debugLogging) {
      console.log("[pi-discord-presence] Discord RPC unavailable at startup; helper will retry on next presence update", error);
    }
  });

  process.on("SIGINT", () => {
    void performShutdown(discord, flushPendingUpdate, process.exit, 100, undefined, 0, "SIGINT");
  });
  process.on("SIGTERM", () => {
    void performShutdown(discord, flushPendingUpdate, process.exit, 100, undefined, 0, "SIGTERM");
  });
  process.on("uncaughtException", (error) => {
    if (isRecoverableDiscordRuntimeError(error)) {
      console.warn("[pi-discord-presence] Recoverable Discord runtime exception:", error);
      return;
    }

    console.error("[pi-discord-presence] Uncaught exception:", error);
    void performShutdown(discord, flushPendingUpdate, process.exit, 100, undefined, 1, "uncaughtException");
  });
  process.on("unhandledRejection", (reason, promise) => {
    if (isRecoverableDiscordRuntimeError(reason)) {
      console.warn("[pi-discord-presence] Recoverable Discord runtime rejection:", reason);
      return;
    }

    console.error("[pi-discord-presence] Unhandled rejection at:", promise, "reason:", reason);
    void performShutdown(discord, flushPendingUpdate, process.exit, 100, undefined, 1, "unhandledRejection");
  });
}
