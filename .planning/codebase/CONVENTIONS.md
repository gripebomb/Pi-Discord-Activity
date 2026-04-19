# Coding Conventions

**Analysis Date:** 2026-04-19

## Naming Patterns

**Files:**
- TypeScript files are lowercase or kebab-case, e.g. `src/cli/run-helper.ts`, `src/shared/config.ts`, `src/helper/discord.ts`
- Directory entry modules use `index.ts`, e.g. `src/extension/index.ts` and `src/helper/index.ts`
- Documentation files use uppercase canonical names like `README.md` and generated docs such as `.planning/codebase/STACK.md`

**Functions:**
- camelCase for functions and exported handlers, e.g. `onSessionStart`, `publishPresence`, `createPresenceServer`, `humanizeState`, `normalizeKey`
- Async functions do not use an `async` prefix; promise-based behavior is signaled by return type and `await`
- Handler names tend to be verb-first (`handlePresence`, `startHelper`, `setPresence`)

**Variables:**
- camelCase for locals and instances (`state`, `discord`, `lastSentAt`, `defaultConfig`)
- UPPER_SNAKE_CASE is not used for module constants in current source
- Private class fields use TypeScript `private`, not underscore prefixes, e.g. `private payload`, `private ready`

**Types:**
- Interfaces and type aliases use PascalCase with no `I` prefix, e.g. `PresenceConfig`, `PresencePayload`, `ActivityState`, `PiSessionEvent`
- Zod schemas use descriptive camelCase names ending in `Schema`, e.g. `activityStateSchema`, `presencePayloadSchema`

## Code Style

**Formatting:**
- Double quotes are consistently used in TypeScript files
- Semicolons are required
- Indentation is 2 spaces based on observed source formatting
- `strict: true` in `tsconfig.json` suggests the codebase expects explicit, type-safe TypeScript

**Linting:**
- No ESLint or Prettier config exists in the repo
- Style is enforced by consistency rather than tooling at the moment
- `npm run build` is the main quality gate because it type-checks via `tsc`

## Import Organization

**Order:**
1. External packages first, e.g. `import RPC from "discord-rpc";` or `import { z } from "zod";`
2. Internal relative imports after that, e.g. `../shared/config.js` or `./state.js`
3. Type-only imports may be combined inline with value imports, e.g. `PresencePayload, type ActivityState`

**Grouping:**
- Imports are usually a single contiguous block with no heavy grouping
- Relative imports use explicit `.js` extensions because the project compiles under `NodeNext`

**Path Aliases:**
- None configured; all imports are relative

## Error Handling

**Patterns:**
- Validate early with Zod at transport boundaries in `src/extension/transport.ts` and `src/helper/server.ts`
- Throw `Error` directly for operational failures, e.g. non-2xx response in `publishPresence()`
- Catch at process boundaries when a user-facing HTTP response is required, e.g. request parsing in `src/helper/server.ts`

**Error Types:**
- No custom error classes exist yet
- Failures are surfaced with human-readable messages and default stack traces
- Code prefers letting promise rejection bubble unless an HTTP response must be written

## Logging

**Framework:**
- Plain `console.log` / `console.error`
- No structured logger or log levels abstraction

**Patterns:**
- Startup and readiness events are logged in `src/helper/server.ts` and `src/helper/discord.ts`
- Error logging happens close to the integration boundary (`console.error("Failed to process presence update", error)`)
- Utility modules like `src/shared/config.ts` remain side-effect free and do not log

## Comments

**When to Comment:**
- Comments currently explain scaffold status and intent rather than line-by-line behavior
- `src/extension/index.ts` uses block comments to mark placeholder integration areas and local testing bootstrap
- README carries more operational explanation than inline code comments

**JSDoc/TSDoc:**
- Not broadly used for functions/classes
- Occasional file-level block comments appear where implementation is intentionally incomplete

**TODO Comments:**
- No formal `TODO(...)` convention observed in source
- Open work is documented narratively in `README.md` instead of inline TODO markers

## Function Design

**Size:**
- Functions are intentionally small and focused; most modules expose one or a few narrow responsibilities
- Helper methods like `humanizeState()` and `normalizeKey()` are extracted into dedicated functions in `src/helper/discord.ts`

**Parameters:**
- Small parameter lists are preferred
- Object parameters are used when passing event-shaped data, e.g. `PiSessionEvent` into `onSessionStart()` and `onModelChange()`

**Return Values:**
- Functions use explicit returns
- Guard clauses are common, e.g. `if (this.ready) return;` and early returns in request routing logic

## Module Design

**Exports:**
- Named exports are preferred throughout the codebase
- Classes are exported when they model a reusable runtime object (`PresenceState`, `DiscordPresenceClient`)
- There are no default exports in `src/`

**Barrel Files:**
- `index.ts` acts as a local entry module, not a broad barrel-export aggregator
- Modules mostly import directly from concrete files, reducing ambiguity in a small codebase

---

*Convention analysis: 2026-04-19*
*Update when patterns change*
