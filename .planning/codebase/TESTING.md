# Testing Patterns

**Analysis Date:** 2026-04-19

## Test Framework

**Runner:**
- Node's built-in test runner via `tsx --test`
- Configured in `package.json#scripts.test`

**Run Commands:**
```bash
npm test                          # full automated test suite
npm run build                     # compile verification baseline
./scripts/verify-installation.sh  # install/package/helper smoke tests on Unix
pwsh ./scripts/verify-installation.ps1  # Windows verification helper
```

## Test File Organization

**Locations:**
- `tests/extension.test.ts` - extension event-registration expectations
- `tests/helper/discord-reconnect.test.ts` - activity rendering and reconnect behavior
- `tests/helper/shutdown.test.ts` - debounce and shutdown cleanup behavior
- `tests/integration.test.ts` - local transport integration coverage
- `tests/integration/presence-e2e.test.ts` - extension-to-helper end-to-end payload path
- `tests/state.test.ts` - privacy and presence-state behavior

**Structure:**
```text
tests/
├── extension.test.ts
├── helper/
│   ├── discord-reconnect.test.ts
│   └── shutdown.test.ts
├── integration/
│   └── presence-e2e.test.ts
├── integration.test.ts
└── state.test.ts
```

## Current Verification Pattern

**Automated:**
- `npm test` for unit + integration coverage
- `npm run build` for compile-time validation
- `./scripts/verify-installation.sh` for packaging, helper endpoint, and install smoke tests

**Manual / human-needed:**
- Live Discord desktop confirmation using `docs/verification.md`
- Cross-platform Windows execution of PowerShell scripts when a Windows or `pwsh` environment is available

## Mocking and Isolation

**Current approach:**
- Discord RPC client behavior is dependency-injected for reconnect tests
- Integration tests use the real local HTTP server path where practical
- Runtime config is isolated through environment overrides and helper bootstrap control

**What to keep mocking:**
- Discord RPC client internals
- timers for debounce/reconnect behavior
- process exit behavior during shutdown tests

**What not to over-mock:**
- Zod schemas and payload contracts
- pure formatting helpers like `humanizeState()` / `normalizeKey()`
- extension-to-helper transport when an in-process server can be used directly

## Coverage Focus

High-value covered areas already include:
- helper rendering and provider/model state formatting
- reconnect and queued presence replay
- debounce and graceful shutdown behavior
- privacy-default handling
- extension-to-helper payload transport

Still best suited for manual validation:
- live Discord desktop presentation
- platform-specific service-manager behavior (`launchd`, `systemd`, NSSM)
- Windows PowerShell execution in a real Windows environment

## Patterns to Preserve

- Keep tests local and deterministic; prefer mocked Discord RPC over requiring a live Discord desktop client in automated checks
- Use integration tests for the helper HTTP boundary instead of only unit-testing request parsing
- Keep install verification separate from unit tests via the `scripts/verify-installation.*` smoke-test scripts

---

*Testing analysis: 2026-04-19*
*Update when test runner or verification flow changes*
