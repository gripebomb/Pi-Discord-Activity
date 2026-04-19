# Install pi-discord-activity

This guide walks through installing the Pi extension and the local helper so Discord activity reflects real Pi activity.

If you want the shortest local-repo path:

1. `npm install`
2. `npm run build`
3. `pi install .`
4. Open Pi and let the extension auto-start the helper
5. Verify activity in Discord

For a guided setup that writes `.env`, builds the project, optionally installs the extension, and can create a background service, use:

```bash
./setup.sh
# or on Windows
pwsh ./setup.ps1
```

## What gets installed

This repository contains two pieces:

- a **Pi extension** that listens to real Pi lifecycle events and publishes normalized presence payloads
- a **local helper** that owns the Discord RPC connection and updates Discord activity

The extension and helper communicate over local HTTP on `127.0.0.1:42666` by default.

## Prerequisites

You need:

- Node.js 20+
- npm 10+
- the Discord desktop app running locally
- the Pi coding agent installed locally

Optional but useful:

- `git` if you plan to clone the repo
- `pwsh` on Windows if you want to use the PowerShell setup and verification scripts

## Step 1: Get the source and install dependencies

Clone the repo and install dependencies:

```bash
git clone https://github.com/gripebomb/pi-discord-activity.git
cd pi-discord-activity
npm install
```

If you already have the repo locally, just run:

```bash
npm install
```

## Step 2: Configure Discord application identity

You have two choices.

### Choice A: Use the built-in default app

This package already includes a default Discord RPC client ID:

- `1495329514417426522`

If you do not need custom branding, you can keep using that value and skip custom Discord Developer Portal setup.

### Choice B: Use your own Discord app

If you want your own branding or your own image assets:

1. Create a Discord application
2. Copy its Application ID
3. Set `DISCORD_RPC_CLIENT_ID`
4. Upload Rich Presence assets for `pi` and any provider keys you want to render

See [docs/discord-setup.md](./docs/discord-setup.md) for the full walkthrough.

## Step 3: Create local configuration

The helper reads environment values from the shell and also from `.env` / `.env.local` in the project root.

A minimal `.env` looks like this:

```dotenv
DISCORD_RPC_CLIENT_ID=1495329514417426522
PI_PRESENCE_HOST=127.0.0.1
PI_PRESENCE_PORT=42666
PI_PRESENCE_PRIVACY_MODE=true
PI_PRESENCE_INCLUDE_PROJECT=false
PI_PRESENCE_DEBOUNCE_MS=2000
PI_PRESENCE_AUTOSTART_HELPER=true
PI_PRESENCE_DEBUG=false
```

You can create that file manually or let the setup script create it for you.

### Privacy settings

Defaults are privacy-first:

- `PI_PRESENCE_PRIVACY_MODE=true`
- `PI_PRESENCE_INCLUDE_PROJECT=false`

To allow project names in Discord, set both:

```dotenv
PI_PRESENCE_PRIVACY_MODE=false
PI_PRESENCE_INCLUDE_PROJECT=true
```

## Step 4: Build the package

Build the TypeScript sources before installing or running the helper:

```bash
npm run build
```

This generates:

- `dist/extension/index.js`
- `dist/cli/run-helper.js`

You can also run the automated verification later to confirm these files exist.

## Step 5: Install the Pi extension

### Option A: Preferred — install with `pi install .`

From the repo root:

```bash
pi install .
```

This is the main supported install flow for local development and local package installation.

After installation, Pi should be able to discover the package-defined extension from `package.json`.

### Option B: Manual symlink into the Pi extensions directory

Use this only if you want a direct file-based link for local experimentation.

```bash
mkdir -p ~/.pi/agent/extensions
ln -s "$(pwd)/dist/extension/index.js" ~/.pi/agent/extensions/pi-discord-activity.js
```

This gives you an explicit extension file in the local Pi extensions directory.

### Option C: Packaged distribution artifact

If you want a package artifact for transfer or local archival:

```bash
npm pack
```

