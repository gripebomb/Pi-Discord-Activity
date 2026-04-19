# Codebase Concerns

**Analysis Date:** 2026-04-19

## Tech Debt

**Placeholder Pi wiring in `src/extension/index.ts`:**
- Issue: the extension module is explicitly a scaffold and does not yet register with Pi's real extension API
- Why: the repo is positioned as a starter pack rather than a finished plugin, per `README.md`
- Impact: the main value proposition is incomplete until a real Pi runtime integration is added
- Fix approach: replace the placeholder bootstrap with actual Pi extension hook registration and package/install instructions tied to the real API surface

**In-memory-only state in `src/extension/state.ts` and `src/helper/index.ts`:**
- Issue: session state and debounce timing are held in process memory only
- Why: simple prototype architecture
- Impact: restarts lose state, multiple sessions are not coordinated, and helper behavior is hard to reason about across processes
- Fix approach: define explicit multi-session behavior and add durable/session-aware state handling if needed

## Known Bugs

**Helper may not clear presence on non-graceful exit:**
- Symptoms: Discord activity can remain stale if the helper crashes or is killed without SIGINT/SIGTERM handling
- Trigger: abnormal process termination
- Workaround: restart the helper or manually clear activity by reconnecting cleanly
- Root cause: `src/helper/index.ts` only clears presence in its graceful shutdown path

**Dropped updates during debounce window in `src/helper/index.ts`:**
- Symptoms: rapid transitions may never reach Discord, including potentially meaningful state changes
- Trigger: multiple payloads arriving within `defaultConfig.debounceMs`
- Workaround: reduce `PI_PRESENCE_DEBOUNCE_MS` for local testing
- Root cause: the debounce logic discards updates instead of delaying and sending the latest payload

## Security Considerations

**Unauthenticated local HTTP endpoint in `src/helper/server.ts`:**
- Risk: any local process that can reach `http://{host}:{port}/presence` can submit presence updates
- Current mitigation: defaults bind to `127.0.0.1` via `src/shared/config.ts`
- Recommendations: add a shared local token, randomize the port optionally, and reject requests missing a secret header

**Placeholder client ID default in `src/shared/config.ts`:**
- Risk: the code falls back to `YOUR_DISCORD_APP_CLIENT_ID`, which can cause confusing runtime failures and accidental misconfiguration
- Current mitigation: README documents the need to override it
- Recommendations: fail fast at startup when the placeholder value is still present

## Performance Bottlenecks

**Synchronous-looking request handling path in `src/helper/server.ts`:**
- Problem: each request is processed inline through JSON parse, Zod validation, and Discord update flow
- Measurement: no benchmark data present in repo
- Cause: minimal implementation optimized for simplicity
- Improvement path: queue updates, preserve the latest payload, and decouple request acknowledgment from Discord RPC latency

## Fragile Areas

**Discord readiness handling in `src/helper/discord.ts`:**
- Why fragile: `ready` flips from an event listener, while callers may invoke `setPresence()` before the lifecycle has fully stabilized
- Common failures: timing-related connection issues are likely to be hard to reproduce
- Safe modification: add explicit connection-state tests and isolate login/readiness transitions behind a clearer state machine
- Test coverage: none currently

**Schema coupling across transport and server boundaries:**
- Why fragile: both sides rely on the exact same payload contract in `src/shared/types.ts`; small schema changes affect every path
- Common failures: adding a field without updating both callers and consumers can break all presence delivery
- Safe modification: treat schema changes as contract changes and add tests on both send/receive sides
- Test coverage: none currently

## Scaling Limits

**Single-user local design:**
- Current capacity: effectively one local user/session model
- Limit: no built-in support for multiple Pi sessions publishing concurrently to one helper
- Symptoms at limit: interleaved presence updates and unclear ownership of the visible Discord activity
- Scaling path: add per-session arbitration or a session-selection policy in `src/helper/index.ts`

## Dependencies at Risk

**`discord-rpc` in `src/helper/discord.ts`:**
- Risk: Discord RPC libraries can be brittle over time and may lag Discord desktop client behavior changes
- Impact: the main integration can fail even if the rest of the code remains correct
- Migration plan: monitor library maintenance and be ready to swap to an alternative Discord activity client if needed

## Missing Critical Features

**No automated test suite:**
- Problem: there is no safety net for refactors or contract changes
- Current workaround: manual testing through `npm run dev:helper`, `npm run dev:extension`, and `npm run build`
- Blocks: confident iteration on transport, debounce, and privacy behavior
- Implementation complexity: low-to-medium; unit tests should be straightforward once a runner is selected

**No packaging/distribution automation:**
- Problem: install flow is described manually in `README.md` but not automated
- Current workaround: build and symlink/copy files by hand
- Blocks: repeatable setup for other users and simpler releases
- Implementation complexity: medium

## Test Coverage Gaps

**`src/helper/server.ts` request parsing and error responses:**
- What's not tested: HTTP status behavior for invalid JSON, bad schema payloads, and non-POST/non-`/presence` routes
- Risk: regressions could silently break the local transport boundary
- Priority: High
- Difficulty to test: Low

**`src/helper/discord.ts` activity formatting:**
- What's not tested: provider key normalization, privacy-mode display rules, and lazy connect behavior
- Risk: incorrect or missing Discord activity output
- Priority: High
- Difficulty to test: Low with RPC mocking

---

*Concerns audit: 2026-04-19*
*Update as issues are fixed or new ones discovered*
