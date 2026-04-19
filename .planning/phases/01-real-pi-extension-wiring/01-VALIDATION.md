---
phase: 1
slug: real-pi-extension-wiring
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-19
---

# Phase 1 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                               |
| ---------------------- | --------------------------------------------------- |
| **Framework**          | Vitest (Node.js/TypeScript project)                 |
| **Config file**        | `vitest.config.ts` or `none - Wave 0 installs`     |
| **Quick run command**  | `npm test`                                          |
| **Full suite command** | `npm test -- --run`                                |
| **Estimated runtime**  | ~30 seconds                                         |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test -- --run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID   | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status    |
| --------- | ---- | ---- | ----------- | --------- | ----------------- | ----------- | --------- |
| 01-01-01  | 01   | 1    | PIEXT-01    | unit      | `npm test`        | ❌ W0        | ⬜ pending |
| 01-01-02  | 01   | 1    | PIEXT-02    | unit      | `npm test`        | ❌ W0        | ⬜ pending |
| 01-02-01  | 02   | 1    | PIEXT-03    | integration | `npm test`      | ❌ W0        | ⬜ pending |
| 01-02-02  | 02   | 1    | PIEXT-04    | integration | `npm test`      | ❌ W0        | ⬜ pending |
| 01-03-01  | 03   | 1    | RUNT-01     | unit      | `npm test`        | ❌ W0        | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/extension.test.ts` - stubs for extension event handlers
- [ ] `tests/state.test.ts` - tests for PresenceState updates
- [ ] `tests/transport.test.ts` - tests for publishPresence
- [ ] `vitest.config.ts` - test configuration if not present
- [ ] `npm install vitest` - if vitest not in devDependencies

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior   | Requirement | Why Manual | Test Instructions |
| ---------- | ----------- | ---------- | ----------------- |
| Extension loads in real Pi session | PIEXT-01, PIEXT-02 | Pi runtime required for full validation | 1. Start Pi with extension loaded<br>2. Start a session<br>3. Verify no console errors<br>4. Verify presence appears in Discord |
| Real Pi lifecycle events fire | PIEXT-03, PIEXT-04 | Cannot simulate Pi events in unit tests | 1. Run Pi with extension active<br>2. Perform actions (model change, tool call)<br>3. Observe presence state changes |
| End-to-end with helper | RUNT-01 | Requires helper running + Discord open | 1. Start helper with Discord running<br>2. Load extension in Pi<br>3. Trigger Pi events<br>4. Verify Discord shows correct presence |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending