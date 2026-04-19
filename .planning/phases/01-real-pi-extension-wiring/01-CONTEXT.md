# Phase 1: Real Pi Extension Wiring - Context

**Gathered:** 2026-04-19
**Status:** Ready for planning
**Source:** Project initialization + requirements + existing scaffold analysis

<domain>
## Phase Boundary

Replace the existing placeholder extension scaffold (`src/extension/index.ts`) with a real Pi extension factory that:
1. Exports `default function (pi: ExtensionAPI)` entrypoint
2. Subscribes to real Pi lifecycle events (session_start, model_select, agent_start, tool_execution_start, tool_execution_end, agent_end, session_shutdown)
3. Maps those events to normalized presence states (starting, thinking, tooling, editing, idle, error)
4. Publishes presence payloads to the local helper over HTTP
5. Works when loaded from a real Pi extension location (not just placeholder dev hooks)

This is the prerequisite for everything else - without real Pi integration, Discord presence can never show actual Pi activity.

</domain>

<decisions>
## Implementation Decisions

### Extension Entry Point
- Extension MUST export `default function (pi: ExtensionAPI)` - Pi's documented extension factory pattern
- Extension MUST use real Pi ExtensionAPI types, not placeholder interfaces
- Extension location: `src/extension/index.ts` (no separate package subdirectory needed)

### Event Subscription
- Subscribe to: session_start, model_select, agent_start, tool_execution_start, tool_execution_end, agent_end, session_shutdown
- Events are provided by Pi's ExtensionAPI - use the actual types from `@mariozechner/pi-coding-agent`

### State Mapping
- session_start → state: "starting", capture sessionId
- model_select → update provider/model
- agent_start → state: "thinking" (or "editing" if context suggests file modification)
- tool_execution_start → state: "tooling"
- tool_execution_end → if agent still active: "thinking", else: "idle"
- agent_end → state: "idle"
- session_shutdown → clear presence (publish idle or clear to helper)

### Transport Contract
- Reuse `publishPresence()` from `src/extension/transport.ts` unchanged
- Payload schema already exists in `src/shared/types.ts`
- Helper endpoint: `http://localhost:3000/presence` (configurable via env)

### Privacy Defaults
- Privacy mode ON by default (project names hidden)
- Only include project name if `PI_PRESENCE_PRIVACY_MODE=false` AND `PI_PRESENCE_INCLUDE_PROJECT=true`
- This must be verified end-to-end

### Error Handling
- Presence publishing is best-effort (do not fail Pi session if helper is down)
- Log failures, continue normal Pi usage
- Never block or delay Pi event processing due to presence issues

### the agent's Discretion
- Exact timing of debouncing strategy (can add lightweight dedupe in extension or rely on helper)
- How to detect "editing" vs "thinking" - whether to infer from agent activity patterns
- Specific test approach for verifying real Pi events fire (manual observation in live Pi session)
- Whether to add any additional logging/tracing for debugging event mapping

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Extension Architecture
- `.planning/research/ARCHITECTURE.md` - Recommended architecture, event mapping guidance, integration boundaries
- `.planning/research/STACK.md` - Pi extension runtime guidance, package manifest requirements

### Existing Scaffold (read before modifying)
- `src/extension/index.ts` - Current placeholder - MUST be replaced
- `src/extension/state.ts` - PresenceState class - adapt, don't rewrite
- `src/extension/transport.ts` - publishPresence() - reuse unchanged
- `src/shared/types.ts` - PresencePayload schema and ActivityState types
- `src/shared/config.ts` - defaultConfig for server host/port

### Helper Service
- `src/helper/` - Existing helper that accepts HTTP presence updates and manages Discord RPC

### Requirements Traceability
- `.planning/REQUIREMENTS.md` - PIEXT-01 through PIEXT-04, RUNT-01
- `.planning/ROADMAP.md` - Phase 1 success criteria

</canonical_refs>

<specifics>
## Specific Ideas

### Extension Factory Pattern
Pi expects extensions to export a default function:
```typescript
export default function (pi: ExtensionAPI) {
  // Return extension object with lifecycle handlers
  return {
    onSessionStart: ...,
    onModelSelect: ...,
    // etc.
  };
}
```

### Event Object Shapes
From Pi extension documentation, events include:
- `session_start`: { sessionId, provider, model, ... }
- `model_select`: { provider, model, ... }
- `agent_start`: { sessionId, ... }
- `tool_execution_start`: { toolName, ... }
- `tool_execution_end`: { toolName, duration, ... }
- `agent_end`: { sessionId, ... }
- `session_shutdown`: { sessionId, ... }

### Package Manifest Addition
For `package.json` (supports `pi install` later):
```json
{
  "keywords": ["pi-package"],
  "pi": {
    "extensions": ["./src/extension/index.ts"]
  }
}
```

### Local Extension Loading
Pi can load extensions from:
- `.pi/extensions/` in project directory
- `~/.pi/agent/extensions/` in user home directory
- Via `pi install /path/to/package` from npm/git/local path

</specifics>

<deferred>
## Deferred Ideas

### Future: More Granular Activity States
- Distinguishing "editing" from generic "tooling" could be enhanced later with file watching
- Per-tool custom labels (e.g., "Running tests") is deferred - too noisy for v1

### Future: Helper Reconnection Hardening
- Full reconnection logic belongs to Phase 2 (PRES-03 / RUNT-05)

### Future: Service Installation
- launchd/systemd recipes belong to Phase 3 (INST-07)

</deferred>

---

*Phase: 01-real-pi-extension-wiring*
*Context gathered: 2026-04-19*