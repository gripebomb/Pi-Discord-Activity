---
phase: 02-presence-helper-hardening
plan: 01
subsystem: helper
tags: [discord-rpc, reconnect, resilience, presence]
requires: []
provides:
  - Automatic reconnect scheduling after Discord RPC disconnects
  - Queued latest presence while Discord is unavailable
  - Reapplication of queued presence after reconnect
affects: [runtime, verification]
tech-stack:
  added: []
  patterns: [dependency-injected rpc client for tests, exponential backoff reconnect]
key-files:
  created: [tests/helper/discord-reconnect.test.ts]
  modified: [src/helper/discord.ts]
key-decisions:
  - "Keep only the latest pending presence while disconnected instead of buffering every state transition."
  - "Use bounded reconnect retries with exponential backoff to avoid tight retry loops."
patterns-established:
  - "DiscordPresenceClient binds listeners once and shares a single in-flight connect promise"
  - "Helper reconnection is testable via injected RPC client and scheduler"
requirements-completed: [RUNT-03, RUNT-05]
duration: 30min
completed: 2026-04-19
---

# Phase 2 Plan 01 Summary

**Discord RPC reconnection with queued presence replay after transient disconnects**

## Accomplishments
- Added disconnect detection and bounded reconnect scheduling to the Discord RPC client.
- Preserved the latest intended presence while Discord is unavailable.
- Reapplied queued presence once the RPC connection is ready again.
- Added unit coverage for activity rendering, reconnect behavior, and retry limits.

## Files Created/Modified
- `src/helper/discord.ts` - reconnect scheduling, pending presence replay, testable activity builder exports
- `tests/helper/discord-reconnect.test.ts` - reconnect, retry, and activity rendering coverage

## Verification
- `npm test` passes
- `npm run build` passes
- `tests/helper/discord-reconnect.test.ts` verifies reconnect attempts and bounded exponential backoff

## Deviations from Plan
- Presence updates attempt an immediate reconnect on demand when `setPresence()` is called while disconnected, while still preserving scheduled retry behavior from disconnect events.

## Issues Encountered
- The RPC library needed dependency injection around the client and timer functions to make reconnect behavior testable under `node:test`.

## Next Phase Readiness
Wave 2 verification can now test the helper’s reconnect behavior without requiring live Discord for every iteration.
