#!/usr/bin/env bash

set -euo pipefail

DEFAULT_CLIENT_ID="1495329514417426522"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLIENT_ID="${DISCORD_RPC_CLIENT_ID:-}"
SKIP_INSTALL=false
SKIP_SERVICE=false
NONINTERACTIVE=false

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_banner() {
  printf "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
  printf " GSD ► PI-DISCORD-ACTIVITY SETUP\n"
  printf "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
}

status() {
  printf "%b✓ %s%b\n" "$GREEN" "$1" "$NC"
}

warn() {
  printf "%b⚠ %s%b\n" "$YELLOW" "$1" "$NC"
}

fail() {
  printf "%b✗ %s%b\n" "$RED" "$1" "$NC" >&2
  exit 1
}

info() {
  printf "%b→ %s%b\n" "$BLUE" "$1" "$NC"
}

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

prompt_yes_no() {
  local prompt="$1"
  local default_answer="${2:-y}"
  local reply

  if $NONINTERACTIVE; then
    [[ "$default_answer" == "y" ]]
    return
  fi

  if [[ "$default_answer" == "y" ]]; then
    read -r -p "$prompt [Y/n] " reply
    [[ -z "$reply" || "$reply" =~ ^[Yy]$ ]]
  else
    read -r -p "$prompt [y/N] " reply
    [[ "$reply" =~ ^[Yy]$ ]]
  fi
}

usage() {
  cat <<'EOF'
Usage: ./setup.sh [options]

Options:
  --client-id <id>   Discord application client ID
  --skip-install     Do not run `pi install .`
  --skip-service     Do not create a launchd/systemd service
  --yes              Non-interactive mode
  --help             Show this help message
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --client-id)
      CLIENT_ID="${2:-}"
      [[ -n "$CLIENT_ID" ]] || fail "--client-id requires a value"
      shift 2
      ;;
    --skip-install)
      SKIP_INSTALL=true
      shift
      ;;
    --skip-service)
      SKIP_SERVICE=true
      shift
      ;;
    --yes)
      NONINTERACTIVE=true
      shift
      ;;
    --help)
      usage
      exit 0
      ;;
    *)
      fail "Unknown option: $1"
      ;;
  esac
done

print_banner

cd "$PROJECT_DIR"
info "Project directory: $PROJECT_DIR"

command_exists node || fail "Node.js 20+ is required"
command_exists npm || fail "npm is required"

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[[ "$NODE_MAJOR" -ge 20 ]] || fail "Node.js 20+ is required"
status "Node.js $(node --version) found"
status "npm $(npm --version) found"

if [[ -z "$CLIENT_ID" && "$NONINTERACTIVE" == false ]]; then
  read -r -p "Discord Client ID (press Enter for default ${DEFAULT_CLIENT_ID}): " CLIENT_ID
fi
CLIENT_ID="${CLIENT_ID:-$DEFAULT_CLIENT_ID}"
status "Using Discord Client ID: $CLIENT_ID"

info "Installing dependencies"
npm install
status "Dependencies installed"

info "Building project"
npm run build
status "Build completed"

cat > .env <<EOF
DISCORD_RPC_CLIENT_ID=${CLIENT_ID}
PI_PRESENCE_HOST=127.0.0.1
PI_PRESENCE_PORT=42666
PI_PRESENCE_PRIVACY_MODE=true
PI_PRESENCE_INCLUDE_PROJECT=false
PI_PRESENCE_DEBOUNCE_MS=2000
PI_PRESENCE_DEBUG=false
EOF
status "Wrote .env"

if [[ "$SKIP_INSTALL" == false ]] && command_exists pi; then
  if prompt_yes_no "Install the extension into Pi now?" y; then
    info "Running pi install ."
    pi install .
    status "Pi extension installed"
  else
    warn "Skipped pi install ."
  fi
elif [[ "$SKIP_INSTALL" == false ]]; then
  warn "`pi` command not found; skipped extension installation"
fi

START_HINT="npm start"
STOP_HINT="Ctrl+C"
LOG_HINT="terminal output"

setup_macos_service() {
  local plist="$HOME/Library/LaunchAgents/pi.discord.activity.plist"
  local node_path
  node_path="$(command -v node)"

  mkdir -p "$(dirname "$plist")"
  cat > "$plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>pi.discord.activity</string>
  <key>ProgramArguments</key>
  <array>
    <string>${node_path}</string>
    <string>${PROJECT_DIR}/dist/cli/run-helper.js</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${PROJECT_DIR}</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>/tmp/pi-discord-activity.log</string>
  <key>StandardErrorPath</key>
  <string>/tmp/pi-discord-activity-error.log</string>
</dict>
</plist>
EOF

  launchctl bootout "gui/$(id -u)" "$plist" >/dev/null 2>&1 || true
  launchctl bootstrap "gui/$(id -u)" "$plist"
  launchctl enable "gui/$(id -u)/pi.discord.activity" >/dev/null 2>&1 || true
  launchctl kickstart -k "gui/$(id -u)/pi.discord.activity"

  START_HINT='launchctl kickstart -k "gui/$(id -u)/pi.discord.activity"'
  STOP_HINT='launchctl bootout "gui/$(id -u)" ~/Library/LaunchAgents/pi.discord.activity.plist'
  LOG_HINT='/tmp/pi-discord-activity.log'
  status "Installed macOS launchd service"
}

setup_linux_service() {
  local unit="$HOME/.config/systemd/user/pi-discord-activity.service"
  local node_path
  node_path="$(command -v node)"

  command_exists systemctl || fail "systemctl is required for Linux service setup"

  mkdir -p "$(dirname "$unit")"
  cat > "$unit" <<EOF
[Unit]
Description=Pi Discord Activity Helper
After=network.target

[Service]
Type=simple
WorkingDirectory=${PROJECT_DIR}
ExecStart=${node_path} ${PROJECT_DIR}/dist/cli/run-helper.js
Restart=always
RestartSec=5
StandardOutput=append:/tmp/pi-discord-activity.log
StandardError=append:/tmp/pi-discord-activity-error.log

[Install]
WantedBy=default.target
EOF

  systemctl --user daemon-reload
  systemctl --user enable --now pi-discord-activity.service

  START_HINT='systemctl --user start pi-discord-activity.service'
  STOP_HINT='systemctl --user stop pi-discord-activity.service'
  LOG_HINT='journalctl --user -u pi-discord-activity.service -f'
  status "Installed Linux systemd user service"
}

if [[ "$SKIP_SERVICE" == false ]]; then
  case "$(uname -s)" in
    Darwin)
      if prompt_yes_no "Create or refresh a macOS launchd service?" y; then
        setup_macos_service
      else
        warn "Skipped service setup"
      fi
      ;;
    Linux)
      if prompt_yes_no "Create or refresh a Linux systemd user service?" y; then
        setup_linux_service
      else
        warn "Skipped service setup"
      fi
      ;;
    *)
      warn "Automatic service setup is only implemented for macOS and Linux in setup.sh"
      warn "See docs/service-recipes.md for manual instructions"
      ;;
  esac
fi

printf "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
printf " GSD ► SETUP COMPLETE\n"
printf "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
status "pi-discord-activity setup finished"
printf "Next steps:\n"
printf "1. Start helper: %s\n" "$START_HINT"
printf "2. Stop helper: %s\n" "$STOP_HINT"
printf "3. Logs: %s\n" "$LOG_HINT"
printf "4. Verify install: ./scripts/verify-installation.sh\n"
printf "5. Full docs: INSTALL.md, docs/discord-setup.md, docs/service-recipes.md, docs/verification.md\n"
