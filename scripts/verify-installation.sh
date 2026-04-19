#!/usr/bin/env bash

set -uo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMP_PORT="${PI_PRESENCE_VERIFY_PORT:-42667}"
EXERCISE_PI_INSTALL=false
STARTED_HELPER=false
HELPER_PID=""
LOG_FILE="${TMPDIR:-/tmp}/pi-discord-activity-verify.log"
TOTAL=0
PASSED=0
FAILED=0
SKIPPED=0

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

usage() {
  cat <<'EOF'
Usage: ./scripts/verify-installation.sh [options]

Options:
  --exercise-pi-install   Run `pi install .` as part of verification
  --help                  Show this help message
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --exercise-pi-install)
      EXERCISE_PI_INSTALL=true
      shift
      ;;
    --help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

banner() {
  printf "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
  printf " GSD ► PI-DISCORD-ACTIVITY VERIFICATION\n"
  printf "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
}

pass() {
  PASSED=$((PASSED + 1))
  printf "  %b✓ PASS%b %s\n" "$GREEN" "$NC" "$1"
}

fail() {
  FAILED=$((FAILED + 1))
  printf "  %b✗ FAIL%b %s\n" "$RED" "$NC" "$1"
}

skip() {
  SKIPPED=$((SKIPPED + 1))
  printf "  %b⚠ SKIP%b %s\n" "$YELLOW" "$NC" "$1"
}

run_check() {
  local name="$1"
  shift
  TOTAL=$((TOTAL + 1))
  printf "%bTesting:%b %s\n" "$BLUE" "$NC" "$name"
  if "$@"; then
    pass "$name"
  else
    fail "$name"
  fi
  printf "\n"
}

run_optional() {
  local name="$1"
  shift
  TOTAL=$((TOTAL + 1))
  printf "%bTesting:%b %s\n" "$BLUE" "$NC" "$name"
  if "$@"; then
    pass "$name"
  else
    skip "$name"
  fi
  printf "\n"
}

cleanup() {
  if [[ "$STARTED_HELPER" == true && -n "$HELPER_PID" ]]; then
    kill "$HELPER_PID" >/dev/null 2>&1 || true
    wait "$HELPER_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

file_exists() {
  [[ -f "$1" ]]
}

dir_exists() {
  [[ -d "$1" ]]
}

package_has_pi_extension() {
  node -e "const pkg=require('./package.json'); process.exit(pkg.pi && Array.isArray(pkg.pi.extensions) && pkg.pi.extensions.includes('./src/extension/index.ts') ? 0 : 1)"
}

package_has_keyword() {
  node -e "const pkg=require('./package.json'); process.exit(Array.isArray(pkg.keywords) && pkg.keywords.includes('pi-package') ? 0 : 1)"
}

build_project() {
  npm run build >/dev/null
}

test_project() {
  npm test >/dev/null
}

pack_dry_run() {
  npm pack --dry-run >/dev/null
}

pi_available() {
  command -v pi >/dev/null 2>&1
}

exercise_pi_install() {
  pi install . >/dev/null
}

pi_version() {
  pi --version >/dev/null
}

start_temp_helper() {
  if command -v lsof >/dev/null 2>&1 && lsof -iTCP:"$TEMP_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
    return 0
  fi

  PI_PRESENCE_PORT="$TEMP_PORT" PI_PRESENCE_DEBUG=true node dist/cli/run-helper.js >"$LOG_FILE" 2>&1 &
  HELPER_PID=$!
  STARTED_HELPER=true

  for _ in {1..20}; do
    if command -v lsof >/dev/null 2>&1; then
      if lsof -iTCP:"$TEMP_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
        return 0
      fi
    else
      sleep 0.25
      if curl -s -o /dev/null "http://127.0.0.1:${TEMP_PORT}/not-found"; then
        return 0
      fi
    fi
    sleep 0.25
  done

  return 1
}

post_presence_payload() {
  local response
  response="$(curl -s -o /dev/null -w '%{http_code}' -X POST "http://127.0.0.1:${TEMP_PORT}/presence" \
    -H 'Content-Type: application/json' \
    -d '{"app":"pi-coding-agent","provider":"openai","model":"gpt-4.1","state":"thinking","projectName":"verify-script","startedAt":1735689600,"sessionId":"verify-script","privacyMode":true}')"
  [[ "$response" == "204" ]]
}

banner
cd "$PROJECT_DIR"
printf "Project directory: %s\n\n" "$PROJECT_DIR"

run_check "package.json exists" file_exists "$PROJECT_DIR/package.json"
run_check "INSTALL.md exists" file_exists "$PROJECT_DIR/INSTALL.md"
run_check "docs directory exists" dir_exists "$PROJECT_DIR/docs"
run_check "discord setup guide exists" file_exists "$PROJECT_DIR/docs/discord-setup.md"
run_check "service recipes guide exists" file_exists "$PROJECT_DIR/docs/service-recipes.md"
run_check "verification guide exists" file_exists "$PROJECT_DIR/docs/verification.md"
run_check "setup.sh exists" file_exists "$PROJECT_DIR/setup.sh"
run_check "setup.ps1 exists" file_exists "$PROJECT_DIR/setup.ps1"
run_check "package.json exposes pi extension metadata" package_has_pi_extension
run_check "package.json includes pi-package keyword" package_has_keyword
run_check "project builds cleanly" build_project
run_check "built helper exists" file_exists "$PROJECT_DIR/dist/cli/run-helper.js"
run_check "built extension exists" file_exists "$PROJECT_DIR/dist/extension/index.js"
run_check "tests pass" test_project
run_check "npm pack --dry-run succeeds" pack_dry_run
run_check "temporary helper starts" start_temp_helper
run_check "helper accepts presence payloads" post_presence_payload

if pi_available; then
  if [[ "$EXERCISE_PI_INSTALL" == true ]]; then
    run_check "pi install . succeeds" exercise_pi_install
  else
    run_optional "pi command available" pi_version
  fi
else
  TOTAL=$((TOTAL + 1))
  printf "%bTesting:%b %s\n" "$BLUE" "$NC" "pi command available"
  skip "pi command available"
  printf "\n"
fi

printf "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
printf " GSD ► VERIFICATION RESULTS\n"
printf "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"

printf "Total tests: %s\n" "$TOTAL"
printf "Passed: %b%s%b\n" "$GREEN" "$PASSED" "$NC"
printf "Failed: %b%s%b\n" "$RED" "$FAILED" "$NC"
printf "Skipped: %b%s%b\n\n" "$YELLOW" "$SKIPPED" "$NC"

if [[ "$FAILED" -eq 0 ]]; then
  printf "%b✓ Verification checks passed%b\n" "$GREEN" "$NC"
  printf "Manual Discord validation is still recommended via docs/verification.md\n"
  exit 0
fi

printf "%b✗ Verification failed%b\n" "$RED" "$NC"
printf "Review docs/verification.md and the helper log at %s\n" "$LOG_FILE"
exit 1
