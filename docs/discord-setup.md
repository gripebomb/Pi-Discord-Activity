# Discord application setup for pi-discord-activity

This guide explains how to use **pi-discord-activity** with either the built-in default Discord activity application or your own custom Discord application.

If you want the fastest path, you can skip most of this guide and use the default client ID that already ships with the package:

- `1495329514417426522`

That default works well for local verification and everyday use. You only need a custom Discord application if you want your own branding, your own image assets, or you want to control the application identity shown in Discord.

> Screenshot placeholder: Discord desktop app showing a working Pi activity session.

## What this integration needs from Discord

The helper uses Discord's local RPC connection from the desktop app. It does **not** need a Discord bot and it does **not** need an OAuth redirect flow just to show Rich Presence locally.

What you need is:

1. A Discord desktop app running on the same machine as Pi
2. A Discord application client ID
3. Optional Rich Presence art assets that match the image keys used by this project

The helper reads `DISCORD_RPC_CLIENT_ID` from the environment. If that value is missing, it falls back to the built-in default application ID.

## Option A: Use the built-in default application

Use this option if you want the shortest setup path.

1. Do nothing in the Discord Developer Portal
2. Leave `DISCORD_RPC_CLIENT_ID` unset, or let `setup.sh` / `setup.ps1` write the default value into `.env`
3. Continue with [INSTALL.md](../INSTALL.md)

This is the recommended path for first-time setup because it removes the most error-prone step.

## Option B: Create your own Discord application

Use this option if you want custom branding, custom art assets, or your own application identity.

### Step 1: Open the Discord Developer Portal

1. Go to <https://discord.com/developers/applications>
2. Sign in with the same Discord account you use in the desktop app
3. Click **New Application**
4. Enter a name such as `Pi Presence` or any name you want to see in Discord
5. Save the application

> Screenshot placeholder: Discord Developer Portal with the **New Application** dialog open.

### Step 2: Copy the Application ID (Client ID)

After the application is created:

1. Open the **General Information** page
2. Copy the **Application ID**
3. Use that value as `DISCORD_RPC_CLIENT_ID`

Example shell configuration:

```bash
export DISCORD_RPC_CLIENT_ID="123456789012345678"
```

Example `.env` file in the repo root:

```dotenv
DISCORD_RPC_CLIENT_ID=123456789012345678
```

The helper started with `npm start` or `node dist/cli/run-helper.js` will read `.env` automatically.

> Screenshot placeholder: Discord application **General Information** page with **Application ID** highlighted.

### Step 3: Add Rich Presence image assets

This project always uses the following image keys when building Discord activity:

- large image key: `pi`
- small image key: provider name normalized to lowercase and dashes

Common provider keys you should upload if you use those providers:

- `openai`
- `anthropic`
- `google`

If your Pi model provider normalizes to something else, upload an asset that matches that key. For example, a provider named `Google AI Studio` would normalize to `google-ai-studio`.

Recommended minimum asset list:

| Asset key | Purpose |
| --- | --- |
| `pi` | Large application image shown for all activity |
| `openai` | Small image when OpenAI-backed models are active |
| `anthropic` | Small image when Anthropic-backed models are active |
| `google` | Small image when Google-backed models are active |

If you skip provider-specific assets, Rich Presence can still work, but the provider badge may not render.

> Screenshot placeholder: Discord Developer Portal Rich Presence art assets page showing uploaded images.

### Step 4: Confirm desktop app availability

Rich Presence only appears when the **Discord desktop application** is running locally. The browser version of Discord does not expose the same local RPC behavior.

Before you test the helper:

1. Start Discord Desktop
2. Sign in
3. Leave it open while Pi and the helper are running

### Step 5: Configure the environment value

Pick one of these approaches.

#### Option 1: `.env` file in the project root

```dotenv
DISCORD_RPC_CLIENT_ID=123456789012345678
PI_PRESENCE_HOST=127.0.0.1
PI_PRESENCE_PORT=42666
PI_PRESENCE_PRIVACY_MODE=true
PI_PRESENCE_INCLUDE_PROJECT=false
PI_PRESENCE_DEBOUNCE_MS=2000
PI_PRESENCE_DEBUG=false
```

#### Option 2: shell exports

```bash
export DISCORD_RPC_CLIENT_ID="123456789012345678"
export PI_PRESENCE_HOST="127.0.0.1"
export PI_PRESENCE_PORT="42666"
export PI_PRESENCE_PRIVACY_MODE="true"
export PI_PRESENCE_INCLUDE_PROJECT="false"
export PI_PRESENCE_DEBOUNCE_MS="2000"
export PI_PRESENCE_DEBUG="false"
```

#### Option 3: run the setup script

```bash
./setup.sh
# or on Windows
pwsh ./setup.ps1
```

The setup scripts can write a working `.env` file for you.

## Privacy and project visibility

This package is privacy-first by default.

Default behavior:

- project names are hidden
- prompt content is never sent
- filenames are not sent to Discord
- only app, provider, model, and coarse activity state are shown

To allow project names in the Discord state line, enable both of these:

```bash
export PI_PRESENCE_PRIVACY_MODE="false"
export PI_PRESENCE_INCLUDE_PROJECT="true"
```

If either value is left at its default, project names stay hidden.

## Expected Discord activity fields

With a working setup, Discord activity should look roughly like this:

- **Details:** `Using Pi Coding Agent`
- **State:** `gpt-5.4 • Thinking`
- **Large image:** `pi`
- **Small image:** provider key such as `openai`

The exact model label depends on what Pi reports in the active session.

## Common mistakes

### Uploading the wrong asset keys

The helper expects exact keys. If your provider badge is missing, check the normalized provider key and upload an asset with the same name.

### Creating a bot and assuming it is required

A bot is not required for local Rich Presence. The important value for this project is the application's client ID.

### Testing with the web version of Discord

Use the desktop app. Rich Presence depends on the local RPC connection.

### Forgetting to restart the helper after changing configuration

If you change `DISCORD_RPC_CLIENT_ID` or privacy settings, restart the helper or restart the service so it reloads the environment.

## Quick verification

After configuration:

1. Start the helper with `npm start`
2. Install the extension with `pi install .`
3. Start Pi and do something simple like asking a question or triggering a tool call
4. Watch Discord for activity updates

For the full end-to-end checklist, see [docs/verification.md](./verification.md).

## Related documentation

- [INSTALL.md](../INSTALL.md) — full install flow
- [docs/service-recipes.md](./service-recipes.md) — run the helper as a background service
- [docs/verification.md](./verification.md) — end-to-end verification guide
