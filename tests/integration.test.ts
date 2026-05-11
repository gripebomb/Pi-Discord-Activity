import test from "node:test";
import assert from "node:assert/strict";
import { createPresenceServer } from "../src/helper/server.js";
import { publishPresence } from "../src/extension/transport.js";
import type { PresencePayload } from "../src/shared/types.js";

test("transport publishes payloads the helper server accepts", async () => {
  let received: PresencePayload | null = null;
  const config = { serverHost: "127.0.0.1", serverPort: 42667 };

  const server = createPresenceServer(async (payload) => {
    received = payload;
  }, async () => {}, config);

  try {
    await new Promise((resolve) => setTimeout(resolve, 25));

    await publishPresence({
      app: "pi-coding-agent",
      provider: "openai",
      model: "gpt-5.4",
      state: "thinking",
      startedAt: Math.floor(Date.now() / 1000),
      sessionId: "session-integration",
      privacyMode: true
    }, config);

    assert.equal(received?.provider, "openai");
    assert.equal(received?.model, "gpt-5.4");
    assert.equal(received?.state, "thinking");
    assert.equal(received?.sessionId, "session-integration");
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
});
