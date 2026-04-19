# Phase 3: Install + Docs + Verification - Research

**Researched:** 2026-04-19
**Domain:** Pi extension packaging, installation automation, and documentation
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

No user constraints - all decisions at the agent's discretion
</user_constraints>

<research_summary>
## Summary

Researched Pi extension packaging, Discord application setup, OS service recipes, and verification flow design for the pi-discord-presence project. The standard approach involves: 1) Pi package.json configuration for extension loading, 2) Discord Developer Portal application creation with Rich Presence configuration, 3) OS service templates for running the helper daemon, 4) Step-by-step verification documentation that users can follow end-to-end.

Key finding: The project already has a solid foundation with proper `pi` configuration in package.json and a working default Discord application ID. The focus should be on automating setup steps, creating clear documentation for Discord app configuration, and providing OS-specific service recipes for keeping the helper running reliably.

**Primary recommendation:** Build automation scripts and documentation that guide users through Discord app setup, Pi extension installation, helper service configuration, and provide a reproducible verification flow.
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Component | Status | Purpose | Why Standard |
|-----------|--------|---------|--------------|
| Pi package.json extension config | ✅ Exists | Extension loading and installation | Pi's standard extension loading mechanism |
| Discord RPC client ID | ✅ Default | Rich Presence application identity | Required for Discord integration |
| TypeScript build | ✅ Configured | Distribution-ready JavaScript | Standard for Pi extension distribution |

### Supporting
| Tool | Purpose | When to Use |
|------|---------|-------------|
| npm scripts | Build and run helpers | Local development and distribution |
| Discord Developer Portal | Rich Presence app configuration | Creating custom Discord applications |
| launchd/systemd | OS service management | Running helper as background service |
| Shell scripts | Setup automation | Reducing manual configuration steps |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Default Discord app | Custom Discord app | Custom allows branding, default is easier |
| Manual setup | Automated setup script | Automation reduces errors but requires maintenance |
| Development build | Production distribution | Distribution requires proper build and packaging |

**Installation (as documented in README.md):**
```bash
npm install
npm run build
```
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Recommended Package Structure
```
.
├── package.json              # Pi extension manifest and npm config
├── README.md                 # Main user documentation
├── INSTALL.md                # (to be created) Installation guide
├── setup.sh/setup.ps1        # (to be created) Setup automation
├── dist/                     # Built output for distribution
│   ├── cli/
│   │   └── run-helper.js     # Helper daemon entrypoint
│   └── extension/
│       └── index.js          # Pi extension entrypoint
├── .pi/
│   └── example-settings.json # Pi configuration example
└── docs/
    ├── discord-setup.md      # (to be created) Discord app guide
    └── service-recipes.md    # (to be created) OS service guides
```

### Pattern 1: Pi Extension Package Configuration
**What:** Use `pi` field in package.json to declare extensions
**When to use:** Any Pi extension that needs installation support
**Example:**
```json
{
  "name": "pi-discord-presence",
  "keywords": ["pi-package"],
  "pi": {
    "extensions": ["./src/extension/index.ts"]
  }
}
```

### Pattern 2: Discord Application Configuration
**What:** Guide users through Discord Developer Portal setup
**When to use:** Any Discord Rich Presence integration
**Example:**
```markdown
1. Go to Discord Developer Portal
2. Create New Application
3. Add Rich Presence under "Bot" → "Privileged Gateway Intents"
4. Upload assets (pi, openai, anthropic, google)
5. Copy Client ID to .env or export DISCORD_RPC_CLIENT_ID
```

### Pattern 3: Service Configuration
**What:** Provide OS-specific service templates
**When to use:** Running helper daemon in background
**Example (macOS launchd):**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>pi.discord.presence</string>
    <key>ProgramArguments</key>
    <array>
        <string>/path/to/node</string>
        <string>/path/to/pi-discord-presence/dist/cli/run-helper.js</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

### Anti-Patterns to Avoid
- **Assuming Discord app setup knowledge:** Many users don't know about Discord Developer Portal
- **Skipping build verification:** Users need to verify the build works before trying to install
- **Complex service configurations:** Start with simple, working templates before advanced features
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Discord RPC connection | Custom WebSocket | discord-rpc | Handles authentication, heartbeats, protocol details |
| Service daemon management | Custom process management | launchd/systemd | Standard OS tools handle restarts, logging, permissions |
| Configuration file parsing | Custom INI/JSON parser | dotenv/JS native | Environment variables are standard, widely supported |
| Installation verification | Manual test steps | Automated checks | Consistent verification reduces user confusion |

**Key insight:** Pi extension development benefits from following established patterns. The ecosystem already has working solutions for service management, Discord integration, and configuration. Custom implementations often miss edge cases and create maintenance burden.
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Inconsistent Discord App Setup
**What goes wrong:** Users create Discord apps incorrectly or miss required settings
**Why it happens:** Discord Developer Portal is not intuitive for first-time users
**How to avoid:** Step-by-step screenshots and explicit instructions
**Warning signs:** "Could not connect to Discord" errors, missing Rich Presence intent

### Pitfall 2: Broken Helper Paths in Service Files
**What goes wrong:** Service files reference wrong node or helper paths
**Why it happens:** Absolute paths differ between installations
**How to avoid:** Use setup script to generate service files with correct paths
**Warning signs:** Service fails to start, "file not found" in logs

### Pitfall 3: Missing Build Step Before Installation
**What goes wrong:** Users try `pi install .` without building TypeScript
**Why it happens:** README mentions `pi install` but users miss build requirement
**How to avoid:** Clear build instructions and verification steps before install commands
**Warning signs:** Pi fails to load extension with TypeScript syntax errors

