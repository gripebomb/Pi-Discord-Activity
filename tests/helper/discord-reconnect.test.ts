import test from "node:test";
import assert from "node:assert/strict";
import type { PresencePayload } from "../../src/shared/types.js";
import { buildActivity, DiscordPresenceClient, humanizeState, normalizeKey } from "../../src/helper/discord.js";

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

class FakeRpcClient {
  handlers = new Map<string, Array<(...args: any[]) => void>>();
  loginCalls = 0;
  activities: Array<Record<string, unknown>> = [];
  failLogins = 0;

  on(event: string, listener: (...args: any[]) => void) {
    const existing = this.handlers.get(event) ?? [];
    existing.push(listener);
    this.handlers.set(event, existing);
  }

  async login(): Promise<void> {
    this.loginCalls += 1;
    if (this.failLogins > 0) {
      this.failLogins -= 1;
      throw new Error("login failed");
    }
    this.emit("ready");
  }

  async setActivity(activity: Record<string, unknown>): Promise<void> {
    this.activities.push(activity);
  }

  async clearActivity(): Promise<void> {}

  emit(event: string, ...args: any[]) {
    for (const listener of this.handlers.get(event) ?? []) {
      listener(...args);
    }
  }
}

test("Discord presence activity renders Pi identity, provider/model, and state", () => {
  const activity = buildActivity(samplePayload());

  assert.equal(activity.largeImageKey, "pi");
  assert.equal(activity.largeImageText, "Pi Coding Agent");
  assert.equal(activity.smallImageKey, "anthropic");
  assert.equal(activity.smallImageText, "anthropic");
  assert.equal(activity.details, "Using Pi Coding Agent");
  assert.equal(activity.state, "claude-sonnet-4-5 • Thinking");
  assert.equal(humanizeState("editing"), "Editing Files");
  assert.equal(normalizeKey("OpenAI/GPT"), "openai-gpt");
});

test("DiscordPresenceClient reconnects after disconnect and reapplies queued presence", async () => {
  const rpc = new FakeRpcClient();
  const scheduled: Array<{ delay: number; run: () => void }> = [];
  const client = new DiscordPresenceClient(
    rpc,
    ((fn: () => void, delay?: number) => {
      scheduled.push({ delay: delay ?? 0, run: fn });
      return scheduled.length as any;
    }) as typeof setTimeout,
    (() => {}) as typeof clearTimeout
  );

  await client.connect();
  await client.setPresence(samplePayload({ state: "thinking" }));
  assert.equal(rpc.activities.length, 1);

  rpc.emit("disconnected");
  await client.setPresence(samplePayload({ state: "tooling" }));

  assert.equal(scheduled.length, 1);
  assert.equal(scheduled[0].delay, 1000);
  assert.equal(rpc.activities.at(-1)?.state, "claude-sonnet-4-5 • Running Tools");

  scheduled[0].run();
  await new Promise((resolve) => setImmediate(resolve));

  assert.ok(rpc.loginCalls >= 2);
  assert.equal(rpc.activities.at(-1)?.state, "claude-sonnet-4-5 • Running Tools");
});

test("DiscordPresenceClient stops reconnecting after max retries", async () => {
  const rpc = new FakeRpcClient();
  rpc.failLogins = 10;
  const scheduled: Array<{ delay: number; run: () => void }> = [];
  const client = new DiscordPresenceClient(
    rpc,
    ((fn: () => void, delay?: number) => {
      scheduled.push({ delay: delay ?? 0, run: fn });
      return scheduled.length as any;
    }) as typeof setTimeout,
    (() => {}) as typeof clearTimeout
  );

  try {
    await client.connect();
  } catch {}

  rpc.emit("disconnected");
  for (let i = 0; i < 4 && scheduled[i]; i += 1) {
    scheduled[i].run();
    await new Promise((resolve) => setImmediate(resolve));
  }

  assert.equal(scheduled.map((entry) => entry.delay).slice(0, 3).join(","), "1000,2000,4000");
  assert.equal(rpc.loginCalls, 4);
});
