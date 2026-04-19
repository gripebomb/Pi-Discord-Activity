# Architecture Research

**Date:** 2026-04-19
**Scope:** How new real Pi integration should fit the existing scaffold

## Recommended Architecture

Keep the existing split design, but replace the placeholder extension module with a real Pi extension entry.

### Target component layout

1. **Pi Extension Entry**
   - Registers Pi event handlers through `ExtensionAPI`
   - Converts Pi runtime events into normalized presence state transitions
   - Publishes payloads to local helper

2. **Presence State Mapper**
   - Maintains current session/provider/model/activity snapshot
   - Prevents invalid or noisy transitions
   - Applies privacy defaults before transport

3. **Transport Layer**
   - Sends validated payloads to local helper over localhost HTTP
   - Handles helper unavailable / bad response cases predictably

4. **Helper Service**
   - Accepts presence updates
   - Debounces and coalesces rapid event bursts
   - Owns Discord RPC login, activity updates, and clear-on-shutdown

5. **Package Metadata**
   - Declares extension entrypoints for Pi package installation and local discovery
   - Later supports git/npm distribution without architectural changes

## Recommended Build Order

### Step 1: Convert extension scaffold into real Pi extension
- Change `src/extension/index.ts` to export a real Pi extension factory
- Subscribe to Pi events: `session_start`, `model_select`, `agent_start`, `tool_execution_start`, `tool_execution_end`, `agent_end`, `session_shutdown`
- Reuse or adapt `PresenceState` and transport modules rather than rewriting everything

### Step 2: Stabilize state mapping
- Decide exactly which Pi events map to which activity states
- Ensure provider/model values are always available or fall back cleanly
- Avoid event loops or duplicate publishes when nothing meaningful changed

### Step 3: Harden helper behavior
- Make sure helper startup, missing Discord, and shutdown paths are predictable
- Verify debounce does not swallow important final state transitions like `idle`

### Step 4: Add package/install shape
- Add Pi package metadata to `package.json`
- Add local install flow docs
- Verify loading from project-local `.pi/extensions` or `pi install /path/to/package`

## Data Flow

### Desired real runtime flow
1. Pi loads the extension from local extension discovery or a Pi package
2. Pi emits lifecycle/model/tool events during a real session
3. Extension handlers update the in-memory presence snapshot
4. Extension publishes normalized payload to local helper
5. Helper validates and debounces the update
6. Helper translates payload into Discord activity
7. Discord desktop renders Rich Presence

## Integration Boundaries

### Stable/public boundary
- Pi extension API and documented event names
- Pi package manifest / install rules
- Local HTTP contract between extension and helper
- Discord RPC client API used by helper

### Internal project boundary
- How Pi events are normalized to `starting`, `thinking`, `tooling`, `editing`, `idle`, `error`
- How project names are suppressed or included
- How duplicate updates are prevented

## Architectural Risks

### Risk: using wrong Pi events
If the extension relies on placeholder assumptions instead of real extension hooks, the package will load but never reflect real usage.
**Mitigation:** build directly on documented events from `extensions.md` and examples.

### Risk: overly chatty updates
Pi emits several lifecycle events during a turn. Naively publishing every event may cause Discord thrash.
**Mitigation:** dedupe repeated state/provider/model snapshots and debounce helper updates.

### Risk: helper/Discord unavailability
If helper or Discord is down, the extension should fail softly instead of interrupting Pi usage.
**Mitigation:** treat presence publishing as best-effort and surface failures as logs/notifications, not hard session failures.

### Risk: package shape mismatch
A repo that works only via ad hoc scripts will be harder to distribute later.
**Mitigation:** add Pi package metadata in this milestone even if publication comes later.

## New vs Existing Components

### Existing components to keep
- `src/shared/types.ts`
- `src/shared/config.ts`
- `src/extension/state.ts`
- `src/extension/transport.ts`
- `src/helper/*`

### Existing component to refactor heavily
- `src/extension/index.ts` should stop being a fake hook surface and become the real Pi extension entrypoint

### New components likely needed
- Event-to-payload mapper helpers
- Install/package documentation updates
- Possibly a local package/extension shim path if the final entry needs a dedicated package directory layout

---
*Research output for phase structure and dependency planning*
