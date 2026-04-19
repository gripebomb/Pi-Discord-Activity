# Research Summary

**Date:** 2026-04-19
**Project:** pi-discord-presence
**Focus:** Replace placeholder hooks with a real Pi extension/package integration, keep privacy-first Discord presence, and make local setup reproducible.

## Key Findings

### Stack additions
- The correct integration surface is a real Pi extension exporting `default function (pi: ExtensionAPI)` from `@mariozechner/pi-coding-agent`
- The current helper split is still appropriate for v1 because Discord Rich Presence is local RPC and the helper already encapsulates that concern well
- The repo should add Pi package metadata in `package.json` now so later distribution via `pi install` is straightforward

### Table stakes for this milestone
- Loadable Pi extension/package using Pi's documented extension discovery/package system
- Real event wiring for session start, model changes, active work, and idle transitions
- Discord presence showing Pi + provider/model + activity state
- Privacy-first defaults with project details hidden unless explicitly enabled
- Clear setup and verification docs

### Watch out for
- Using placeholder or imagined hooks instead of Pi's documented extension events
- Over-publishing noisy state transitions and making Discord flicker
- Letting helper/Discord errors break normal Pi usage
- Shipping a repo that works only in dev mode but not via real Pi package/extension loading

## Recommended v1 direction

1. Refactor `src/extension/index.ts` into the real Pi extension entrypoint
2. Reuse the current state + transport + helper architecture
3. Normalize Pi events into a small activity state machine
4. Add Pi package metadata and installation docs
5. Validate the full flow from clean setup to Discord presence update

## Suggested phase shape

- **Phase 1:** Real Pi extension wiring and payload mapping
- **Phase 2:** Helper hardening and end-to-end verification
- **Phase 3:** Package/install shape and user-facing setup docs

---
*Synthesized from STACK.md, FEATURES.md, ARCHITECTURE.md, and PITFALLS.md*
