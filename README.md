# pi-discord-activity

A repo-ready package for adding **Discord activity** support to the **Pi coding agent**.

This project is split into two pieces:

- a **Pi extension** that listens to real Pi session and activity events
- a **local helper daemon** that owns the Discord RPC connection and updates your Discord activity

## What this starter pack includes

- `package.json`
- TypeScript build config
- Pi extension implementation in `src/extension`
- Discord helper implementation in `src/helper`
- shared types/config in `src/shared`
- example local settings in `.pi/example-settings.json`
- install, setup, service, and verification docs

## Quick Start

1. **Configure Discord (optional)**

   The package already ships with a working default Discord application ID, so custom setup is optional.

   ```bash
   # optional: override the built-in default app
   export DISCORD_RPC_CLIENT_ID="your_discord_client_id"
   ```

   For a custom Discord application, see [docs/discord-setup.md](./docs/discord-setup.md).

2. **Install dependencies and build**

   ```bash
   npm install
   npm run build
   ```

3. **Install the Pi extension**

   ```bash
   pi install .
   ```

   Manual fallback:

   ```bash
   mkdir -p ~/.pi/agent/extensions
   ln -s "$(pwd)/dist/extension/index.js" ~/.pi/agent/extensions/pi-discord-activity.js
   ```

4. **Start the helper**

   ```bash
   npm start
   ```

5. **Verify the integration**

   ```bash
   ./scripts/verify-installation.sh
   ```

   Then follow [docs/verification.md](./docs/verification.md) for the manual Discord-side checks.

## Status

This is a working Pi extension/helper package with:

- ✅ real Pi extension integration
- ✅ Discord activity transport and reconnect handling
- ✅ a built-in default Discord application ID for low-friction setup
- ✅ `pi install .` package installation support
- ✅ setup, service, and verification documentation

Typical next steps for a new user:

1. follow [INSTALL.md](./INSTALL.md)
2. optionally configure a custom Discord application
3. optionally set up a background service using [docs/service-recipes.md](./docs/service-recipes.md)
4. verify the full flow with [docs/verification.md](./docs/verification.md)

## Requirements

- Node.js 20+
- npm 10+
- Discord desktop app running locally
- Pi coding agent installed locally

## Install

For the full guided flow, see [INSTALL.md](./INSTALL.md).

Quick install:

```bash
npm install
npm run build
pi install .
npm start
```

### Guided setup scripts

The repo also includes automation scripts that can write `.env`, build the project, optionally run `pi install .`, and create a background service:

```bash
./setup.sh
# or on Windows
pwsh ./setup.ps1
```

## Local development

Run the helper daemon:

```bash
npm run dev:helper
```

In another terminal, build and install the extension or use `pi install .` again after making changes.

If you want to test the HTTP transport without Pi, keep the helper running and POST a payload to:

```text
http://127.0.0.1:42666/presence
```

## Environment variables

The package ships with a built-in default Discord RPC client ID:

- `1495329514417426522`

So `DISCORD_RPC_CLIENT_ID` is optional for normal use. The helper also reads `.env` and `.env.local` from the project root.

Common configuration:

```dotenv
DISCORD_RPC_CLIENT_ID=1495329514417426522
PI_PRESENCE_PORT=42666
PI_PRESENCE_HOST=127.0.0.1
PI_PRESENCE_PRIVACY_MODE=true
PI_PRESENCE_INCLUDE_PROJECT=false
PI_PRESENCE_DEBOUNCE_MS=2000
PI_PRESENCE_DEBUG=false
```

### Privacy defaults

Default behavior is privacy-first:

- project name is hidden unless explicitly enabled
- prompt content is never sent to Discord
- filenames are not sent to Discord

To allow project names in the Discord state line, set both:

```bash
export PI_PRESENCE_PRIVACY_MODE="false"
export PI_PRESENCE_INCLUDE_PROJECT="true"
```

## Example Discord activity mapping

- **Details**: `Using Pi Coding Agent`
- **State**: `<model> • <activity>`
- **Large image**: `pi`
- **Small image**: provider key such as `openai`

Common activities:

- `Starting`
- `Thinking`
- `Running Tools`
- `Editing Files`
- `Idle`
- `Error`

## Documentation

- [INSTALL.md](./INSTALL.md) — full installation guide
- [docs/discord-setup.md](./docs/discord-setup.md) — custom Discord application setup
- [docs/service-recipes.md](./docs/service-recipes.md) — macOS, Linux, and Windows service recipes
- [docs/verification.md](./docs/verification.md) — manual verification flow and troubleshooting

## License

MIT
