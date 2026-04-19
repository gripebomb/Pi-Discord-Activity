#!/usr/bin/env pwsh

param(
    [string]$DiscordClientId,
    [switch]$SkipInstall,
    [switch]$SkipService,
    [switch]$Yes
)

$DefaultClientId = '1495329514417426522'
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ServiceName = 'PiDiscordActivity'
$LogPath = Join-Path $env:TEMP 'pi-discord-activity.log'

function Write-Banner {
    Write-Host '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' -ForegroundColor Cyan
    Write-Host ' GSD ► PI-DISCORD-ACTIVITY WINDOWS SETUP' -ForegroundColor Cyan
    Write-Host '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' -ForegroundColor Cyan
}

function Write-Status([string]$Message) {
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Warn([string]$Message) {
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Write-Fail([string]$Message) {
    Write-Host "✗ $Message" -ForegroundColor Red
    exit 1
}

function Confirm-Step([string]$Prompt, [bool]$Default = $true) {
    if ($Yes) {
        return $Default
    }

    $suffix = if ($Default) { '[Y/n]' } else { '[y/N]' }
    $reply = Read-Host "$Prompt $suffix"

    if ([string]::IsNullOrWhiteSpace($reply)) {
        return $Default
    }

    return $reply -match '^[Yy]'
}

Write-Banner
Set-Location $ProjectRoot
Write-Host "Project directory: $ProjectRoot" -ForegroundColor DarkCyan

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Fail 'Node.js 20+ is required'
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Fail 'npm is required'
}

$nodeVersion = node --version
$major = [int]($nodeVersion.TrimStart('v').Split('.')[0])
if ($major -lt 20) {
    Write-Fail "Node.js 20+ is required. Found $nodeVersion"
}

Write-Status "Node.js $nodeVersion found"
Write-Status "npm $(npm --version) found"

if ([string]::IsNullOrWhiteSpace($DiscordClientId)) {
    if ($Yes) {
        $DiscordClientId = $DefaultClientId
    } else {
        $inputValue = Read-Host "Discord Client ID (press Enter for default $DefaultClientId)"
        if ([string]::IsNullOrWhiteSpace($inputValue)) {
            $DiscordClientId = $DefaultClientId
        } else {
            $DiscordClientId = $inputValue.Trim()
        }
    }
}

Write-Status "Using Discord Client ID: $DiscordClientId"

Write-Host 'Installing dependencies...' -ForegroundColor Blue
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Fail 'npm install failed'
}
Write-Status 'Dependencies installed'

Write-Host 'Building project...' -ForegroundColor Blue
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Fail 'npm run build failed'
}
Write-Status 'Build completed'

@"
DISCORD_RPC_CLIENT_ID=$DiscordClientId
PI_PRESENCE_HOST=127.0.0.1
PI_PRESENCE_PORT=42666
PI_PRESENCE_PRIVACY_MODE=true
PI_PRESENCE_INCLUDE_PROJECT=false
PI_PRESENCE_DEBOUNCE_MS=2000
PI_PRESENCE_DEBUG=false
"@ | Set-Content -Path (Join-Path $ProjectRoot '.env') -Encoding utf8
Write-Status 'Wrote .env'

if (-not $SkipInstall -and (Get-Command pi -ErrorAction SilentlyContinue)) {
    if (Confirm-Step 'Install the extension into Pi now?' $true) {
        pi install .
        if ($LASTEXITCODE -ne 0) {
            Write-Fail 'pi install . failed'
        }
        Write-Status 'Pi extension installed'
    } else {
        Write-Warn 'Skipped pi install .'
    }
} elseif (-not $SkipInstall) {
    Write-Warn '`pi` command not found; skipped extension installation'
}

if (-not $SkipService) {
    $nssm = Get-Command nssm -ErrorAction SilentlyContinue
    if (-not $nssm) {
        Write-Warn 'NSSM was not found. Skipping service setup.'
        Write-Warn 'Install NSSM with `winget install NSSM` and rerun this script if you want a Windows service.'
    } elseif (Confirm-Step 'Create or refresh an NSSM service?' $true) {
        $nodePath = (Get-Command node).Source
        $helperPath = Join-Path $ProjectRoot 'dist\cli\run-helper.js'

        try {
            & nssm stop $ServiceName | Out-Null
        } catch {
        }
        try {
            & nssm remove $ServiceName confirm | Out-Null
        } catch {
        }

        & nssm install $ServiceName $nodePath $helperPath | Out-Null
        & nssm set $ServiceName AppDirectory $ProjectRoot | Out-Null
        & nssm set $ServiceName AppStdout $LogPath | Out-Null
        & nssm set $ServiceName AppStderr (Join-Path $env:TEMP 'pi-discord-activity-error.log') | Out-Null
        & nssm set $ServiceName AppRestartDelay 5000 | Out-Null
        & nssm start $ServiceName | Out-Null

        Write-Status 'Installed Windows NSSM service'
    } else {
        Write-Warn 'Skipped service setup'
    }
}

Write-Host ''
Write-Host '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' -ForegroundColor Cyan
Write-Host ' GSD ► SETUP COMPLETE' -ForegroundColor Cyan
Write-Host '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' -ForegroundColor Cyan
Write-Host ''
Write-Status 'pi-discord-activity setup finished'
Write-Host 'Next steps:' -ForegroundColor White
Write-Host '1. Start helper: npm start' -ForegroundColor White
Write-Host '2. Verify install: pwsh ./scripts/verify-installation.ps1' -ForegroundColor White
Write-Host '3. Review docs: INSTALL.md, docs/discord-setup.md, docs/service-recipes.md, docs/verification.md' -ForegroundColor White
Write-Host "4. Logs: $LogPath" -ForegroundColor White
