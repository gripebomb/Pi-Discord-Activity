# Codebase Structure

**Analysis Date:** 2026-04-19

## Directory Layout

```text
pi-presence-discord/
├── .pi/                    # Pi/GSD project metadata, templates, prompts, and workflows
│   ├── example-settings.json  # Example local env-backed settings
│   └── gsd/                # Agents, hooks, prompts, references, templates, workflows
├── src/                    # TypeScript source code
│   ├── cli/                # Helper executable entry points
│   ├── extension/          # Pi extension scaffold and local transport
│   ├── helper/             # Discord RPC daemon and local HTTP server
│   └── shared/             # Shared config and payload contracts
├── .planning/              # Generated planning/codebase docs (created by GSD workflows)
├── package.json            # Scripts, dependencies, bin entry, engine requirements
├── README.md               # Project overview and setup instructions
├── tsconfig.json           # TypeScript compiler config
└── .gitignore              # Ignored build artifacts, env files, and logs
```

## Directory Purposes

**`.pi/`:**
- Purpose: Pi-specific project scaffolding and GSD workflow assets
- Contains: `.pi/example-settings.json` and a large `.pi/gsd/` tree
- Key files: `.pi/example-settings.json`, `.pi/gsd/templates/codebase/*.md`, `.pi/gsd/workflows/*.md`
- Subdirectories: `agents/`, `hooks/`, `prompts/`, `references/`, `templates/`, `workflows/`

**`src/cli/`:**
- Purpose: executable entry points for local helper processes
- Contains: `run-helper.ts`
- Key files: `src/cli/run-helper.ts` starts the helper daemon
- Subdirectories: none

**`src/extension/`:**
- Purpose: Pi extension-side event hooks and HTTP publisher logic
- Contains: `index.ts`, `state.ts`, `transport.ts`
- Key files: `src/extension/index.ts` exposes lifecycle hooks; `src/extension/state.ts` manages payload state
- Subdirectories: none

**`src/helper/`:**
- Purpose: helper daemon that accepts presence updates and talks to Discord
- Contains: `index.ts`, `server.ts`, `discord.ts`
- Key files: `src/helper/index.ts`, `src/helper/server.ts`, `src/helper/discord.ts`
- Subdirectories: none

**`src/shared/`:**
- Purpose: shared types and environment-backed defaults
- Contains: `config.ts`, `types.ts`
- Key files: `src/shared/types.ts`, `src/shared/config.ts`
- Subdirectories: none

## Key File Locations

**Entry Points:**
- `src/cli/run-helper.ts` - CLI startup for the Discord helper
- `src/extension/index.ts` - extension-facing hook surface and local dev bootstrap

**Configuration:**
- `package.json` - npm scripts, dependencies, `bin` registration, Node engine
- `tsconfig.json` - TS compile target/output/module settings
- `.pi/example-settings.json` - example runtime environment variables
- `src/shared/config.ts` - actual runtime config defaults and env resolution

**Core Logic:**
- `src/extension/state.ts` - mutable presence state management
- `src/extension/transport.ts` - HTTP publishing to helper
- `src/helper/server.ts` - local `POST /presence` server
- `src/helper/discord.ts` - Discord RPC formatting and updates

**Testing:**
- No test directory or `*.test.*` files currently exist

**Documentation:**
- `README.md` - user/developer overview
- `.pi/gsd/templates/codebase/*.md` - templates for codebase-map docs

## Naming Conventions

**Files:**
- kebab-case TypeScript filenames across `src/` (for example `run-helper.ts`)
- lowercase single-purpose modules are common (`index.ts`, `state.ts`, `server.ts`, `config.ts`, `types.ts`)
- Markdown docs use uppercase root names like `README.md` and GSD-generated docs like `.planning/codebase/STACK.md`

**Directories:**
- lowercase directory names (`src/helper`, `src/shared`, `.pi/gsd/templates`)
- directories are organized by runtime concern rather than by feature slice

**Special Patterns:**
- `index.ts` is used as the public entry module for both `src/extension/` and `src/helper/`
- `.pi/gsd/` is a special project metadata tree, not app runtime code

## Where to Add New Code

**New Pi event integration:**
- Primary code: `src/extension/`
- Shared payload/type updates: `src/shared/types.ts`
- Config changes: `src/shared/config.ts`

**New Discord/helper behavior:**
- Implementation: `src/helper/`
- CLI startup adjustments: `src/cli/run-helper.ts`
- Shared contracts: `src/shared/`

**New tests:**
- No existing convention yet; likely best options are collocated `*.test.ts` in `src/` or a new top-level `tests/` directory

**New documentation/config examples:**
- User-facing docs: `README.md`
- Pi-local examples: `.pi/example-settings.json`
- Planning/reference docs: `.planning/` or `.pi/gsd/templates/`

## Special Directories

**`.pi/gsd/`:**
- Purpose: bundled GSD agents, prompts, templates, and workflows
- Source: committed project metadata
- Committed: yes

**`.planning/`:**
- Purpose: generated planning artifacts such as this codebase map
- Source: created by GSD workflows during analysis/planning
- Committed: currently not ignored by `.gitignore`, so these docs can be checked in

---

*Structure analysis: 2026-04-19*
*Update when directory structure changes*
