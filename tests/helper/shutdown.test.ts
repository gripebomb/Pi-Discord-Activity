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
    { setPresence: async (payload) => void sent.push(payload), clearPresence: async () => {} } as any,
    2000,
    () => currentTime,
    ((fn: () => void) => {
      timerId += 1;
      timers.set(timerId, fn);
      return timerId as any;
    }) as typeof setTimeout,
    ((id: number) => {
      timers.delete(id);
    }) as typeof clearTimeout,
    0
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

test("createPresenceHandler clears Discord presence after timeout with no updates", async () => {
  let clearCalls = 0;
  let currentTime = 0;
  let timerId = 0;
  const timers = new Map<number, { fn: () => void; delay: number }>();

  const { handlePresence } = createPresenceHandler(
    {
      setPresence: async () => {},
      clearPresence: async () => void (clearCalls += 1)
    } as any,
    2000,
    () => currentTime,
    ((fn: () => void, delay?: number) => {
      timerId += 1;
      timers.set(timerId, { fn, delay: delay ?? 0 });
      return timerId as any;
    }) as typeof setTimeout,
    ((id: number) => {
      timers.delete(id);
    }) as typeof clearTimeout,
    10_000
  );

  await handlePresence(samplePayload({ state: "thinking" }));
  assert.equal(timers.size, 1);
  assert.equal(clearCalls, 0);

  currentTime = 5_000;
  await handlePresence(samplePayload({ state: "editing" }));
  // timeout timer should have been restarted, so still 1 timer
  assert.equal(timers.size, 1);
  assert.equal(clearCalls, 0);

  currentTime = 20_000;
  const timeoutEntry = [...timers.values()].find((t) => t.delay === 10_000);
  assert.ok(timeoutEntry);
  timeoutEntry.fn();
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(clearCalls, 1);
});

test("createPresenceHandler handleClear resets state and clears Discord presence", async () => {
  let clearCalls = 0;
  const sent: PresencePayload[] = [];
  let currentTime = 0;
  let timerId = 0;
  const timers = new Map<number, { fn: () => void; delay: number }>();

  const { handlePresence, handleClear } = createPresenceHandler(
    {
      setPresence: async (payload) => void sent.push(payload),
      clearPresence: async () => void (clearCalls += 1)
    } as any,
    2000,
    () => currentTime,
    ((fn: () => void, delay?: number) => {
      timerId += 1;
      timers.set(timerId, { fn, delay: delay ?? 0 });
      return timerId as any;
    }) as typeof setTimeout,
    ((id: number) => {
      timers.delete(id);
    }) as typeof clearTimeout,
    10_000
  );

  await handlePresence(samplePayload({ state: "thinking" }));
  assert.equal(sent.length, 1);
  assert.equal(timers.size, 1);

  await handleClear();
  assert.equal(clearCalls, 1);
  assert.equal(timers.size, 0);

  // After clear, identical payload should be sent again because state was reset
  await handlePresence(samplePayload({ state: "thinking" }));
  assert.equal(sent.length, 2);
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
