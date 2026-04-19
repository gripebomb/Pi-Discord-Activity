# Roadmap: pi-discord-presence

**Created:** 2026-04-19
**Granularity:** Standard
**Mode:** YOLO
**Parallelization:** true

## Phase Summary

| # | Phase | Goal | Requirements | Success Criteria |
| -- | ----- | ---- | ------------ | ---------------- |
| 1 | Real Pi Extension Wiring | Wire the existing scaffold into a real Pi extension entrypoint with correct event mapping | PIEXT-01, PIEXT-02, PIEXT-03, PIEXT-04, RUNT-01 | 4 |
| 2 | Presence + Helper Hardening | Make Discord Rich Presence reliable with stable state transitions, reconnection, and privacy controls | PRES-01, PRES-02, PRES-03, PRES-04, PRES-05, RUNT-02, RUNT-03, RUNT-04, RUNT-05 | 5 |
| 3 | Install + Docs + Verification | Make the integration installable via Pi, with clear setup instructions and a reproducible verification flow | INST-01, INST-02, INST-03, INST-04, INST-05, INST-06, INST-07 | 5 |

## Phase 1: Real Pi Extension Wiring

**Goal:** Wire the existing scaffold into a real Pi extension entrypoint and verify it loads and reacts to actual Pi lifecycle events.

### Requirements

- ~~**PIEXT-01**~~: Pi can load the integration as a real extension entrypoint using Pi's documented extension API — ✓ verified live 2026-04-19
- ~~**PIEXT-02**~~: User can install or load the extension through Pi's extension/package system rather than only through placeholder dev hooks — ✓ verified via `pi install .`
- ~~**PIEXT-03**~~: Extension reacts to real Pi session, model, and work lifecycle events during actual Pi usage — ✓ verified with live Pi session
- ~~**PIEXT-04**~~: Extension maps Pi lifecycle events into normalized presence states before publishing updates — ✓ verified (starting/thinking/tooling/editing/idle)
- ~~**RUNT-01**~~: Extension publishes payloads that the helper accepts and validates successfully — ✓ verified via live helper + Discord RPC

### Success Criteria

1. ~~Extension exports a valid `default function (pi: ExtensionAPI)` entrypoint that Pi can load~~ ✓ verified
2. ~~Extension subscribes to real Pi events (session_start, model_select, agent_start, tool_execution_start, tool_execution_end, agent_end, session_shutdown)~~ ✓ verified
3. ~~Extension state mapper normalizes Pi events into starting/thinking/tooling/editing/idle/error states~~ ✓ verified
4. ~~Extension publishes valid presence payloads to the local helper over HTTP~~ ✓ verified
5. ~~Extension loads from a supported Pi extension/package location (not only via placeholder dev bootstrapping)~~ ✓ verified via `pi install .`

**Completed:** 2026-04-19 ✓

### Key Implementation Notes

- Replace `src/extension/index.ts` placeholder bootstrap with a real `default function (pi: ExtensionAPI)` factory
- Subscribe to the documented Pi events listed above
- Reuse `PresenceState` from `src/extension/state.ts` but refactor to accept Pi event data
- Reuse `publishPresence()` from `src/extension/transport.ts` unchanged
- Keep privacy-first defaults intact; do not send project names unless enabled
- Test by loading in a real Pi session and observing presence updates when Pi events fire

---

## Phase 2: Presence + Helper Hardening

**Goal:** Make Discord Rich Presence updates reliable, stable, and correct — with automatic reconnection, debouncing, and privacy controls working end-to-end.

### Requirements

- **PRES-01**: Discord Rich Presence shows Pi as the active application identity
- **PRES-02**: Discord Rich Presence shows the active provider and model from the Pi session
- **PRES-03**: Discord Rich Presence shows a concise current activity state
- **PRES-04**: Project details remain hidden by default unless explicitly enabled
- **PRES-05**: User can opt in to showing project name in Discord presence
- **RUNT-02**: Helper debounces rapid updates so Discord presence does not thrash during active Pi usage
- **RUNT-03**: Helper connects to Discord RPC and updates presence reliably during normal local use
- **RUNT-04**: Helper clears Discord presence on shutdown
- **RUNT-05**: Helper retries or reconnects automatically after transient Discord RPC connection failures

