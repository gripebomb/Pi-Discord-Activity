import test from "node:test";
import assert from "node:assert/strict";
import type { PresencePayload } from "../../src/shared/types.js";
import { createPresenceHandler, isRecoverableDiscordRuntimeError, performShutdown } from "../../src/helper/index.js";

function samplePayload(overrides: Partial<PresencePayload> = {}): PresencePayload {
  return {
    app: "pi-coding-agent",
    provider: "anthropic",
    model: "claude-sonnet-4-5",
    state: "thinking",
    startedAt: 1_700_000_000,
    privacyMode: true,
    ...overrides
  };
}

test("createPresenceHandler dedupes identical payloads and debounces rapid changes", async () => {
  const sent: PresencePayload[] = [];
  let currentTime = 0;
  let timerId = 0;
  const timers = new Map<number, () => void>();

  const { handlePresence } = createPresenceHandler(
    { setPresence: async (payload) => void sent.push(payload) } as any,
    2000,
    () => currentTime,
    ((fn: () => void) => {
      timerId += 1;
      timers.set(timerId, fn);
      return timerId as any;
    }) as typeof setTimeout,
    ((id: number) => {
      timers.delete(id);
    }) as typeof clearTimeout
  );

  await handlePresence(samplePayload({ state: "thinking" }));
  await handlePresence(samplePayload({ state: "thinking" }));
  assert.equal(sent.length, 1);

  currentTime = 500;
  await handlePresence(samplePayload({ state: "tooling" }));
  currentTime = 1000;
  await handlePresence(samplePayload({ state: "editing" }));
  assert.equal(sent.length, 1);
  assert.equal(timers.size, 1);

  currentTime = 3000;
  timers.values().next().value?.();
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(sent.length, 2);
  assert.equal(sent[1].state, "editing");
});

test("performShutdown flushes pending updates, clears presence, waits, and exits", async () => {
  let flushed = false;
  let slept = 0;
  let exitCode: number | null = null;
  let clearCalls = 0;

  await performShutdown(
    { clearPresence: async () => void (clearCalls += 1) } as any,
    () => {
      flushed = true;
    },
    (code) => {
      exitCode = code;
    },
    100,
    async (ms) => {
      slept = ms;
    },
    1,
    "test"
  );

  assert.equal(flushed, true);
  assert.equal(clearCalls, 1);
  assert.equal(slept, 100);
  assert.equal(exitCode, 1);
});

test("isRecoverableDiscordRuntimeError recognizes Discord IPC disconnect failures", () => {
  assert.equal(isRecoverableDiscordRuntimeError(new Error("Could not connect")), true);
  assert.equal(isRecoverableDiscordRuntimeError(new Error("connection closed")), true);
  assert.equal(
    isRecoverableDiscordRuntimeError({ message: "fetch failed", cause: { code: "ECONNREFUSED" } }),
    true
  );
  assert.equal(isRecoverableDiscordRuntimeError(new Error("totally unrelated bug")), false);
});
