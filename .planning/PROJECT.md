# pi-discord-presence

## What This Is

A Pi package/extension and local helper that connect real Pi activity to Discord Rich Presence. It is for Pi users who want Discord to reflect what Pi is doing locally, with privacy-first defaults and a simple setup flow.

## Core Value

Real Pi activity should appear reliably in Discord Rich Presence with minimal setup and without leaking sensitive project details by default.

## Requirements

### Validated

- ✓ Local helper daemon can receive presence updates over HTTP and forward them to Discord RPC - existing scaffold
- ✓ Shared payload schema and config exist for extension/helper communication - existing scaffold
- ✓ Extension-side lifecycle hook surface exists for session, model, and activity transitions - existing scaffold
- ✓ Privacy-first defaults exist for hiding project details unless explicitly enabled - existing scaffold

### Active

- [ ] Pi package/extension is wired to real Pi events instead of placeholder dev hooks
- [ ] Discord Rich Presence shows Pi + provider/model + activity state from real Pi sessions
- [ ] Installation/setup docs explain how to configure the Pi extension and local helper
- [ ] v1 installation is simple enough for another user to get running without packaging polish

### Out of Scope

- Cross-platform service automation and background service installers - defer until after v1 works end-to-end
- Distribution/package polish - defer until the real Pi integration and basic install flow are proven
- Showing prompt content, filenames, or other sensitive coding details in Discord - excluded for privacy

## Context

This repository already contains a starter scaffold with a split architecture: a Pi-side extension publishes normalized presence payloads to a local helper daemon, and the helper owns the Discord RPC connection. The current gap is that the extension still uses placeholder hooks rather than Pi's real extension/package APIs. The project is intended to be a real Pi package/extension first, then later hardened and packaged for easier distribution.

The desired v1 Discord display is the useful default: Pi + provider/model + activity state. Privacy should remain opt-in for showing extra context like project names.

## Constraints

- **Platform**: Local desktop integration - Discord desktop app must be running locally because Rich Presence uses local RPC
- **Privacy**: Privacy-first by default - project names and sensitive work details must stay hidden unless explicitly enabled
- **Architecture**: Existing split extension/helper design - preserve the local Pi extension to helper transport unless Pi integration reveals a better supported pattern
- **Scope**: Brownfield scaffold - build on the existing TypeScript codebase and codebase-map docs rather than restarting from scratch

## Key Decisions

| Decision | Rationale | Outcome |
| -------- | --------- | ------- |
| Build real Pi integration before distribution polish | A real extension/package is the prerequisite for useful installation and distribution work | - Pending |
| Use privacy-first defaults | Coding activity may contain sensitive project context; safer defaults reduce accidental leakage | - Pending |
| v1 presence shows Pi + provider/model + activity state | This is the most useful default signal without overexposing local project details | - Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check - still the right priority?
3. Audit Out of Scope - reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-19 after initialization*
