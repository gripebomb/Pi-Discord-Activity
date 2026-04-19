# Requirements: pi-discord-presence

**Defined:** 2026-04-19
**Core Value:** Real Pi activity should appear reliably in Discord Rich Presence with minimal setup and without leaking sensitive project details by default.

## v1 Requirements

### Pi Extension

- [ ] **PIEXT-01**: Pi can load the integration as a real extension entrypoint using Pi’s documented extension API
- [ ] **PIEXT-02**: User can install or load the extension through Pi’s extension/package system rather than only through placeholder dev hooks
- [ ] **PIEXT-03**: Extension reacts to real Pi session, model, and work lifecycle events during actual Pi usage
- [ ] **PIEXT-04**: Extension maps Pi lifecycle events into normalized presence states before publishing updates

### Presence

- [ ] **PRES-01**: Discord Rich Presence shows Pi as the active application identity
- [ ] **PRES-02**: Discord Rich Presence shows the active provider and model from the Pi session
- [ ] **PRES-03**: Discord Rich Presence shows a concise current activity state
- [ ] **PRES-04**: Project details remain hidden by default unless explicitly enabled
- [ ] **PRES-05**: User can opt in to showing project name in Discord presence

### Runtime

- [ ] **RUNT-01**: Extension publishes payloads that the helper accepts and validates successfully
- [ ] **RUNT-02**: Helper debounces rapid updates so Discord presence does not thrash during active Pi usage
- [ ] **RUNT-03**: Helper connects to Discord RPC and updates presence reliably during normal local use
- [ ] **RUNT-04**: Helper clears Discord presence on shutdown
- [ ] **RUNT-05**: Helper retries or reconnects automatically after transient Discord RPC connection failures

### Install

- [ ] **INST-01**: User can follow docs to create or configure a Discord application client ID for this integration
- [ ] **INST-02**: User can follow docs to install the Pi extension or package in a supported Pi location
- [ ] **INST-03**: User can follow docs to start the local helper process
- [ ] **INST-04**: User can follow a documented verification flow to confirm end-to-end presence updates
- [ ] **INST-05**: User can install the integration with `pi install` from a supported local path or package flow
- [ ] **INST-06**: User can run a setup script that reduces manual setup steps for local installation
- [ ] **INST-07**: User can follow OS-specific service recipes to keep the helper running outside a dev terminal

## v2 Requirements

### Presence Enhancements

- **PRES-06**: Discord Rich Presence distinguishes editing from generic tooling activity
- **PRES-07**: Pi shows helper or Discord availability feedback inside Pi UI

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Prompt content in Discord presence | Excluded for privacy and not needed for the core value |
| Filenames or tool arguments in Discord presence | Excluded for privacy and to avoid oversharing local work details |
| Multi-session coordination across multiple simultaneous Pi sessions | Useful later, but not required for single-user v1 success |

## Traceability

| Requirement | Phase | Status |
| ----------- | ----- | ------ |
| PIEXT-01 | - | Pending |
| PIEXT-02 | - | Pending |
| PIEXT-03 | - | Pending |
| PIEXT-04 | - | Pending |
| PRES-01 | - | Pending |
| PRES-02 | - | Pending |
| PRES-03 | - | Pending |
| PRES-04 | - | Pending |
| PRES-05 | - | Pending |
| RUNT-01 | - | Pending |
| RUNT-02 | - | Pending |
| RUNT-03 | - | Pending |
| RUNT-04 | - | Pending |
| RUNT-05 | - | Pending |
| INST-01 | - | Pending |
| INST-02 | - | Pending |
| INST-03 | - | Pending |
| INST-04 | - | Pending |
| INST-05 | - | Pending |
| INST-06 | - | Pending |
| INST-07 | - | Pending |

**Coverage:**
- v1 requirements: 21 total
- Mapped to phases: 0
- Unmapped: 21 ⚠️

---
*Requirements defined: 2026-04-19*
*Last updated: 2026-04-19 after initial definition*
