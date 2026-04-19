# Stack Research

**Date:** 2026-04-19
**Scope:** Real Pi extension/package integration for Discord Rich Presence
**Milestone context:** Subsequent milestone - build on existing scaffold, focus only on what is needed to replace placeholder hooks with real Pi runtime integration and prepare simple installability.

## Recommended Stack Additions

### 1. Pi extension runtime using `@mariozechner/pi-coding-agent`
- **Recommendation:** Build the Pi integration as a real extension that exports `default function (pi: ExtensionAPI)` and subscribes to Pi lifecycle events.
- **Version target:** Compatible with installed Pi `@mariozechner/pi-coding-agent` **0.67.68**
- **Why:** Pi extensions are the supported integration surface for session, model, tool, and message lifecycle hooks. The current scaffold already matches the right conceptual split, but its `src/extension/index.ts` is still a custom placeholder rather than a Pi extension factory.
- **Integration points:** `session_start`, `model_select`, `tool_execution_start`, `tool_execution_end`, `agent_start`, `agent_end`, `session_shutdown`
- **Confidence:** High

### 2. Pi package manifest in `package.json`
- **Recommendation:** Add a `pi` manifest and `pi-package` keyword so the repo can be installed through `pi install` later.
- **Suggested shape:**
  ```json
  {
    "keywords": ["pi-package"],
    "pi": {
      "extensions": ["./src/extension/index.ts"]
    }
  }
  ```
- **Why:** Pi packages are the supported distribution mechanism for sharing extensions through npm, git, or local paths. This supports the user's planned second step (distribution) without requiring full polish in v1.
- **Confidence:** High

### 3. Keep helper daemon as a separate local process for v1
- **Recommendation:** Preserve the helper process that owns Discord RPC.
- **Library:** `discord-rpc` `^4.0.1` (already present)
- **Why:** Discord Rich Presence is local desktop RPC. Keeping Discord connection handling outside the Pi extension avoids coupling extension lifecycle directly to Discord IPC details and matches the current scaffold architecture.
- **Confidence:** Medium-High

### 4. Shared validated payload contract
- **Recommendation:** Keep the shared Zod contract in `src/shared/types.ts` and expand it only as needed for real Pi events.
- **Library:** `zod` `^3.24.2` (already present)
- **Why:** The HTTP boundary between extension and helper benefits from strict validation. Pi event objects and Discord activity formatting are both easier to evolve safely with a normalized internal payload.
- **Confidence:** High

## Event Mapping Guidance

### Best-supported v1 mapping
- `session_start` → initialize session identity and set state to `starting`
- `model_select` → update provider/model labels
- `agent_start` or early turn lifecycle → move to `thinking`
- `tool_execution_start` → move to `tooling`
- `tool_execution_end` → fall back to `thinking` if agent is still active, otherwise `idle`
- `agent_end` → move to `idle`
- `session_shutdown` → clear or reset presence

### Avoid for v1
- Token-by-token `message_update` driven presence updates
- Attempting to infer too much semantic detail from arbitrary messages
- Per-tool custom Discord text beyond generic activity state

These add complexity and event noise without improving the user's stated core value.

## What Not To Add Yet

- **Do not add a database or persistence layer** - no need for a local installable v1
- **Do not add service managers/system daemons yet** - packaging polish is deferred
- **Do not overfit to SDK embedding** - the supported extension API is enough for this milestone
- **Do not expose prompt text, filenames, or full project paths** - conflicts with privacy-first defaults

## Install/Packaging Implications

- Pi can load local extensions directly from `.pi/extensions/` or `~/.pi/agent/extensions/`
- Pi can distribute packages through `pi install npm:...`, `pi install git:...`, or local path installs
- Package installs use production dependency installs, so runtime dependencies must stay in `dependencies`, not only `devDependencies`

## Risks and Compatibility Notes

- The extension should import **types and runtime helpers from the Pi package directly**, not rely on a homegrown interface that can drift from actual Pi events
- `discord-rpc` depends on local desktop Discord availability; helper startup and reconnect behavior should degrade clearly when Discord is absent
- The extension likely needs debouncing or state-change suppression so Pi event bursts do not spam the helper

## Recommendation Summary

For this milestone, the standard and lowest-risk stack is:
1. Real Pi extension factory in TypeScript
2. Existing helper daemon retained for Discord RPC
3. Shared Zod payload contract over local HTTP
4. Package manifest added now so distribution later is straightforward

---
*Research output for roadmap and requirements generation*
