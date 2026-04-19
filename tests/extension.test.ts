import test from "node:test";
import assert from "node:assert/strict";
import extension from "../src/extension/index.js";

type Handler = (event: any, ctx: any) => Promise<void> | void;

function createMockPi() {
  const handlers = new Map<string, Handler>();

  return {
    api: {
      on(event: string, handler: Handler) {
        handlers.set(event, handler);
      }
    },
    handlers
  };
}

function createCtx(model = { provider: "openai", id: "gpt-5.4" }) {
  return {
    cwd: "/tmp/example-project",
    model,
    sessionManager: {
      getSessionId: () => "session-123",
      getSessionFile: () => "/tmp/session-123.jsonl"
    }
  };
}

test("extension registers all required Pi lifecycle handlers", () => {
  const pi = createMockPi();
  extension(pi.api as any);

  assert.deepEqual([...pi.handlers.keys()].sort(), [
    "agent_end",
    "agent_start",
    "model_select",
    "session_shutdown",
    "session_start",
    "tool_execution_end",
    "tool_execution_start"
  ]);
});

test("extension maps Pi lifecycle events into normalized presence payloads", async () => {
  const pi = createMockPi();
  extension(pi.api as any);

  const calls: any[] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (_input: URL | RequestInfo, init?: RequestInit) => {
    calls.push(JSON.parse(String(init?.body ?? "{}")));
    return new Response(null, { status: 204 });
  }) as typeof fetch;

  try {
    const ctx = createCtx();

    await pi.handlers.get("session_start")?.({ type: "session_start", reason: "startup" }, ctx);
    await pi.handlers.get("model_select")?.(
      {
        type: "model_select",
        model: { provider: "anthropic", id: "claude-sonnet-4-5" },
        previousModel: { provider: "openai", id: "gpt-5.4" },
        source: "set"
      },
      ctx
    );
    await pi.handlers.get("agent_start")?.({ type: "agent_start" }, ctx);
    await pi.handlers.get("tool_execution_start")?.(
      { type: "tool_execution_start", toolCallId: "1", toolName: "read", args: {} },
      ctx
    );
    await pi.handlers.get("tool_execution_end")?.(
      { type: "tool_execution_end", toolCallId: "1", toolName: "read", result: {}, isError: false },
      ctx
    );
    await pi.handlers.get("tool_execution_start")?.(
      { type: "tool_execution_start", toolCallId: "2", toolName: "edit", args: {} },
      ctx
    );
    await pi.handlers.get("tool_execution_end")?.(
      { type: "tool_execution_end", toolCallId: "2", toolName: "edit", result: {}, isError: false },
      ctx
    );
    await pi.handlers.get("agent_end")?.({ type: "agent_end", messages: [] }, ctx);
    await pi.handlers.get("session_shutdown")?.({ type: "session_shutdown" }, ctx);

    assert.equal(calls[0].state, "starting");
    assert.equal(calls[0].provider, "openai");
    assert.equal(calls[0].model, "gpt-5.4");
    assert.equal(calls[0].sessionId, "session-123");

    assert.equal(calls[1].provider, "anthropic");
    assert.equal(calls[1].model, "claude-sonnet-4-5");
    assert.equal(calls[2].state, "thinking");
    assert.equal(calls[3].state, "tooling");
    assert.equal(calls[4].state, "thinking");
    assert.equal(calls[5].state, "editing");
    assert.equal(calls[6].state, "thinking");
    assert.equal(calls[7].state, "idle");

    assert.equal(calls.length, 8, "session_shutdown should dedupe when already idle");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
