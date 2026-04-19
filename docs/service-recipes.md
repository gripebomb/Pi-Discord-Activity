# Service recipes for the pi-discord-presence helper

This document shows how to run the helper as a background service so Discord Rich Presence keeps working without leaving a dev terminal open.

The helper entrypoint is:

```text
dist/cli/run-helper.js
```

The helper reads configuration from shell environment variables and from `.env` / `.env.local` in the project root. The easiest pattern is:

1. build the project
2. create `.env` in the repo root
3. point the service's working directory at the repo root
4. let the helper read `.env` automatically when the service starts

If you have not created `.env` yet, run:

```bash
./setup.sh
# or on Windows
pwsh ./setup.ps1
```

## Prerequisites

Before creating a service, make sure these steps already work manually:

```bash
npm install
npm run build
npm start
```

If the helper does not run successfully in a foreground terminal first, fix that before you move to background-service setup.

Recommended `.env` values:

```dotenv
DISCORD_RPC_CLIENT_ID=1495329514417426522
PI_PRESENCE_HOST=127.0.0.1
PI_PRESENCE_PORT=42666
PI_PRESENCE_PRIVACY_MODE=true
PI_PRESENCE_INCLUDE_PROJECT=false
PI_PRESENCE_DEBOUNCE_MS=2000
PI_PRESENCE_DEBUG=false
```

## Paths you must replace

In every recipe below, replace these placeholders with your own values:

- `/absolute/path/to/pi-discord-presence`
- the full path to your Node.js binary if your system does not already have a stable one

You can find your Node path with:

```bash
which node
```

On Windows PowerShell:

```powershell
(Get-Command node).Source
```

## macOS: launchd user service

This is the best default for macOS because it starts in your user session and does not require admin privileges.

### Create the plist

```bash
mkdir -p ~/Library/LaunchAgents
cat > ~/Library/LaunchAgents/pi.discord.presence.plist <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>pi.discord.presence</string>

  <key>ProgramArguments</key>
  <array>
    <string>/absolute/path/to/node</string>
    <string>/absolute/path/to/pi-discord-presence/dist/cli/run-helper.js</string>
  </array>

  <key>WorkingDirectory</key>
  <string>/absolute/path/to/pi-discord-presence</string>

  <key>RunAtLoad</key>
  <true/>

  <key>KeepAlive</key>
  <true/>

  <key>StandardOutPath</key>
  <string>/tmp/pi-discord-presence.log</string>

  <key>StandardErrorPath</key>
  <string>/tmp/pi-discord-presence-error.log</string>
</dict>
</plist>
EOF
```

Because `WorkingDirectory` points at the repo root, the helper can read `.env` automatically.

### Load and start the service

```bash
launchctl bootstrap "gui/$(id -u)" ~/Library/LaunchAgents/pi.discord.presence.plist
launchctl enable "gui/$(id -u)/pi.discord.presence"
launchctl kickstart -k "gui/$(id -u)/pi.discord.presence"
```

If the service was already loaded and you changed the plist, reload it:

```bash
launchctl bootout "gui/$(id -u)" ~/Library/LaunchAgents/pi.discord.presence.plist 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" ~/Library/LaunchAgents/pi.discord.presence.plist
launchctl kickstart -k "gui/$(id -u)/pi.discord.presence"
```

### Check status and logs

```bash
launchctl print "gui/$(id -u)/pi.discord.presence"
tail -f /tmp/pi-discord-presence.log
```

### Stop and remove the service

```bash
launchctl bootout "gui/$(id -u)" ~/Library/LaunchAgents/pi.discord.presence.plist
rm ~/Library/LaunchAgents/pi.discord.presence.plist
```

## Linux: systemd user service

This is the recommended Linux path because it runs in the current user account and avoids system-wide service permissions.

### Create the unit file

```bash
mkdir -p ~/.config/systemd/user
cat > ~/.config/systemd/user/pi-discord-presence.service <<'EOF'
[Unit]
Description=Pi Discord Presence Helper
After=network.target

[Service]
Type=simple
WorkingDirectory=/absolute/path/to/pi-discord-presence
ExecStart=/absolute/path/to/node /absolute/path/to/pi-discord-presence/dist/cli/run-helper.js
Restart=always
RestartSec=5
StandardOutput=append:/tmp/pi-discord-presence.log
StandardError=append:/tmp/pi-discord-presence-error.log

[Install]
WantedBy=default.target
EOF
```

