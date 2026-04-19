# Testing Patterns

**Analysis Date:** 2026-04-19

## Test Framework

**Runner:**
- None configured yet
- There is no `test` script in `package.json`
- No `vitest`, `jest`, `mocha`, `ava`, `playwright`, or similar dependency is present

**Assertion Library:**
- None installed
- Verification currently relies on manual local runs and TypeScript compilation

**Run Commands:**
```bash
npm run build               # Current verification baseline; compiles the project with TypeScript
npm run dev:helper          # Manual helper validation
npm run dev:extension       # Manual extension scaffold validation
npm start                   # Run the built helper entry after compilation
```

## Test File Organization

**Location:**
- No test files exist under `src/` or a top-level `tests/` directory
- Search found no `*.test.*`, `*.spec.*`, or `__tests__/` patterns in the repository

**Naming:**
- Not established yet
- If adding tests, the most natural fit would be collocated `*.test.ts` files near the corresponding source modules such as `src/helper/discord.test.ts`

**Structure:**
```text
Current repo state:
src/
  cli/
  extension/
  helper/
  shared/
(no tests yet)
```

## Test Structure

**Observed Verification Pattern:**
- Build-time verification via `tsc -p tsconfig.json`
- Manual runtime verification using the direct-execution bootstrap in `src/extension/index.ts`
- Manual end-to-end verification by running the helper and extension in separate terminals, as documented in `README.md`

**Patterns to Preserve When Adding Tests:**
- Focus on boundary-heavy modules first: `src/shared/types.ts`, `src/extension/state.ts`, `src/helper/server.ts`, `src/helper/discord.ts`
- Prefer deterministic unit tests for payload shaping, debounce behavior, and privacy formatting
- Keep integration tests local by mocking Discord RPC and HTTP calls rather than requiring a real Discord desktop client in CI

## Mocking

**Framework:**
- Not implemented yet
- Future test setup will need module mocking for `discord-rpc`, `fetch`, timers, and Node HTTP interactions

**What to Mock:**
- Discord RPC client in `src/helper/discord.ts`
- `fetch` used by `src/extension/transport.ts`
- Time/debounce behavior in `src/helper/index.ts`
- Environment variables consumed by `src/shared/config.ts`

**What NOT to Mock:**
- Zod schemas in `src/shared/types.ts`
- Pure formatting helpers like `humanizeState()` and `normalizeKey()`
- `PresenceState` state transitions in `src/extension/state.ts` when unit-testing internal behavior

## Fixtures and Factories

**Test Data:**
- No fixtures or factories exist yet
- A future test suite should centralize reusable payload builders around the `PresencePayload` shape from `src/shared/types.ts`
- Example logical fixture targets: valid payloads, malformed payload JSON, privacy-mode on/off variants, debounce edge cases

**Location:**
- Not established
- Good future options: collocated factories in test files or a dedicated `tests/fixtures/` directory if the suite grows

## Coverage

**Requirements:**
- No coverage target configured
- No coverage tooling or report generation exists

**Configuration:**
- None
- There is no CI gate enforcing tests or coverage before merge

## Test Types

**Unit Tests:**
- Missing but strongly needed for `src/extension/state.ts`, `src/shared/types.ts`, and helper formatting logic in `src/helper/discord.ts`

**Integration Tests:**
- Missing but useful for the local HTTP path from `src/extension/transport.ts` to `src/helper/server.ts`

**E2E Tests:**
- Not present
- Real E2E would require a running helper process, Discord desktop, and Pi hook simulation

## Common Patterns

**Current Manual Workflow:**
- Start helper with `npm run dev:helper`
- Start the scaffolded extension with `npm run dev:extension`
- Observe console output from `src/helper/server.ts` and `src/helper/discord.ts`
- Confirm Discord activity changes and privacy behavior manually

**Highest-Value First Tests to Add:**
- Schema validation success/failure cases for `presencePayloadSchema`
- `PresenceState.update()` behavior with privacy-mode defaults and project-name handling
- HTTP 204/400 behavior in `createPresenceServer()`
- Debounce behavior in `handlePresence()` from `src/helper/index.ts`
- Activity formatting and provider-key normalization in `src/helper/discord.ts`

**Snapshot Testing:**
- Not used
- Explicit assertions will likely be clearer than snapshots for this small integration project

---

*Testing analysis: 2026-04-19*
*Update when test patterns change*
