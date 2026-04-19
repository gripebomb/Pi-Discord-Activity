# State

**Project:** pi-discord-presence
**Core Value:** Real Pi activity should appear reliably in Discord Rich Presence with minimal setup and without leaking sensitive project details by default.

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-04-19 after initialization)

**Core value:** Real Pi activity should appear reliably in Discord Rich Presence with minimal setup and without leaking sensitive project details by default.
**Current focus:** Not started (defining roadmap)

## Current Position

Phase: Not started (roadmap defined)
Plan: -
Status: Roadmap created, ready to begin Phase 1
Last activity: 2026-04-19 - Roadmap created with 3 phases

## Milestone Progress

| Phase | Status | Plans | Progress |
| ----- | ------ | ----- | -------- |
| 1 | ○ | 0/0 | 0% |
| 2 | ○ | 0/0 | 0% |
| 3 | ○ | 0/0 | 0% |

## Accumulated Context

- **Phase 1 goal:** Real Pi extension wiring — get Pi to load and react to real lifecycle events, map them into presence payloads, and publish to the helper
- **Phase 2 goal:** Presence + helper hardening — make Discord Rich Presence reliable with stable state transitions, debouncing, reconnection, and privacy controls
- **Phase 3 goal:** Install + docs + verification — make the integration installable via `pi install`, with clear setup and verification docs

## Blockers

(None yet)

## Notes

- This is a YOLO-mode project; plans are auto-approved and execution runs immediately
- Parallel execution is enabled; independent plans can run simultaneously
- Git tracking is enabled for planning docs
- The extension uses a split design: extension module for Pi events, helper daemon for Discord RPC
- Privacy-first defaults hide project details unless `PI_PRESENCE_PRIVACY_MODE=false` and `PI_PRESENCE_INCLUDE_PROJECT=true`