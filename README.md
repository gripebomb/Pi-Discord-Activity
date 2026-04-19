# pi-discord-presence

A repo-ready starter pack for adding **Discord Rich Presence** support to the **Pi coding agent**.

This scaffold is split into two pieces:

- a **Pi extension** that detects session and model changes and sends presence payloads
- a **local helper daemon** that owns the Discord RPC connection and updates the user's activity

## What this starter pack includes

- `package.json`
- TypeScript build config
- Pi extension scaffold in `src/extension`
- Discord helper scaffold in `src/helper`
- shared types/config in `src/shared`
- example local settings in `.pi/example-settings.json`

## Status

This is a **starter scaffold**, not a finished plugin.
You will still need to:

1. create a Discord application in the Discord Developer Portal
2. add Rich Presence image assets like `pi`, `openai`, `anthropic`, etc.
3. replace the placeholder Pi extension hook registration with Pi's real extension API wiring
4. package/install the extension in your Pi environment

## Requirements

- Node.js 20+
- npm 10+
- Discord desktop app running locally
- Pi coding agent installed locally

## Install

```bash
npm install
npm run build
```

## Local development

Run the helper daemon:

```bash
npm run dev:helper
```

In another terminal, run the extension scaffold in dev mode:

```bash
npm run dev:extension
```

The dev extension will publish a fake session start and a fake idle transition so you can verify the transport path.

## Environment variables

You can export these before running the helper:

```bash
export DISCORD_RPC_CLIENT_ID="YOUR_DISCORD_APP_CLIENT_ID"
export PI_PRESENCE_PORT="42666"
export PI_PRESENCE_HOST="127.0.0.1"
export PI_PRESENCE_PRIVACY_MODE="true"
export PI_PRESENCE_INCLUDE_PROJECT="false"
export PI_PRESENCE_DEBOUNCE_MS="2000"
```

## Discord application setup

Create a Discord application and note its **Client ID**.
Then upload Rich Presence assets that match the image keys used in `src/helper/discord.ts`:

- `pi`
- provider image keys you plan to use, such as `openai`, `anthropic`, `google`

If you do not upload matching assets, Discord may still connect, but image badges will not render correctly.

## Suggested Pi integration flow

The extension scaffold exposes these functions:

- `onSessionStart()`
- `onModelChange()`
- `onThinking()`
- `onToolCall()`
- `onFileEdit()`
- `onIdle()`
- `onError()`

Your real Pi integration should call those when corresponding events occur.

## Example payload

```json
{
  "app": "pi-coding-agent",
  "provider": "openai",
  "model": "gpt-5.4",
  "state": "thinking",
  "projectName": "example-project",
  "startedAt": 1776566400,
  "sessionId": "dev-session",
  "privacyMode": true
}
```

## Example Discord activity mapping

- **Details**: `Using Pi Coding Agent`
- **State**: `gpt-5.4 • Thinking`
- **Large image**: `pi`
- **Small image**: provider key such as `openai`

## Suggested install layout for Pi

A reasonable local workflow is:

1. keep this repo in your development directory
2. build it with `npm run build`
3. copy or symlink the extension entry into your Pi extension directory
4. run the helper as a background user service or shell startup command

Example idea:

```bash
mkdir -p ~/.pi/agent/extensions
ln -s /absolute/path/to/pi-discord-presence/dist/extension/index.js ~/.pi/agent/extensions/pi-discord-presence.js
```

Adjust that layout to match your local Pi install conventions.

## Packaging ideas

Once working, you can turn this into:

- an npm package installable by Pi
- a Homebrew package or shell installer for the helper
- a small release bundle with prebuilt JavaScript files

## Privacy recommendations

Default behavior in this scaffold is privacy-first:

- project name is hidden unless explicitly enabled
- prompt content is never sent to Discord
- filenames are not shown

That is a safer default for coding work.

## Next implementation steps

1. wire the Pi extension to real Pi events
2. confirm model/provider extraction from Pi session data
3. create Discord assets
4. test debounce behavior during rapid tool calls
5. add config file loading
6. add better multi-session handling
7. add Windows/macOS/Linux service helpers

## License

MIT
