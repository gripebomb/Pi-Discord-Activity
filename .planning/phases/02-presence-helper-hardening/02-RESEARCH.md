# Phase 2 Research: Presence + Helper Hardening

**Date:** 2026-04-19
**Phase:** 2 - Presence + Helper Hardening
**Focus:** Make Discord Rich Presence reliable, stable, and correct

---

## Research Summary

This phase addresses hardening the Discord RPC integration to handle real-world conditions: disconnection/reconnection, rapid state changes, graceful shutdown, and privacy controls.

---

## Current Implementation Analysis

### Extension Side (src/extension/)

**`state.ts` - PresenceState**
- Maintains current payload with privacy gating in `createBasePayload()`
- Privacy defaults: `privacyMode: true`, `includeProjectName: false`
- `snapshot()` returns immutable copy for publishing

**`transport.ts` - publishPresence()**
- HTTP POST to helper with 2000ms timeout
- Validates payload with Zod before sending
- Throws on failure (handled by callers in index.ts)

**`index.ts` - Extension lifecycle**
- 7-event wiring: session_start, model_select, agent_start, tool_execution_start, tool_execution_end, agent_end, session_shutdown
- Deduplication via `lastPublishedKey` comparison
- Graceful error handling per event

### Helper Side (src/helper/)

**`discord.ts` - DiscordPresenceClient**
```typescript
// Current issues:
- Single connect() with no reconnection logic
- No error handlers for disconnect events
- setPresence() doesn't check connection state
- No queueing of updates during disconnection
```

**`index.ts` - Helper entrypoint**
```typescript
// Current debounce implementation:
- 2000ms minimum between presence updates
- Uses Date.now() comparison, not sliding window
- SIGINT/SIGTERM handlers call clearPresence() before exit
```

**`server.ts` - HTTP server**
- Minimal: validates Zod, calls onPresence callback
- No request queuing or buffering

---

## Key Technical Findings

### 1. Discord RPC Reconnection Strategy

**discord-rpc library behavior:**
- Uses IPC transport (default on desktop)
- `client.login({ clientId })` connects once
- No built-in auto-reconnect
- Disconnect events: `disconnected` on RPC client

**Recommended approach:**
1. Listen for `disconnected` event on RPC client
2. Set `ready = false`
3. Implement exponential backoff reconnection (max 3 retries, 1s-5s delays)
4. Queue presence updates during reconnection attempts
5. On reconnect, apply last queued presence

**Reference pattern (not in discord-rpc docs but common):**
```typescript
this.client.on("disconnected", () => {
  this.ready = false;
  this.scheduleReconnect();
});
```

### 2. Debounce Sufficiency

**Current: 2000ms in helper/index.ts**
- Simple `now - lastSentAt < debounceMs` check
- Problem: Rapid tool calls (edit, write) can still cause flickering
- Tool execution pattern: tool_start → tool_end → tool_start → tool_end

**Recommended improvement:**
- Sliding window debounce: reset timer on each update
- Minimum 2000ms between Discord state *changes* (not updates)
- If state reverts quickly (e.g., thinking → tooling → thinking), consolidate

**Phase 1 observation:** 7-event lifecycle with debounce already in place. Phase 2 needs to ensure:
- Discord does not flicker during rapid state transitions
- Presence reflects the *stable* state, not transitional states

### 3. Presence Display Quality

**Current mapping (discord.ts setPresence):**
```typescript
details: `Using ${defaultConfig.appName}`  // "Using Pi Coding Agent"
state: [model, humanized_state, projectName?].join(" • ")
// Example: "anthropic/claude-3-5-sonnet • Thinking"
// Example with project: "anthropic/claude-3-5-sonnet • Thinking • my-project"
```

**PRES-01, PRES-02, PRES-03 satisfaction:**
- PRES-01 (Pi identity): ✓ via largeImageKey/text
- PRES-02 (provider/model): ✓ via state field and smallImageKey/text
- PRES-03 (activity state): ✓ via humanized state in state field

### 4. Privacy Controls Verification

**Current implementation:**
```typescript
// config.ts
privacyMode: process.env.PI_PRESENCE_PRIVACY_MODE !== "false"  // Default: true
includeProjectName: process.env.PI_PRESENCE_INCLUDE_PROJECT === "true"  // Default: false

// state.ts createBasePayload()
const includeProjectName = !privacyMode && defaultConfig.includeProjectName;
if (includeProjectName) {
  payload.projectName = partial.projectName ?? process.cwd().split(/[\\/]/).pop();
}
```

