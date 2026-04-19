---
status: partial
phase: 02-presence-helper-hardening
source: [02-VERIFICATION.md]
started: 2026-04-19T09:35:00Z
updated: 2026-04-19T09:35:00Z
---

## Current Test

Awaiting live Discord desktop verification for reconnect and project-name opt-in behavior.

## Tests

### 1. Verify live Discord reconnect after desktop restart
expected: Presence returns without restarting the helper process after Discord desktop is quit and relaunched.
result: pending

### 2. Verify project-name opt-in behavior
expected: With `PI_PRESENCE_PRIVACY_MODE=false` and `PI_PRESENCE_INCLUDE_PROJECT=true`, Discord presence includes the project name; by default it remains hidden.
result: pending

## Summary

total: 2
passed: 0
issues: 0
pending: 2
skipped: 0
blocked: 0

## Gaps
