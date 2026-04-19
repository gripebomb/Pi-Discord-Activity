# Phase 1 Research: Real Pi Extension Wiring

**Date:** 2026-04-19
**Phase:** 1 - Real Pi Extension Wiring
**Goal:** Replace placeholder extension scaffold with real Pi extension entrypoint

---

## Research Summary

This research documents the technical approach for wiring the existing scaffold into a real Pi extension. The key insight is that Pi extensions use a factory function pattern with an `ExtensionAPI` parameter, and the extension subscribes to lifecycle events through callback registration.

---

## Pi Extension API Discovery

### Extension Entry Point Pattern

Pi extensions export a default factory function:

```typescript
export default function (pi: ExtensionAPI): ExtensionReturn | Promise<ExtensionReturn>
```

The `ExtensionAPI` is provided by the Pi runtime when loading the extension.

### ExtensionAPI Interface (from Pi runtime)

Based on Pi's documented extension API:

```typescript
interface ExtensionAPI {
  // Session lifecycle
  on(event: 'session_start', handler: (data: SessionStartEvent) => void): void;
  on(event: 'session_shutdown', handler: (data: SessionShutdownEvent) => void): void;
  
  // Model events
  on(event: 'model_select', handler: (data: ModelSelectEvent) => void): void;
  
  // Agent lifecycle
  on(event: 'agent_start', handler: (data: AgentEvent) => void): void;
  on(event: 'agent_end', handler: (data: AgentEvent) => void): void;
  
  // Tool execution
  on(event: 'tool_execution_start', handler: (data: ToolExecutionEvent) => void): void;
  on(event: 'tool_execution_end', handler: (data: ToolExecutionEvent) => void): void;
  
  // Message events (optional for v1)
  on(event: 'message_update', handler: (data: MessageEvent) => void): void;
  
  // Get current session info
  getSessionInfo(): SessionInfo;
  
  // Config access
  getConfig(): ExtensionConfig;
}

interface SessionStartEvent {
  sessionId: string;
  provider: string;
  model: string;
  startedAt: number;
}

interface SessionShutdownEvent {
  sessionId: string;
  reason?: string;
}

interface ModelSelectEvent {
  provider: string;
  model: string;
  previousProvider?: string;
  previousModel?: string;
}

interface AgentEvent {
  sessionId: string;
  turnNumber?: number;
}

interface ToolExecutionEvent {
  sessionId: string;
  toolName: string;
  toolArguments?: Record<string, unknown>;
  duration?: number;
}

interface MessageEvent {
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
}

interface SessionInfo {
  sessionId: string;
  provider: string;
  model: string;
  workspacePath?: string;
}

interface ExtensionConfig {
  // Extension-specific configuration from Pi settings
}
```

### Extension Return Shape

The extension factory returns handlers (can be sync or async):

```typescript
interface ExtensionReturn {
  // Called when extension is first loaded
  onLoad?: () => void | Promise<void>;
  
  // Called when Pi is shutting down (cleanup)
  onUnload?: () => void | Promise<void>;
  
  // Optional: expose custom status/info
  status?: () => ExtensionStatus;
}
```

---

## Event to Presence State Mapping

### Recommended Phase 1 Mapping

| Pi Event | Presence State | Notes |
|----------|---------------|-------|
| `session_start` | `"starting"` | Initialize session identity |
| `model_select` | (update provider/model) | Keep current state, update labels |
| `agent_start` | `"thinking"` | Agent begins processing |
| `tool_execution_start` | `"tooling"` | Tool is running |
| `tool_execution_end` | `"thinking"` or `"idle"` | If agent still active: thinking, else: idle |
| `agent_end` | `"idle"` | Agent finished |
| `session_shutdown` | (clear) | Clear Discord presence |

### Implementation Strategy

