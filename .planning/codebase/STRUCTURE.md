# Codebase Structure

**Analysis Date:** 2026-04-19

## Directory Layout

```text
pi-presence-discord/
├── .pi/                    # Pi extension example config and committed GSD metadata
│   ├── example-settings.json
│   ├── extensions/
│   └── gsd/
├── .planning/              # Planning artifacts, phase docs, and codebase map docs
├── docs/                   # User-facing setup, service, and verification guides
├── scripts/                # Automation and verification helper scripts
├── src/                    # TypeScript source code
│   ├── cli/                # Helper executable entry points
│   ├── extension/          # Pi extension lifecycle/event handling
│   ├── helper/             # Discord RPC daemon and local HTTP bridge
│   ├── shared/             # Shared config and payload contracts
│   └── types/              # Local ambient type declarations
├── tests/                  # Unit and integration tests
│   ├── helper/
│   └── integration/
├── INSTALL.md              # Full installation guide
├── README.md               # Quick-start and overview
├── setup.ps1               # Windows setup automation
├── setup.sh                # Unix setup automation
├── package.json            # Scripts, dependencies, Pi metadata, engine requirements
├── package-lock.json       # npm lockfile
├── tsconfig.json           # TypeScript compiler config
├── .gitignore              # Ignored build artifacts, env files, and logs
└── .npmignore              # Files excluded from packaged distribution artifacts
```

## Directory Purposes

**`docs/`:**
- Purpose: install and operations documentation for end users
- Key files: `docs/discord-setup.md`, `docs/service-recipes.md`, `docs/verification.md`

**`scripts/`:**
- Purpose: repeatable verification helpers and platform-specific operational checks
- Key files: `scripts/verify-installation.sh`, `scripts/verify-installation.ps1`

**`src/cli/`:**
- Purpose: helper process bootstrap
- Key file: `src/cli/run-helper.ts`
- Notes: loads `.env` / `.env.local` before starting the compiled helper runtime

**`src/extension/`:**
- Purpose: Pi extension-side lifecycle hooks and HTTP publisher logic
- Key files: `src/extension/index.ts`, `src/extension/state.ts`, `src/extension/transport.ts`

**`src/helper/`:**
- Purpose: helper daemon that accepts presence updates and talks to Discord RPC
- Key files: `src/helper/index.ts`, `src/helper/server.ts`, `src/helper/discord.ts`

**`src/shared/`:**
- Purpose: shared config and payload contracts used by both extension and helper
- Key files: `src/shared/config.ts`, `src/shared/types.ts`

**`src/types/`:**
- Purpose: local ambient declarations for third-party/runtime-provided APIs
- Key files: `src/types/discord-rpc.d.ts`, `src/types/pi-coding-agent.d.ts`

**`tests/`:**
- Purpose: automated verification of helper, extension, and integration behavior
- Key files: `tests/extension.test.ts`, `tests/helper/discord-reconnect.test.ts`, `tests/helper/shutdown.test.ts`, `tests/integration/presence-e2e.test.ts`

## Key File Locations

**Entry Points:**
- `src/cli/run-helper.ts` - CLI startup for the Discord helper
- `src/extension/index.ts` - Pi extension event wiring and payload publication

**Configuration:**
- `package.json` - npm scripts, dependencies, Pi package metadata, Node engine
- `package-lock.json` - committed npm dependency lockfile
- `.pi/example-settings.json` - example runtime environment values
- `src/shared/config.ts` - actual runtime config defaults and env resolution
- `.npmignore` - packaging filter for installable tarballs

**Core Logic:**
- `src/extension/state.ts` - mutable presence state management
- `src/extension/transport.ts` - HTTP publishing to helper
- `src/helper/server.ts` - local `POST /presence` server
- `src/helper/discord.ts` - Discord RPC formatting, reconnect, and updates

**Testing:**
- `tests/extension.test.ts` - extension registration expectations
- `tests/helper/*.test.ts` - helper rendering, reconnect, debounce, shutdown coverage
- `tests/integration*.test.ts` - helper server and transport integration coverage

**Documentation:**
- `README.md` - quick-start and overview
- `INSTALL.md` - full install flow
- `docs/*.md` - setup, service, and verification guides

## Naming Conventions

**Files:**
- kebab-case TypeScript filenames across runtime code and scripts
- markdown docs use descriptive lowercase names under `docs/`
- phase artifacts under `.planning/phases/` use `NN-PLAN-XX.md` and `NN-XX-SUMMARY.md`

**Directories:**
- runtime code is organized by concern (`extension`, `helper`, `shared`) rather than by feature slice
- operational docs live in `docs/`, automation in `scripts/`, planning artifacts in `.planning/`

## Where to Add New Code

**New Pi integration behavior:**
- Primary code: `src/extension/`
- Shared payload changes: `src/shared/types.ts`
- Config changes: `src/shared/config.ts`

**New helper/runtime behavior:**
- Primary code: `src/helper/`
- Bootstrap or env-loading changes: `src/cli/run-helper.ts`
- Cross-cutting types/config: `src/shared/`

**New tests:**
- Add unit tests under `tests/` grouped by subsystem
- Keep helper integration tests under `tests/integration/` when exercising the HTTP bridge

**New docs/automation:**
- User-facing docs: `README.md`, `INSTALL.md`, `docs/`
- Operational scripts: `scripts/`, `setup.sh`, `setup.ps1`

## Special Directories

**`.pi/`:**
- Purpose: Pi-specific project scaffolding plus committed GSD workflow assets
- Committed: yes

**`.planning/`:**
- Purpose: generated planning artifacts, summaries, verification reports, and codebase-map docs
- Committed: yes

---

*Structure analysis: 2026-04-19*
*Update when directory structure changes*
