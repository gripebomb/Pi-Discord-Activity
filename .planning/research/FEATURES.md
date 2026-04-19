# Feature Research

**Date:** 2026-04-19
**Scope:** Expected v1 capabilities for a Pi → Discord Rich Presence integration

## Core Feature Categories

### Integration

**Table stakes**
- Real Pi extension loads through Pi's supported extension discovery or package system
- Extension reacts to actual Pi lifecycle events instead of fake/dev hooks
- Model/provider changes update presence correctly
- Activity state changes between startup, thinking, tooling, idle, and error-like conditions

**Differentiators**
- More nuanced state transitions (for example distinguishing editing from other tool usage)
- Better reconnect behavior when helper or Discord restarts
- Richer extension UI feedback inside Pi when helper is unavailable

**Anti-features**
- Deep semantic transcript analysis to guess intent from arbitrary assistant text
- Tight coupling to internal undocumented Pi behavior instead of public extension events

**Complexity:** Medium
**Dependencies:** Requires understanding actual Pi event surface and mapping that surface into the shared payload

### Presence Display

**Table stakes**
- Presence shows Pi branding / app identity
- Presence shows provider and model
- Presence shows a concise activity state
- Privacy-first default hides project details unless explicitly enabled

**Differentiators**
- Optional project name display when privacy settings allow it
- Smarter provider image key mapping and fallbacks
- Better presence wording for tooling/editing/thinking transitions

**Anti-features**
- Prompt text in Discord
- File names or tool arguments in Discord
- Excessively verbose state strings that flicker during active work

**Complexity:** Low-Medium
**Dependencies:** Depends on stable internal payload normalization and Discord asset naming

### Local Runtime

**Table stakes**
- Helper receives valid payloads from the extension
- Helper debounces updates so Discord does not thrash
- Helper connects to Discord RPC and updates activity reliably
- Helper clears presence on shutdown

**Differentiators**
- Automatic helper reconnection and retry loops
- Health checks or explicit status reporting back to user
- Multi-session coordination if multiple Pi sessions are open

**Anti-features**
- Overengineered local infrastructure for a single-user v1
- Background service install automation before the integration itself is proven

**Complexity:** Medium
**Dependencies:** Depends on helper lifecycle, Discord desktop availability, and good edge-case handling

### Installation

**Table stakes**
- Clear local setup instructions for Discord app assets and client ID
- Clear instructions for where to place or install the Pi extension/package
- Clear helper startup instructions
- A reproducible verification path for confirming end-to-end presence updates

**Differentiators**
- `pi install` support from local path/git/npm package
- One-command setup scripts
- OS-specific service recipes

**Anti-features**
- Full installer UX before validating core integration
- Platform automation that hides failure modes during early development

**Complexity:** Low-Medium
**Dependencies:** Depends on final package/extension shape chosen for v1

## What Users Will Expect In v1

For a v1 like this, users will typically expect:
1. A real extension they can load in Pi
2. A helper process they can run locally
3. Presence updates that match actual Pi work
4. Simple setup steps that do not require reading code

## Suggested Milestone Boundaries

### Must-have for this milestone
- Real extension wiring to Pi events
- Useful default presence text: Pi + provider/model + activity state
- Privacy-first behavior
- Basic docs for install and verification

### Reasonable deferments
- Full package publishing automation
- Multi-session arbitration
- OS service integration
- Advanced activity heuristics

---
*Research output for requirements definition*
