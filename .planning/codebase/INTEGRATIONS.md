# External Integrations

**Analysis Date:** 2026-04-19

## APIs & External Services

**Discord Rich Presence:**
- Discord desktop client - target external service for activity updates
  - SDK/Client: `discord-rpc` in `src/helper/discord.ts`
  - Auth: Discord application client ID from `DISCORD_RPC_CLIENT_ID`
  - Integration method: local IPC connection via `new RPC.Client({ transport: "ipc" })`
  - Assets expected: image keys like `pi`, `openai`, `anthropic`, and `google` per `README.md`

**Pi Coding Agent runtime:**
- Pi local extension environment - upstream event source for session/model/activity changes
  - Integration method: exported hooks in `src/extension/index.ts` (`onSessionStart`, `onModelChange`, `onThinking`, `onToolCall`, `onFileEdit`, `onIdle`, `onError`)
  - Auth: none shown in code; this repo assumes Pi calls the extension in-process
  - Current state: scaffold only; real Pi extension API wiring is still a manual follow-up per `README.md`

## Data Storage

**Databases:**
- None in current scaffold
  - No ORM, SQL client, or migration tooling in `package.json`
  - No persistent project state beyond in-memory process state in `src/extension/state.ts`

**File Storage:**
- None
  - No S3, blob storage, or local persistence layer is implemented

**Caching:**
- None
  - Debounce timing in `src/helper/index.ts` is in-memory request suppression, not a cache

## Authentication & Identity

**Auth Provider:**
- Discord application identity only
  - Implementation: `RPC.register(defaultConfig.rpcClientId)` in `src/helper/discord.ts`
  - Credentials: `DISCORD_RPC_CLIENT_ID` environment variable or placeholder default in `src/shared/config.ts`
  - Session management: handled by Discord RPC client state, not by application-managed auth logic

**OAuth Integrations:**
- None present
  - No OAuth flows, redirect handlers, or token storage code found in `src/`

## Monitoring & Observability

**Error Tracking:**
- None
  - Errors are logged to stderr with `console.error` in `src/helper/server.ts`

**Analytics:**
- None
  - No telemetry, metrics, or product analytics dependencies are present

**Logs:**
- Process stdout/stderr only
  - `src/helper/server.ts` logs server start and bad payload failures
  - `src/helper/discord.ts` logs Discord readiness

## CI/CD & Deployment

**Hosting:**
- Local machine only
  - The helper is run from the CLI (`src/cli/run-helper.ts`)
  - The extension is expected to be copied/symlinked into a Pi extension directory as described in `README.md`

**CI Pipeline:**
- None configured in repository
  - No `.github/workflows/` directory and no CI scripts in `package.json`

## Environment Configuration

**Development:**
- Required env vars for meaningful runtime: `DISCORD_RPC_CLIENT_ID`
- Optional env vars: `PI_PRESENCE_PORT`, `PI_PRESENCE_HOST`, `PI_PRESENCE_PRIVACY_MODE`, `PI_PRESENCE_INCLUDE_PROJECT`, `PI_PRESENCE_DEBOUNCE_MS`
- Example values live in `.pi/example-settings.json`
- Mock/stub mode: local placeholder bootstrap in `src/extension/index.ts` emits a fake session start and idle transition when run directly

**Staging:**
- Not defined in repo
  - No separate environment handling beyond generic env vars in `src/shared/config.ts`

**Production:**
- Secrets management is expected to be user-local environment configuration
  - No secret manager integration is implemented

## Webhooks & Callbacks

**Incoming:**
- Local HTTP callback at `POST /presence`
  - Server: `src/helper/server.ts`
  - Validation: Zod schema validation using `presencePayloadSchema`
  - Caller: `src/extension/transport.ts` posts presence payloads to `http://{host}:{port}/presence`

**Outgoing:**
- Discord RPC activity updates
  - Trigger: every accepted presence payload after debounce in `src/helper/index.ts`
  - Endpoint/transport: Discord local IPC through `discord-rpc`, not raw HTTP
  - Retry logic: none explicit; failures bubble as thrown errors

---

*Integration audit: 2026-04-19*
*Update when adding/removing external services*