Again, the working directory is important because the helper will look for `.env` in the package root.

### Load and start the service

```bash
systemctl --user daemon-reload
systemctl --user enable --now pi-discord-presence.service
```

### Check status and logs

```bash
systemctl --user status pi-discord-presence.service
journalctl --user -u pi-discord-presence.service -f
```

If you prefer plain files over journald, also inspect:

```bash
tail -f /tmp/pi-discord-presence.log
```

### Stop and remove the service

```bash
systemctl --user disable --now pi-discord-presence.service
rm ~/.config/systemd/user/pi-discord-presence.service
systemctl --user daemon-reload
```

### Optional: keep user services alive after logout

If you want the helper to keep running even after you log out, enable linger for your user:

```bash
loginctl enable-linger "$USER"
```

Use that only if you understand the trade-off: it keeps user services eligible to run when you are not actively logged into a graphical session.

## Windows: NSSM service recipe

Windows does not have an exact equivalent to `launchd` or `systemd --user` that is as convenient for this workflow. A practical approach is to use **NSSM** (the Non-Sucking Service Manager) to wrap the helper process.

If you prefer not to install NSSM, you can also use Task Scheduler to launch the helper at login. NSSM is documented here because it gives simple start/stop/restart behavior.

### Install NSSM

```powershell
winget install NSSM
```

Or download it from <https://nssm.cc>.

### Create the service

```powershell
$ProjectRoot = 'C:\absolute\path\to\pi-discord-presence'
$NodePath = (Get-Command node).Source
$HelperPath = Join-Path $ProjectRoot 'dist\cli\run-helper.js'
$ServiceName = 'PiDiscordPresence'

nssm install $ServiceName $NodePath $HelperPath
nssm set $ServiceName AppDirectory $ProjectRoot
nssm set $ServiceName AppStdout "$env:TEMP\pi-discord-presence.log"
nssm set $ServiceName AppStderr "$env:TEMP\pi-discord-presence-error.log"
nssm set $ServiceName AppRestartDelay 5000
nssm start $ServiceName
```

With `AppDirectory` set to the repo root, the helper can read `.env` automatically.

### Check status and logs

```powershell
nssm status PiDiscordPresence
Get-Content "$env:TEMP\pi-discord-presence.log" -Wait
```

### Stop and remove the service

```powershell
nssm stop PiDiscordPresence
nssm remove PiDiscordPresence confirm
```

## Verification after service setup

After you create a service on any OS:

1. confirm the service process is running
2. confirm Discord desktop is open
3. start Pi and trigger a session, model change, or tool call
4. watch Discord for the activity update
5. inspect the service logs if the activity does not appear

You can also run the automated checks:

```bash
./scripts/verify-installation.sh
```

Or on Windows:

```powershell
pwsh ./scripts/verify-installation.ps1
```

## Troubleshooting

### Service starts, but Discord still shows nothing

Check these first:

- Discord desktop app is open
- `.env` contains the client ID you expect
- the project was built and `dist/cli/run-helper.js` exists
- the service's working directory is the repo root

### Service fails immediately

Most failures come from one of these:

- wrong path to `node`
- wrong path to `dist/cli/run-helper.js`
- project not built yet
- stale service file still pointing at an old repo path

### Service runs but uses old configuration

Restart the service after changing `.env`.

### Linux service does not start automatically on login

Make sure you enabled it with:

```bash
systemctl --user enable --now pi-discord-presence.service
```

If you need it to survive logout, also consider `loginctl enable-linger "$USER"`.

### macOS service loads but the label is missing

Use the exact same label in all commands:

- `pi.discord.presence`

Mismatch between the plist label and your `launchctl` command is a common cause of confusion.

## Which recipe should you choose?

- **macOS:** `launchd` user service
- **Linux:** `systemd --user` service
- **Windows:** NSSM if you want a service wrapper; otherwise use Task Scheduler as a simpler login-time launcher

If you only want to prove the integration works, start with `npm start`. Move to a service only after the foreground path is already verified.