```typescript
// In extension factory
export default function (pi: ExtensionAPI) {
  const state = new PresenceState();
  
  // Subscribe to all lifecycle events
  pi.on('session_start', (event) => {
    state.update({
      sessionId: event.sessionId,
      provider: event.provider,
      model: event.model,
      state: 'starting'
    });
    publishPresence(state.snapshot());
  });
  
  pi.on('model_select', (event) => {
    state.update({
      provider: event.provider,
      model: event.model
    });
    publishPresence(state.snapshot());
  });
  
  pi.on('agent_start', () => {
    publishPresence(state.setActivity('thinking'));
  });
  
  pi.on('tool_execution_start', () => {
    publishPresence(state.setActivity('tooling'));
  });
  
  pi.on('tool_execution_end', () => {
    // If we have agent_end coming, don't override to idle
    // The agent_end handler will set idle
    // For now, just return to thinking
    publishPresence(state.setActivity('thinking'));
  });
  
  pi.on('agent_end', () => {
    publishPresence(state.setActivity('idle'));
  });
  
  pi.on('session_shutdown', () => {
    publishPresence(state.setActivity('idle'));
  });
  
  return {
    onUnload: () => {
      // Clear presence on unload
      publishPresence(state.setActivity('idle'));
    }
  };
}
```

---

## Extension Loading Methods

### Method 1: Local Extension Directory
Place extension in Pi's local extensions directory:
```
~/.pi/agent/extensions/pi-discord-presence/
```
With structure:
```
pi-discord-presence/
├── src/
│   └── extension/
│       └── index.ts
├── package.json
└── tsconfig.json
```

### Method 2: Project-local .pi/extensions
For development, create a symlink or copy:
```
project/.pi/extensions/pi-discord-presence -> project/
```

### Method 3: pi install from local path
```bash
pi install ./path/to/pi-discord-presence
```

### Method 4: npm package (future)
```bash
pi install npm:@username/pi-discord-presence
```

---

## Package.json Pi Manifest

Required for Pi to recognize and load the extension:

```json
{
  "name": "pi-discord-presence",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "keywords": ["pi-package"],
  "pi": {
    "extensions": ["./src/extension/index.ts"]
  },
  "dependencies": {
    "zod": "^3.24.2",
    "discord-rpc": "^4.0.1"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.10.0"
  }
}
```

---

## Error Handling Strategy

### Principles
1. **Best-effort presence**: Never fail or block Pi due to presence issues
2. **Graceful degradation**: If helper is down, log and continue
3. **Clean shutdown**: Clear presence on session end

### Implementation

```typescript
async function publishPresence(payload: PresencePayload): Promise<void> {
  try {
    const parsed = presencePayloadSchema.parse(payload);
    const url = `http://${defaultConfig.serverHost}:${defaultConfig.serverPort}/presence`;
    
    await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(parsed),
      // Short timeout to avoid blocking
      signal: AbortSignal.timeout(2000)
    });
  } catch (error) {
    // Log but don't throw - presence is best-effort
    console.error('[pi-discord-presence] Failed to publish presence:', error);
  }
}
```

---

## Verification Strategy (Dimension 8)

### Unit Tests
- Test event handlers update PresenceState correctly
- Test privacy defaults are applied
- Test provider/model updates don't reset state incorrectly

### Integration Tests (manual verification required)
1. Load extension in real Pi session
2. Start a conversation
3. Observe presence states in Discord
4. Verify:
   - session_start → "starting" appears
   - model_select → provider/model updated
   - agent/tool events → state changes visible
   - session_shutdown → presence cleared

### Test Plan
```
Tests: 4/4
├── Extension loads without errors
├── Event handlers update state correctly
├── Presence payloads are valid
└── Error handling doesn't crash Pi
```

---

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Wrong Pi event names | Medium | High | Verify against actual Pi runtime |
| Overly chatty presence updates | High | Medium | Add state-change detection to avoid duplicate publishes |
| Helper unavailable crashes extension | Low | Low | Already using try/catch with logging |
| Extension doesn't load from Pi | Medium | High | Test multiple load methods; verify package.json manifest |

---

## Implementation Notes

1. **Keep state.ts and transport.ts unchanged** - they work fine
2. **Add a thin wrapper in index.ts** - the extension factory subscribes to events and calls existing helpers
3. **Type imports** - Import ExtensionAPI types from `@mariozechner/pi-coding-agent` if available, otherwise define locally
4. **Debounce consideration** - Phase 1 can rely on helper debouncing; future phases may add extension-side dedupe
5. **Testing** - Manual verification in real Pi session is required; automated tests can't verify real Pi event firing

---

## References

- `.planning/research/ARCHITECTURE.md` - Architectural guidance
- `.planning/research/STACK.md` - Stack recommendations
- `src/extension/state.ts` - Existing PresenceState (reuse)
- `src/extension/transport.ts` - Existing publishPresence (reuse)
- `src/shared/types.ts` - Payload schema (rely on for validation)

---

*Research complete: 2026-04-19*
*Status: Ready for planning*