import test from "node:test";
import assert from "node:assert/strict";
import { PresenceState } from "../src/extension/state.js";

test("PresenceState starts sessions with privacy defaults", () => {
  const state = new PresenceState();
  const payload = state.startSession({
    sessionId: "session-1",
    provider: "openai",
    model: "gpt-5.4"
  });

  assert.equal(payload.app, "pi-coding-agent");
  assert.equal(payload.sessionId, "session-1");
  assert.equal(payload.provider, "openai");
  assert.equal(payload.model, "gpt-5.4");
  assert.equal(payload.state, "starting");
  assert.equal(payload.privacyMode, true);
  assert.equal(payload.projectName, undefined);
});

test("PresenceState updates activities without losing model identity", () => {
  const state = new PresenceState();
  state.startSession({ sessionId: "session-2", provider: "anthropic", model: "claude-sonnet-4-5" });

  const payload = state.setActivity("thinking");

  assert.equal(payload.provider, "anthropic");
  assert.equal(payload.model, "claude-sonnet-4-5");
  assert.equal(payload.state, "thinking");
});

test("PresenceState keeps projectName hidden by default even when provided", () => {
  const state = new PresenceState();
  const payload = state.startSession({
    sessionId: "session-3",
    provider: "openai",
    model: "gpt-5.4",
    projectName: "secret-project"
  });

  assert.equal(payload.privacyMode, true);
  assert.equal(payload.projectName, undefined);
});

test("PresenceState allows privacy mode to be explicitly disabled in payload state", () => {
  const state = new PresenceState();
  const payload = state.startSession({
    sessionId: "session-4",
    provider: "openai",
    model: "gpt-5.4",
    privacyMode: false
  });

  assert.equal(payload.privacyMode, false);
});
