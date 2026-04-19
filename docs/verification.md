# Verification guide for pi-discord-activity

This guide walks through a reproducible end-to-end check of the package so you can confirm:

- the helper starts successfully
- the extension can be installed with `pi install .`
- Pi activity reaches the helper
- Discord activity updates as expected
- privacy defaults behave correctly
- the helper survives normal restart scenarios

If you want automated checks first, run:

```bash
./scripts/verify-installation.sh
# or on Windows
pwsh ./scripts/verify-installation.ps1
```

The scripts do not replace manual verification in Discord, but they catch most packaging and setup mistakes before you spend time debugging the UI.

## Before you start

Make sure all of these are true:

- `npm install` completed successfully
- `npm run build` completed successfully
- Discord desktop is installed and signed in
- the Pi coding agent is installed locally
- the repo has a valid `.env` file or equivalent shell environment

Recommended `.env`:

```dotenv
DISCORD_RPC_CLIENT_ID=1495329514417426522
PI_PRESENCE_HOST=127.0.0.1
PI_PRESENCE_PORT=42666
PI_PRESENCE_PRIVACY_MODE=true
PI_PRESENCE_INCLUDE_PROJECT=false
PI_PRESENCE_DEBOUNCE_MS=2000
PI_PRESENCE_DEBUG=true
```

For verification, setting `PI_PRESENCE_DEBUG=true` is helpful because it exposes helper and extension logging while you test. You can change it back to `false` afterward.

---

## Phase 1: Verify the package and build outputs

These checks confirm that the local package is structurally ready before you test Discord.

### 1.1 Check package metadata

```bash
node -e "const pkg=require('./package.json'); console.log(pkg.name); console.log(pkg.pi.extensions); console.log(pkg.keywords.includes('pi-package'));"
```

Expected results:

- package name prints `pi-discord-activity`
- `pi.extensions` includes `./src/extension/index.ts`
- `pi-package` is present in `keywords`

### 1.2 Check build artifacts

```bash
ls dist/cli/run-helper.js dist/extension/index.js
```

Expected results:

- both files exist
- there are no TypeScript compilation errors if you rerun `npm run build`

### 1.3 Run automated tests

```bash
npm test
```

Expected results:

- the test suite passes
- no regression appears in helper or extension behavior

This validates the local codebase before you move into runtime checks.

---

## Phase 2: Verify the helper in isolation

The helper is the process that talks to Discord RPC and exposes the local `/presence` endpoint.

### 2.1 Start the helper

```bash
npm start
```

If you prefer live TypeScript execution during local development:

```bash
npm run dev:helper
```

When `PI_PRESENCE_DEBUG=true`, you should see diagnostic output such as connection or reconnect messages. If Discord is not open yet, the helper can still start successfully and wait for a later presence update.

### 2.2 Exercise the HTTP endpoint directly

In a second terminal, send a sample payload:

```bash
curl -i -X POST http://127.0.0.1:42666/presence \
  -H 'Content-Type: application/json' \
  -d '{
    "app": "pi-coding-agent",
    "provider": "openai",
    "model": "gpt-4.1",
    "state": "thinking",
    "projectName": "example-project",
    "startedAt": 1735689600,
    "sessionId": "manual-verification",
    "privacyMode": true
  }'
```

Expected result:

- HTTP status `204 No Content`

If the request fails:

- confirm the helper is still running
- confirm `PI_PRESENCE_PORT` is still `42666`
- confirm no other process is already using the port

### 2.3 Confirm the helper accepts `.env`

Edit `.env`, change `PI_PRESENCE_DEBUG` or `DISCORD_RPC_CLIENT_ID`, and restart the helper.

Expected result:

- the helper starts with the new configuration after restart
- no extra shell export step is needed when running from the repo root

---

## Phase 3: Verify `pi install .` and extension availability

This phase confirms the package is installable through Pi's supported package flow.

### 3.1 Install the package

From the repo root:

```bash
pi install .
```

Expected result:

- Pi accepts the local package install
- no manifest error is reported

If this fails, check:

- `package.json` still contains the `pi.extensions` block
- `npm run build` completed
- your Pi installation is available on `PATH`

### 3.2 Confirm the install command is available

```bash
pi --version
```

Expected result:

- Pi prints a valid version string

### 3.3 Optional: verify the package tarball

This is not required for normal local installation, but it is a useful packaging sanity check:

```bash
npm pack --dry-run
```

Expected result:

- npm lists the package contents without error
- the package metadata and docs are included as expected

---

## Phase 4: Verify end-to-end Pi activity → helper → Discord

This phase is the real product check.

### 4.1 Make sure Discord desktop is open

Discord activity requires the desktop application, not the browser-only client.

### 4.2 Keep helper logs visible

Run the helper in a terminal with debug logging enabled, or tail the service log if you are using `launchd`, `systemd`, or NSSM.

Examples:

```bash
npm start
```

macOS service log:

