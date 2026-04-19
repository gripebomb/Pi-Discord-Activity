# Technology Stack

**Analysis Date:** 2026-04-19

## Languages

**Primary:**
- TypeScript 5.8 (`package.json`, `tsconfig.json`) - all runtime code in `src/extension/*.ts`, `src/helper/*.ts`, `src/shared/*.ts`, and `src/cli/run-helper.ts`

**Secondary:**
- Markdown - project documentation in `README.md` and workflow/templates under `.pi/gsd/`
- JSON - local example configuration in `.pi/example-settings.json`

## Runtime

**Environment:**
- Node.js 20+ required via `package.json#engines.node`
- Local desktop/runtime assumption: Discord desktop app plus a local Pi installation, as described in `README.md`

**Package Manager:**
- npm (scripts defined in `package.json`)
- Lockfile: none committed; there is no `package-lock.json`, `pnpm-lock.yaml`, or `yarn.lock` in the repo

## Frameworks

**Core:**
- No web framework or UI framework; this is a small Node service + extension scaffold
- Discord RPC via `discord-rpc` for Rich Presence integration in `src/helper/discord.ts`
- Zod 3.24 for payload validation in `src/shared/types.ts` and request parsing in `src/helper/server.ts`

**Testing:**
- None configured; no test framework dependency or test scripts in `package.json`

**Build/Dev:**
- TypeScript compiler (`tsc`) for builds via `npm run build`
- `tsx` for local dev execution via `npm run dev:helper` and `npm run dev:extension`

## Key Dependencies

**Critical:**
- `discord-rpc` ^4.0.1 - owns the IPC connection to Discord and sets Rich Presence activity in `src/helper/discord.ts`
- `zod` ^3.24.2 - validates activity state and transport payloads in `src/shared/types.ts`
- `typescript` ^5.8.2 - compiles the project to `dist/`
- `tsx` ^4.19.3 - runs TypeScript entry points directly during local development

**Infrastructure:**
- Node built-ins (`node:http`, global `fetch`, `process`) - provide the local HTTP bridge and runtime plumbing in `src/helper/server.ts`, `src/helper/index.ts`, and `src/extension/transport.ts`

## Configuration

**Environment:**
- Environment variables are the only runtime configuration mechanism; defaults are centralized in `src/shared/config.ts`
- Expected variables are documented in `README.md` and mirrored in `.pi/example-settings.json`
- Key vars: `DISCORD_RPC_CLIENT_ID`, `PI_PRESENCE_PORT`, `PI_PRESENCE_HOST`, `PI_PRESENCE_PRIVACY_MODE`, `PI_PRESENCE_INCLUDE_PROJECT`, `PI_PRESENCE_DEBOUNCE_MS`

**Build:**
- `tsconfig.json` - TypeScript compiler settings (`NodeNext`, declarations, sourcemaps, strict mode)
- `package.json` - scripts, entry points, engine constraint, dependencies
- `.gitignore` - excludes `node_modules/`, `dist/`, `.env`, and logs

## Platform Requirements

**Development:**
- macOS/Linux/Windows should work if Node 20+ and Discord desktop are available
- Pi must be installed locally for the extension side described in `README.md`

**Production:**
- Intended deployment is local machine usage, not hosted infrastructure
- Built output is expected in `dist/`, with helper entry `dist/cli/run-helper.js` and extension entry `dist/extension/index.js`

---

*Stack analysis: 2026-04-19*
*Update after major dependency changes*