**PRES-04, PRES-05 satisfaction:**
- PRES-04 (hidden by default): ✓ privacyMode defaults to true
- PRES-05 (opt-in project name): ✓ includeProjectName requires explicit true

**Testing needed:**
- Verify project name hidden when neither env var set
- Verify project name shown when `PI_PRESENCE_PRIVACY_MODE=false` AND `PI_PRESENCE_INCLUDE_PROJECT=true`
- Verify project name hidden when `PI_PRESENCE_PRIVACY_MODE=false` but `PI_PRESENCE_INCLUDE_PROJECT` unset

### 5. Graceful Shutdown Coverage

**Current shutdown handling:**
```typescript
// helper/index.ts
process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
// Also: session_shutdown event in extension publishes "idle" state

// discord.ts clearPresence()
async clearPresence(): Promise<void> {
  if (!this.ready) return;
  await this.client.clearActivity();
}
```

**RUNT-04 satisfaction:** ✓ SIGINT/SIGTERM handlers exist
**RUNT-04 gap:** Process.exit() may not allow Discord RPC to flush

**Recommended improvement:**
- Add small delay (100ms) after clearPresence() before exit
- Handle uncaught exceptions: log + clear presence + exit
- Handle unhandled rejections: log + clear presence + exit

### 6. Reconnection Testing

**RUNT-05 requires:**
- Test by restarting Discord desktop app while helper runs
- Verify helper detects disconnection and reconnects
- Verify presence is restored after reconnection

---

## Implementation Recommendations

### High Priority (RUNT-03, RUNT-05 - Connection Reliability)

1. **Add disconnected event handler to DiscordPresenceClient**
   ```typescript
   private reconnectAttempts = 0;
   private readonly maxReconnectAttempts = 3;
   
   this.client.on("disconnected", () => {
     this.ready = false;
     this.attemptReconnect();
   });
   ```

2. **Implement reconnect with exponential backoff**
   ```typescript
   private async attemptReconnect(): Promise<void> {
     if (this.reconnectAttempts >= this.maxReconnectAttempts) {
       console.log("Max reconnection attempts reached");
       return;
     }
     
     const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 5000);
     await new Promise(r => setTimeout(r, delay));
     
     try {
       await this.client.login({ clientId: defaultConfig.rpcClientId });
       this.ready = true;
       this.reconnectAttempts = 0;
     } catch (error) {
       this.reconnectAttempts++;
       await this.attemptReconnect();
     }
   }
   ```

### Medium Priority (RUNT-02 - Debounce)

3. **Improve debounce to prevent flicker**
   - Consider sliding window or state-consolidating debounce
   - Only update Discord if state actually changed from last sent state

### Low Priority (Polish)

4. **Add shutdown grace period**
5. **Add connection status logging**

---

## Validation Architecture

**Testing strategy for Phase 2:**

1. **Unit tests:**
   - DiscordPresenceClient reconnection logic
   - Debounce behavior with rapid state changes
   - Privacy default verification

2. **Integration tests:**
   - Helper + mock Discord RPC
   - Shutdown sequence verification
   - Reconnection during active presence

3. **Manual verification:**
   - Live test: restart Discord while helper running
   - Live test: rapid tool calls, observe no flicker
   - Live test: toggle privacy env vars, verify behavior

---

## Gap Analysis

| Requirement | Current State | Gap | Plan Needed |
|------------|---------------|-----|-------------|
| PRES-01 | ✓ Implemented | None | None |
| PRES-02 | ✓ Implemented | None | None |
| PRES-03 | ✓ Implemented | None | None |
| PRES-04 | ✓ Implemented | None | None |
| PRES-05 | ✓ Implemented | None | None |
| RUNT-02 | ⚠ Debounce exists | May flicker with rapid tool calls | Improve debounce logic |
| RUNT-03 | ⚠ Single connect | No reconnection on Discord restart | Add reconnect handler |
| RUNT-04 | ⚠ Basic shutdown | No delay flush, no uncaught handlers | Add graceful shutdown |
| RUNT-05 | ✗ Not implemented | No reconnection logic | Implement reconnection |

**Conclusion:** Core presence display (PRES-01 to PRES-05) is implemented. Runtime hardening (RUNT-02 to RUNT-05) needs significant work, particularly reconnection logic.

---

*Research complete: 2026-04-19*
