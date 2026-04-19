# Technology Stack

**Analysis Date:** 2026-04-19

## Languages

**Primary:**
- TypeScript 5.8 - all runtime code in `src/`

**Secondary:**
- Markdown - user docs in `README.md`, `INSTALL.md`, and `docs/*.md`
- Shell / PowerShell - setup and verification automation in `setup.sh`, `setup.ps1`, `scripts/verify-installation.sh`, and `scripts/verify-installation.ps1`
- JSON - package metadata, lockfile, example settings, and planning/config artifacts

## Runtime

**Environment:**
- Node.js 20+ required via `package.json#engines.node`
- Local desktop runtime assumption: Discord desktop app plus a local Pi installation

**Package Manager:**
- npm
- Lockfile: `package-lock.json` is committed

## Frameworks and Libraries

**Core runtime:**
- `discord-rpc` ^4.0.1 - Discord Rich Presence IPC client used by `src/helper/discord.ts`
- `zod` ^3.24.2 - payload validation used in `src/shared/types.ts` and `src/helper/server.ts`
- `dotenv` ^17.4.2 - repo-root `.env` / `.env.local` loading in `src/cli/run-helper.ts`

**Build / dev:**
- `typescript` ^5.8.2 - compile step for `dist/`
- `tsx` ^4.19.3 - local TypeScript execution and test runner

## Configuration

**Runtime configuration:**
- Environment variables remain the source of truth for runtime settings
- The helper bootstrap loads `.env` and `.env.local` before importing runtime modules
- Expected variables: `DISCORD_RPC_CLIENT_ID`, `PI_PRESENCE_PORT`, `PI_PRESENCE_HOST`, `PI_PRESENCE_PRIVACY_MODE`, `PI_PRESENCE_INCLUDE_PROJECT`, `PI_PRESENCE_DEBOUNCE_MS`, `PI_PRESENCE_DEBUG`

**Build and packaging:**
- `tsconfig.json` - TypeScript compiler settings (`NodeNext`, declarations, sourcemaps, strict mode)
- `package.json` - scripts, dependencies, Pi extension metadata, helper bin entry
- `.npmignore` - excludes planning/GSD internals and test-only files from package artifacts

## Platform Requirements

**Development / local usage:**
- macOS, Linux, and Windows are all documented targets
- Pi must be installed locally for the extension side
- Discord desktop must be running locally for Rich Presence to appear

**Background-service recipes:**
- macOS `launchd`
- Linux `systemd --user`
- Windows NSSM (documented wrapper approach)

## Packaging Model

**Install path:**
- Primary local install flow: `pi install .`
- Packaged distribution sanity check: `npm pack --dry-run`

**Runtime artifacts:**
- helper entry: `dist/cli/run-helper.js`
- extension build output: `dist/extension/index.js`
- Pi package metadata currently points at `./src/extension/index.ts`

---

*Stack analysis: 2026-04-19*
*Update after major dependency or packaging changes*
