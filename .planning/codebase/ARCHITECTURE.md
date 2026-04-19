# Architecture

**Analysis Date:** 2026-04-19

## Pattern Overview

**Overall:** Local Node.js integration bridge with a split extension/helper architecture

**Key Characteristics:**
- Two-process design: a Pi-side extension scaffold emits state, and a helper daemon owns the Discord RPC connection
- Shared schema/types module keeps both sides aligned through a single payload contract in `src/shared/types.ts`
- HTTP is used as the local transport boundary between the extension and helper in `src/extension/transport.ts` and `src/helper/server.ts`
- Runtime state is in-memory only; there is no persistence layer or database
- Repo also carries a substantial `.pi/gsd/` workflow/template tree, but that is project metadata rather than application runtime code

## Layers

**Extension Layer:**
- Purpose: translate Pi session/activity events into a normalized presence payload
- Contains: event hook exports and in-memory session state
- Location: `src/extension/index.ts`, `src/extension/state.ts`, `src/extension/transport.ts`
- Depends on: shared config/types and the local helper HTTP endpoint
- Used by: the future Pi extension runtime integration described in `README.md`

**Shared Contract Layer:**
- Purpose: define the payload shape and runtime defaults used by both sides
- Contains: Zod schemas, TypeScript types, and env-backed config
- Location: `src/shared/types.ts`, `src/shared/config.ts`
- Depends on: `zod` and Node environment variables
- Used by: both the extension and helper modules

**Helper Service Layer:**
- Purpose: receive local presence updates, apply throttling, and push activity to Discord
- Contains: server startup, debounce logic, Discord RPC client wrapper
- Location: `src/helper/index.ts`, `src/helper/server.ts`, `src/helper/discord.ts`
- Depends on: shared contract layer and `discord-rpc`
- Used by: CLI entry point `src/cli/run-helper.ts`

## Data Flow

**Presence Update Flow:**

1. Pi invokes a hook such as `onSessionStart()` or `onThinking()` from `src/extension/index.ts`
2. `PresenceState` in `src/extension/state.ts` merges the partial update into the current payload snapshot
3. `publishPresence()` in `src/extension/transport.ts` validates the payload with Zod and POSTs JSON to the local helper
4. `createPresenceServer()` in `src/helper/server.ts` accepts `POST /presence`, reparses the JSON through the same Zod schema, and forwards it to a handler
5. `handlePresence()` in `src/helper/index.ts` applies a simple time-based debounce (`lastSentAt`)
6. `DiscordPresenceClient.setPresence()` in `src/helper/discord.ts` connects to Discord if needed and calls `client.setActivity()`
7. Discord desktop renders the Rich Presence activity using the configured large/small image keys

**State Management:**
- Extension state is stored in-memory inside a single `PresenceState` instance in `src/extension/index.ts`
- Helper-side throttling is stored as a module-level timestamp (`lastSentAt`) in `src/helper/index.ts`
- There is no persisted state, replay queue, or multi-session coordination

## Key Abstractions

**PresencePayload:**
- Purpose: canonical contract between the extension and helper
- Examples: `PresencePayload`, `ActivityState`, `presencePayloadSchema` in `src/shared/types.ts`
- Pattern: schema-first contract shared by transport and server boundaries

**PresenceState:**
- Purpose: maintain the current mutable session snapshot before publishing
- Example: class `PresenceState` in `src/extension/state.ts`
- Pattern: small state holder with partial updates and derived defaults

**DiscordPresenceClient:**
- Purpose: isolate Discord RPC connection and activity formatting
- Example: class `DiscordPresenceClient` in `src/helper/discord.ts`
- Pattern: wrapper around third-party client with lazy connect behavior

## Entry Points

**Helper CLI:**
- Location: `src/cli/run-helper.ts`
- Triggers: `npm start`, built helper bin, or direct Node execution
- Responsibilities: call `startHelper()` and keep the local daemon alive

**Extension Module:**
- Location: `src/extension/index.ts`
- Triggers: future Pi extension hooks, or direct dev execution via `npm run dev:extension`
- Responsibilities: expose Pi-facing lifecycle hooks and publish updates to the helper

## Error Handling

**Strategy:** validate at boundaries, throw on failures, and rely on process-level visibility

**Patterns:**
- Zod parsing is used both before sending (`src/extension/transport.ts`) and after receiving (`src/helper/server.ts`)
- HTTP publish failures throw in `publishPresence()` when `response.ok` is false
- Server-side bad payloads are caught and logged, then return HTTP 400 in `src/helper/server.ts`
- Shutdown clears activity on SIGINT/SIGTERM in `src/helper/index.ts`, but there is no broader recovery strategy

## Cross-Cutting Concerns

**Logging:**
- Basic console logging only in `src/helper/server.ts` and `src/helper/discord.ts`
- No structured logger or log-level abstraction

**Validation:**
- Centralized in `src/shared/types.ts` via Zod
- Used as the main integrity check across process boundaries

**Privacy:**
- Privacy defaults live in `src/shared/config.ts`
- `src/extension/state.ts` and `src/helper/discord.ts` cooperate to avoid including project names unless privacy is disabled and project display is allowed

---

*Architecture analysis: 2026-04-19*
*Update when major patterns change*