That produces a tarball such as:

```text
pi-discord-activity-0.1.1.tgz
```

The tarball is useful for inspecting the packaged contents or for advanced distribution workflows. For day-to-day local setup, `pi install .` from the repo root is simpler.

## Step 6: Helper startup mode

### Default: let Pi auto-start the helper

By default, the extension will start the helper automatically the first time it needs to publish Discord activity.

This behavior is controlled by:

```dotenv
PI_PRESENCE_AUTOSTART_HELPER=true
```

For most users, this is the easiest option because there is no separate startup step after installation.

### Optional: foreground / terminal session

If you prefer to run the helper explicitly, use the compiled helper:

```bash
npm start
```

Or for live TypeScript development:

```bash
npm run dev:helper
```

To disable auto-start and require manual startup, set:

```dotenv
PI_PRESENCE_AUTOSTART_HELPER=false
```

### Optional: background service

If you want the helper to stay running outside a dev terminal, follow:

- [docs/service-recipes.md](./docs/service-recipes.md)

That document covers:

- macOS `launchd`
- Linux `systemd --user`
- Windows NSSM-based service setup

## Step 7: Confirm Discord is ready

Before you verify anything else:

1. Start the Discord desktop app
2. Sign in
3. Leave it open
4. Make sure you are not relying on the web-only Discord client

The helper can run without Discord, but no Discord activity appears until the desktop client is available.

## Step 8: Verify the full flow

Use the manual verification guide:

- [docs/verification.md](./docs/verification.md)

Or use the automated checks:

```bash
./scripts/verify-installation.sh
# or on Windows
pwsh ./scripts/verify-installation.ps1
```

The verification scripts check project structure, build outputs, package manifest metadata, and can exercise the helper HTTP endpoint.

## Recommended quick-start flow

If you are installing this on your own machine for the first time, this is the path I recommend:

```bash
npm install
npm run build
pi install .
```

Then:

1. start Pi
2. ask Pi to do something simple
3. watch Discord for the activity change

If you want help writing `.env` and creating a service, run `./setup.sh` or `pwsh ./setup.ps1` instead of doing everything manually.

## Troubleshooting

### `pi install .` fails

Check:

- you are in the repo root
- `npm run build` completed successfully
- your local Pi installation is recent enough to support package installation
- `package.json` still contains the `pi.extensions` entry

### Helper starts but Discord stays blank

Check:

- Discord desktop app is running
- the `DISCORD_RPC_CLIENT_ID` is correct if you overrode the default
- your custom application has the art assets you expect
- the helper log shows no repeated startup errors

### Provider icon is missing

The small image key comes from the provider name normalized to lowercase with punctuation removed or replaced by dashes. Upload an asset that matches the provider key you actually use.

### Project name is showing when you do not want it

Make sure these values are set back to the privacy-first defaults:

```dotenv
PI_PRESENCE_PRIVACY_MODE=true
PI_PRESENCE_INCLUDE_PROJECT=false
```

Then restart the helper, or let Pi auto-start a fresh helper instance on the next session if auto-start remains enabled.

### `.env` changes do not seem to apply

Restart the helper or restart the service after editing `.env`. Configuration is read at process start.

## File and command reference

| Item | Purpose |
| --- | --- |
| `package.json` | Pi package manifest and npm metadata |
| `src/extension/index.ts` | Pi extension entrypoint |
| `dist/extension/index.js` | built extension used for manual linking |
| `dist/cli/run-helper.js` | helper entrypoint |
| `.pi/example-settings.json` | example environment/settings values |
| `docs/discord-setup.md` | custom Discord application walkthrough |
| `docs/service-recipes.md` | background-service recipes |
| `docs/verification.md` | end-to-end verification flow |

## Next steps

After installation works:

1. decide whether you want a custom Discord app or the built-in default
2. optionally create a background service so the helper starts automatically
3. verify both privacy modes: hidden-by-default and explicit project visibility
4. keep the verification guide handy for future troubleshooting