```bash
tail -f /tmp/pi-discord-activity.log
```

Linux service log:

```bash
journalctl --user -u pi-discord-activity.service -f
```

### 4.3 Trigger a new Pi session

Start Pi in any project directory where you normally work. Then perform a few natural actions:

1. start a fresh session
2. ask Pi a question so it begins thinking
3. trigger a tool call such as `read`, `bash`, or `edit`
4. let the agent finish so it returns to idle

### 4.4 Watch Discord for the expected state transitions

The current implementation intentionally keeps Discord output coarse and privacy-safe.

Expected display:

- **Details:** `Using Pi Coding Agent`
- **State:** `<model> • <activity>`

Common state values:

- `Starting`
- `Thinking`
- `Running Tools`
- `Editing Files`
- `Idle`
- `Error`

Examples:

- `gpt-4.1 • Starting`
- `gpt-4.1 • Thinking`
- `gpt-4.1 • Running Tools`
- `gpt-4.1 • Editing Files`
- `gpt-4.1 • Idle`

Important current behavior:

- filenames are **not** shown in Discord
- tool names are **not** shown in Discord
- prompt content is **never** shown
- project name is hidden by default

That is expected, not a bug.

### 4.5 Confirm model/provider changes propagate

Switch models inside Pi or start a session with a different provider/model combination.

Expected result:

- the next Discord update uses the new model label
- the provider badge changes if you have uploaded a matching provider asset

---

## Phase 5: Verify privacy behavior

Privacy defaults are part of the product promise, so test both modes.

### 5.1 Default privacy mode

Use this configuration:

```dotenv
PI_PRESENCE_PRIVACY_MODE=true
PI_PRESENCE_INCLUDE_PROJECT=false
```

Restart the helper and trigger Pi activity.

Expected result:

- the Discord state line does **not** include the project name
- you still see model + activity state

### 5.2 Explicit project-name opt-in

Use this configuration:

```dotenv
PI_PRESENCE_PRIVACY_MODE=false
PI_PRESENCE_INCLUDE_PROJECT=true
```

Restart the helper and trigger activity from a named project directory.

Expected result:

- the project name is appended to the activity state
- the update still does not reveal filenames or prompt content

If the project name does not appear:

- make sure both variables changed together
- restart the helper after editing `.env`
- trigger fresh activity so a new presence payload is published

---

## Phase 6: Verify restart and resilience behavior

The helper is designed to cope with common local interruptions.

### 6.1 Discord restart test

1. keep the helper running
2. close Discord Desktop
3. wait a few seconds
4. reopen Discord Desktop
5. trigger a new Pi action

Expected result:

- the helper remains running
- Discord activity begins updating again after Discord comes back

### 6.2 Helper restart test

1. stop the helper process or stop the service
2. start it again
3. trigger a fresh Pi action

Expected result:

- the helper starts cleanly
- the `/presence` endpoint works again
- Discord updates resume

### 6.3 Service restart test

If you installed a background service:

macOS:

```bash
launchctl kickstart -k "gui/$(id -u)/pi.discord.activity"
```

Linux:

```bash
systemctl --user restart pi-discord-activity.service
```

Windows (NSSM):

```powershell
nssm restart PiDiscordActivity
```

Expected result:

- the service returns to running state
- logs show a clean restart

---

## Troubleshooting checklist

### The helper endpoint returns 400

Your JSON payload is invalid. Compare it with the example payload in Phase 2 and make sure:

- `app` is `pi-coding-agent`
- `startedAt` is a positive integer
- `privacyMode` is a boolean, not a string

### The helper starts but Discord never updates

Check:

- Discord Desktop is running
- the client ID is correct if you overrode the default
- the helper can receive a `204` response from the manual `curl` test
- Pi is actually publishing events through the installed extension

### The extension installed, but no activity changes show up

Check:

- you used `pi install .` from this repo root
- you restarted Pi after installation if your setup requires it
- you triggered real activity such as a new session or tool run
- helper debug logging is enabled so you can see whether updates are arriving

### Provider icon is blank

That usually means the provider asset is missing from your custom Discord application. Upload an asset whose key matches the normalized provider name.

### Project name is visible when it should be hidden

Reset to:

```dotenv
PI_PRESENCE_PRIVACY_MODE=true
PI_PRESENCE_INCLUDE_PROJECT=false
```

Restart the helper.

---

## Final acceptance checklist

Use this as the final pass/fail list.

- [ ] `npm run build` succeeds
- [ ] `npm test` succeeds
- [ ] `pi install .` succeeds
- [ ] helper starts successfully
- [ ] POST to `/presence` returns `204`
- [ ] Discord desktop shows `Using Pi Coding Agent`
- [ ] activity states move through starting / thinking / running tools / editing files / idle
- [ ] project name is hidden by default
- [ ] project name appears only when both privacy overrides are enabled
- [ ] helper continues working after restart tests

If every item above is checked, the Phase 3 install and verification experience is working as intended.
