import test from "node:test";
import assert from "node:assert/strict";
import { createPresenceServer } from "../../src/helper/server.js";
import { publishPresence } from "../../src/extension/transport.js";
import type { PresencePayload } from "../../src/shared/types.js";

test("extension transport sends payloads that helper server accepts end-to-end", async () => {
  let received: PresencePayload | null = null;
  const config = { serverHost: "127.0.0.1", serverPort: 42668 };

  const server = createPresenceServer(async (payload) => {
    received = payload;
  }, config);

  try {
    await new Promise((resolve) => setTimeout(resolve, 25));

    await publishPresence({
      app: "pi-coding-agent",
      provider: "anthropic",
      model: "claude-sonnet-4-5",
      state: "thinking",
      startedAt: Math.floor(Date.now() / 1000),
      sessionId: "session-e2e",
      privacyMode: true
    }, config);

    assert.equal(received?.provider, "anthropic");
    assert.equal(received?.model, "claude-sonnet-4-5");
    assert.equal(received?.state, "thinking");
    assert.equal(received?.sessionId, "session-e2e");
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
});
