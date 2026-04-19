# Pitfalls Research

**Date:** 2026-04-19
**Scope:** Common mistakes when adding real Pi event integration to an existing Discord presence scaffold

## Pitfall 1: Building against imagined Pi hooks instead of documented extension events
- **Why it happens:** The scaffold already has custom functions like `onThinking()` and `onToolCall()`, which can feel close enough to the real thing.
- **Warning signs:** The code compiles, but no real Pi session updates ever reach Discord.
- **Prevention:** Replace the placeholder API with a real `default function (pi: ExtensionAPI)` entry and documented hooks from `extensions.md`.
- **Phase to address:** Earliest implementation phase

## Pitfall 2: Over-reporting state changes and making Discord flicker
- **Why it happens:** Pi emits multiple events across one user request, especially around tool execution.
- **Warning signs:** Discord state changes too frequently, or ends in the wrong final state after tools finish.
- **Prevention:** Normalize events to a small state machine and suppress duplicate publishes. Keep helper debounce, but ensure final idle transitions still get through.
- **Phase to address:** Integration phase

## Pitfall 3: Treating presence failures as fatal to Pi usage
- **Why it happens:** Fetch failures to the local helper or Discord RPC login failures may throw directly.
- **Warning signs:** Presence issues interrupt normal Pi workflows or spam hard errors.
- **Prevention:** Make presence best-effort. Log clearly, but avoid breaking the main Pi experience when Discord or helper is unavailable.
- **Phase to address:** Integration and hardening phases

## Pitfall 4: Forgetting package/runtime install constraints
- **Why it happens:** Local dev with `tsx` can mask what Pi package installs actually need at runtime.
- **Warning signs:** Works in repo dev mode, fails when loaded as a package or from a clean machine.
- **Prevention:** Ensure runtime dependencies are in `dependencies`, add Pi package metadata early, and validate the local install flow from a fresh-like setup.
- **Phase to address:** Install/docs phase

## Pitfall 5: Leaking more context than intended
- **Why it happens:** It's tempting to include project names, files, or prompts to make the presence more interesting.
- **Warning signs:** Discord shows local project details unexpectedly or privacy settings are easy to bypass accidentally.
- **Prevention:** Default to hidden project details and require explicit opt-in for project name inclusion. Never send prompts or filenames.
- **Phase to address:** Requirements and implementation phases

## Pitfall 6: No clear verification path
- **Why it happens:** The system spans Pi events, a localhost transport, a helper daemon, and Discord desktop.
- **Warning signs:** Hard to tell whether a failure is in event wiring, helper startup, RPC auth/assets, or docs.
- **Prevention:** Document a step-by-step test flow: start helper, load extension, trigger known Pi actions, confirm expected Discord state transitions.
- **Phase to address:** Docs and validation phases

## Priority Recommendations

1. First prove real Pi event wiring with a narrow set of supported states
2. Then stabilize helper error handling and final-state behavior
3. Then document exact install and verification steps
4. Save distribution polish for after the above is reliable

---
*Research output to reduce implementation risk*
