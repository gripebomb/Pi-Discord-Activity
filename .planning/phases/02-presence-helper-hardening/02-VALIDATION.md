---
phase: 2
slug: presence-helper-hardening
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-19
---

# Phase 2 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                               |
| ---------------------- | --------------------------------------------------- |
| **Framework**          | Node.js built-in test runner (tsx --test)           |
| **Config file**        | tsconfig.json + tsx.config.json                     |
| **Quick run command**  | `npm test -- --test-name-pattern=".{pattern}."`    |
| **Full suite command** | `npm test`                                         |
| **Estimated runtime**  | ~30 seconds                                        |

---

## Sampling Rate

- **After every task commit:** Run targeted test match
- **After every plan wave:** Run full suite (`npm test`)
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID   | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status    |
| --------- | ---- | ---- | ----------- | --------- | ----------------- | ----------- | --------- |
| 2-01-01   | 01   | 1    | RUNT-03     | unit      | `npm test -- discord`    | ✅          | ⬜ pending |
| 2-01-02   | 01   | 1    | RUNT-05     | unit      | `npm test -- reconnect`  | ❌          | ⬜ pending |
| 2-02-01   | 02   | 1    | RUNT-02     | unit      | `npm test -- debounce`   | ✅          | ⬜ pending |
| 2-02-02   | 02   | 1    | RUNT-04     | unit      | `npm test -- shutdown`   | ❌          | ⬜ pending |
| 2-03-01   | 03   | 2    | PRES-04/05  | unit      | `npm test -- privacy`    | ✅          | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/helper/discord-reconnect.test.ts` - stub for reconnection logic
- [ ] `tests/helper/shutdown.test.ts` - stub for graceful shutdown
- [ ] Existing `tests/extension/state.test.ts` covers privacy defaults
- [ ] Existing `tests/helper/server.test.ts` covers debounce

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior                    | Requirement | Why Manual | Test Instructions |
| -------------------------- | ----------- | ---------- | ----------------- |
| Discord RPC reconnection   | RUNT-05     | Requires live Discord desktop restart | 1. Start helper, 2. Trigger presence, 3. Restart Discord app, 4. Verify presence restored within 10s |
| Presence display correct   | PRES-01/02/03 | Visual verification | Open Discord, load Pi extension, observe presence fields |
| Privacy toggle             | PRES-04/05 | Environment variable changes | Toggle env vars, restart helper, verify presence hides/shows project |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** {pending / approved YYYY-MM-DD}
