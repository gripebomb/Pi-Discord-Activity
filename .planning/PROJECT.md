# pi-discord-presence

## What This Is

A Pi package/extension and local helper that connect real Pi activity to Discord Rich Presence. It is for Pi users who want Discord to reflect what Pi is doing locally, with privacy-first defaults and a setup flow that can be followed without reading source code.

## Core Value

Real Pi activity should appear reliably in Discord Rich Presence with minimal setup and without leaking sensitive project details by default.

## Requirements

### Validated

- ✓ Local helper daemon can receive presence updates over HTTP and forward them to Discord RPC
- ✓ Shared payload schema and config exist for extension/helper communication
- ✓ Pi package/extension is wired to real Pi lifecycle events instead of placeholder hooks
- ✓ Privacy-first defaults hide project details unless explicitly enabled
- ✓ Installation docs explain Discord app setup, `pi install .`, helper startup, and troubleshooting
- ✓ Setup automation can write `.env`, build the project, and guide extension/service setup
- ✓ Verification docs and smoke-test scripts exist for package, helper, and install checks
- ✓ Service recipes exist for macOS `launchd`, Linux `systemd --user`, and Windows NSSM

### Active

- [ ] Live Discord desktop UAT for reconnect and project-name opt-in behavior remains pending from Phase 2 human verification
- [ ] Cross-platform execution of the PowerShell setup/verification scripts still needs confirmation in a Windows or `pwsh` environment

### Out of Scope

- Showing prompt content, filenames, or other sensitive coding details in Discord
- Multi-session coordination across multiple simultaneous Pi sessions
- Turning this into a hosted/cloud integration rather than a local helper + local Pi extension

## Context

This repository contains a Pi-side extension that publishes normalized presence payloads to a local helper daemon, and the helper owns the Discord RPC connection. The package ships with a built-in default Discord RPC Application ID so users can get running immediately, but users can still override that value for custom branding or asset control.

The current v1 install experience now includes:

- README quick-start guidance
- a dedicated `INSTALL.md`
- Discord setup documentation
- service recipes
- setup scripts
- verification scripts
- `pi install .` smoke-tested from the repo root

## Constraints

- **Platform**: Local desktop integration only; Discord desktop must be running locally for Rich Presence to appear
- **Privacy**: Project names stay hidden unless the user explicitly opts in
- **Architecture**: Preserve the split extension/helper design unless Pi support reveals a better official path
- **Scope**: Brownfield TypeScript codebase with committed planning/codebase docs

## Key Decisions

| Decision | Rationale | Outcome |
| -------- | --------- | ------- |
| Ship a built-in default Discord RPC client ID | Removes unnecessary setup friction while still allowing overrides for custom branding | Validated in Phases 2-3 |
| Keep Discord output coarse and privacy-safe | Model + activity state is useful without leaking filenames or prompt content | Validated in Phases 1-2 |
| Load `.env` / `.env.local` in the helper bootstrap | Makes setup scripts and background-service recipes align with real runtime behavior | Validated in Phase 3 |
| Treat install verification as both docs + smoke tests | Users need copy-paste instructions and a reproducible way to detect packaging/setup failures | Validated in Phase 3 |

## Evolution

This document evolves at phase transitions and milestone boundaries.

- Phase 1 validated the real Pi extension wiring.
- Phase 2 validated helper stability and privacy behavior in automation, with live UAT still pending.
- Phase 3 validated installation, setup, packaging, and verification documentation/workflows.

---
*Last updated: 2026-04-19 after Phase 3 execution and verification*