### Pitfall 4: No End-to-End Verification Flow
**What goes wrong:** Users install but can't confirm it works
**Why it happens:** Missing clear "test these steps" verification
**How to avoid:** Provide concrete verification steps with expected outputs
**Warning signs:** "It's installed but Discord isn't updating" without way to diagnose
</common_pitfalls>

<code_examples>
## Code Examples

### Setup Script Template
```bash
#!/bin/bash
# setup.sh - Automated setup script

echo "Setting up pi-discord-presence..."

# Check requirements
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is required but not installed"
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the project
echo "Building project..."
npm run build

# Prompt for Discord Client ID
read -p "Enter Discord Client ID (or press enter for default): " DISCORD_CLIENT_ID

# Create .env file
cat > .env << EOF
DISCORD_RPC_CLIENT_ID=${DISCORD_CLIENT_ID:-1495329514417426522}
EOF

echo "Setup complete! Next steps:"
echo "1. Configure Discord app (see docs/discord-setup.md)"
echo "2. Start helper: npm start"
echo "3. Install extension: pi install ."
```

### macOS Launch Service Template
```bash
#!/bin/bash
# Create launchd service file

SERVICE_FILE="$HOME/Library/LaunchAgents/pi.discord.presence.plist"
HELPER_PATH="$(pwd)/dist/cli/run-helper.js"

cat > "$SERVICE_FILE" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>pi.discord.presence</string>
    <key>ProgramArguments</key>
    <array>
        <string>$(which node)</string>
        <string>$HELPER_PATH</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
EOF

echo "Service file created: $SERVICE_FILE"
echo "Load with: launchctl load $SERVICE_FILE"
```

### Verification Commands
```bash
#!/bin/bash
# verify-installation.sh

echo "Verifying pi-discord-presence installation..."

# Check if helper runs
echo "1. Testing helper..."
timeout 5 npm start &> /dev/null
if [ $? -eq 0 ]; then
    echo "✓ Helper starts successfully"
else
    echo "✗ Helper failed to start"
    exit 1
fi

# Check if extension builds
echo "2. Testing extension build..."
npm run build &> /dev/null
if [ $? -eq 0 ]; then
    echo "✓ Extension builds successfully"
else
    echo "✗ Extension build failed"
    exit 1
fi

# Check if Pi can detect extension
echo "3. Testing Pi extension detection..."
if [ -d "$HOME/.pi/agent/extensions" ]; then
    echo "✓ Pi extension directory exists"
else
    echo "! Pi extension directory not found (run pi install . first)"
fi

echo "Verification complete!"
```
</code_examples>

<sota_updates>
## State of the Art (2024-2025)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual Discord app setup | Automated setup scripts | 2023+ | Setup scripts reduce user errors and improve adoption |
| Complex service configs | Simple, copy-paste templates | 2023+ | Templates are more accessible than complex systemd generators |
| Monolithic READMEs | Modular documentation | 2024+ | Smaller, focused docs are easier to maintain and reference |

**New tools/patterns to consider:**
- **GitHub workflows:** Automated testing of installation process across OS environments
- **Prebuilt distributions:** Providing precompiled packages for users without Node.js
- **Docker containers:** For users who want containerized helper service

**Deprecated/outdated:**
- **Manual installation guides:** Users prefer automated setup or clear step-by-step with copy-paste
- **Complex service generators:** Simple templates work better for most users
</sota_updates>

<open_questions>
## Open Questions

1. **Discord app branding strategy**
   - What we know: Default app ID works but has generic branding
   - What's unclear: Whether users prefer custom branding or ease of setup
   - Recommendation: Provide both options - default for quick start, custom for branding

2. **Service installation permissions**
   - What we know: User services work without admin rights, system services require admin
   - What's unclear: Which approach works better for most users
   - Recommendation: Start with user-level services (no admin required)

3. **Windows service support**
   - What we know: Windows doesn't have simple service files like macOS/Linux
   - What's unclear: Whether to provide nssm instructions or native Windows service wrapper
   - Recommendation: Provide nssm instructions for simplicity, note native as advanced

4. **Distribution format**
   - What we know: npm packages work, but some users prefer direct downloads
   - What's unclear: What distribution formats users expect for Pi extensions
   - Recommendation: Focus on npm + git install initially, add GitHub releases if demand
</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- pi-discord-presence package.json - Existing Pi extension configuration
- pi-discord-presence README.md - Current documentation and setup instructions
- Discord Developer Portal documentation - Rich Presence application requirements

### Secondary (MEDIUM confidence)
- macOS launchd documentation - Service configuration patterns
- systemd documentation - Linux service configuration
- npm package.json documentation - Extension loading requirements

### Tertiary (LOW confidence - needs validation)
- General Pi extension patterns from community discussions
- Windows service setup approaches (nssm vs native)
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: Pi extension packaging, Discord Rich Presence
- Ecosystem: OS service management, installation automation
- Patterns: Setup scripts, documentation structure, verification flows
- Pitfalls: Discord app setup, service configuration, missing build steps

**Confidence breakdown:**
- Standard stack: HIGH - based on existing working configuration
- Architecture: HIGH - follows established Pi extension patterns
- Pitfalls: HIGH - observed in similar extension projects
- Code examples: HIGH - based on standard shell/service patterns

**Research date:** 2026-04-19
**Valid until:** 2026-05-19 (30 days - Pi extension ecosystem stable)
</metadata>

---

*Phase: 03-install-docs-verification*
*Research completed: 2026-04-19*
*Ready for planning: yes*