### Success Criteria

1. Discord shows correct Pi identity, provider/model label, and current activity state in all normal usage scenarios
2. Helper debounces repeated updates; Discord does not flicker during rapid tool calls
3. Helper reconnects automatically when Discord desktop is restarted or reconnects
4. Helper clears presence cleanly on SIGINT/SIGTERM and on `session_shutdown` event from the extension
5. Project names are hidden by default; when privacy mode is disabled AND `PI_PRESENCE_INCLUDE_PROJECT` is true, project name appears correctly

### Key Implementation Notes

- Validate end-to-end from real Pi event → extension state → helper → Discord
- Verify helper reconnection by restarting Discord while helper is running
- Verify debounce by triggering rapid tool calls and checking Discord does not rapidly flip states
- Test privacy defaults in both states (default hidden, opt-in visible)
- Ensure `startedAt` reflects session start, not the last presence update

---

## Phase 3: Install + Docs + Verification

**Goal:** Package the integration so it can be installed via `pi install`, and write clear setup and verification documentation so another user can get running without reading source code.

### Requirements

- **INST-01**: User can follow docs to create or configure a Discord application client ID for this integration
- **INST-02**: User can follow docs to install the Pi extension or package in a supported Pi location
- **INST-03**: User can follow docs to start the local helper process
- **INST-04**: User can follow a documented verification flow to confirm end-to-end presence updates
- **INST-05**: User can install the integration with `pi install` from a supported local path or package flow
- **INST-06**: User can run a setup script that reduces manual setup steps for local installation
- **INST-07**: User can follow OS-specific service recipes to keep the helper running outside a dev terminal

### Success Criteria

1. Discord client ID setup is documented with clear steps and a reference to the Discord Developer Portal
2. Pi extension/package install instructions cover all supported load methods (local extension path, `pi install` from local path)
3. Helper startup instructions cover environment variable setup, process start, and how to run in background
4. Verification flow walks a user through: start helper, load extension in Pi, trigger a known Pi action, observe Discord presence update
5. `pi install` flow works from the repo root or a packaged distribution
6. A setup script automates the repetitive local setup steps (Discord client ID, environment variables, extension placement)
7. OS-specific service recipes cover at least macOS launchd and Linux systemd for running the helper as a background service

### Key Implementation Notes

- Add `pi` manifest to `package.json` with `extensions` pointing to `src/extension/index.ts`
- Add `pi-package` keyword for discoverability
- Write `INSTALL.md` covering all install and verification steps
- Create a `setup.sh` or `setup.ps1` script that prompts for or accepts the Discord client ID and wires up the extension
- Document service recipes for macOS and Linux; Windows can note the manual approach if no reliable recipe is available
- Ensure runtime dependencies (discord-rpc, zod) are in `dependencies`, not just `devDependencies`

---

## Traceability

| Requirement | Phase | Status |
| ----------- | ----- | ------ |
| PIEXT-01 | Phase 1 | ✓ (2026-04-19) |
| PIEXT-02 | Phase 1 | ✓ (2026-04-19) |
| PIEXT-03 | Phase 1 | ✓ (2026-04-19) |
| PIEXT-04 | Phase 1 | ✓ (2026-04-19) |
| RUNT-01 | Phase 1 | ✓ (2026-04-19) |
| PRES-01 | Phase 2 | Pending |
| PRES-02 | Phase 2 | Pending |
| PRES-03 | Phase 2 | Pending |
| PRES-04 | Phase 2 | Pending |
| PRES-05 | Phase 2 | Pending |
| RUNT-02 | Phase 2 | Pending |
| RUNT-03 | Phase 2 | Pending |
| RUNT-04 | Phase 2 | Pending |
| RUNT-05 | Phase 2 | Pending |
| INST-01 | Phase 3 | Pending |
| INST-02 | Phase 3 | Pending |
| INST-03 | Phase 3 | Pending |
| INST-04 | Phase 3 | Pending |
| INST-05 | Phase 3 | Pending |
| INST-06 | Phase 3 | Pending |
| INST-07 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 21 total
- Mapped to phases: 21 ✓
- Unmapped: 0

---
*Roadmap created: 2026-04-19*
*Last updated: 2026-04-19 after Phase 1 completion*