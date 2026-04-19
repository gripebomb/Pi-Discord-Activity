#!/usr/bin/env pwsh

param(
    [switch]$ExercisePiInstall
)

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$TempPort = if ($env:PI_PRESENCE_VERIFY_PORT) { [int]$env:PI_PRESENCE_VERIFY_PORT } else { 42667 }
$LogFile = Join-Path $env:TEMP 'pi-discord-presence-verify.log'
$HelperProcess = $null
$Total = 0
$Passed = 0
$Failed = 0
$Skipped = 0

function Write-Banner {
    Write-Host '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' -ForegroundColor Cyan
    Write-Host ' GSD ► PI-DISCORD-PRESENCE WINDOWS VERIFICATION' -ForegroundColor Cyan
    Write-Host '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' -ForegroundColor Cyan
}

function Pass-Test([string]$Name) {
    $script:Passed++
    Write-Host "  ✓ PASS $Name" -ForegroundColor Green
}

function Fail-Test([string]$Name) {
    $script:Failed++
    Write-Host "  ✗ FAIL $Name" -ForegroundColor Red
}

function Skip-Test([string]$Name) {
    $script:Skipped++
    Write-Host "  ⚠ SKIP $Name" -ForegroundColor Yellow
}

function Run-Check([string]$Name, [scriptblock]$Action) {
    $script:Total++
    Write-Host "Testing: $Name" -ForegroundColor Blue
    try {
        & $Action
        Pass-Test $Name
    } catch {
        Fail-Test $Name
    }
    Write-Host ''
}

function Run-Optional([string]$Name, [scriptblock]$Action) {
    $script:Total++
    Write-Host "Testing: $Name" -ForegroundColor Blue
    try {
        & $Action
        Pass-Test $Name
    } catch {
        Skip-Test $Name
    }
    Write-Host ''
}

function Assert-True([bool]$Value, [string]$Message) {
    if (-not $Value) {
        throw $Message
    }
}

function Start-TemporaryHelper {
    $env:PI_PRESENCE_PORT = $TempPort
    $env:PI_PRESENCE_DEBUG = 'true'
    $script:HelperProcess = Start-Process -FilePath node -ArgumentList 'dist/cli/run-helper.js' -WorkingDirectory $ProjectRoot -RedirectStandardOutput $LogFile -RedirectStandardError $LogFile -PassThru

    for ($i = 0; $i -lt 20; $i++) {
        Start-Sleep -Milliseconds 250
        try {
            $response = Invoke-WebRequest -Uri "http://127.0.0.1:$TempPort/not-found" -UseBasicParsing -ErrorAction SilentlyContinue
            if ($response -or $LASTEXITCODE -eq 0) {
                return
            }
        } catch {
            if ($_.Exception.Response.StatusCode.value__ -eq 404) {
                return
            }
        }
    }

    throw 'Helper did not start listening in time'
}

function Stop-TemporaryHelper {
    if ($script:HelperProcess -and -not $script:HelperProcess.HasExited) {
        Stop-Process -Id $script:HelperProcess.Id -Force
    }
}

try {
    Write-Banner
    Set-Location $ProjectRoot
    Write-Host "Project directory: $ProjectRoot" -ForegroundColor DarkCyan
    Write-Host ''

    Run-Check 'package.json exists' { Assert-True (Test-Path "$ProjectRoot/package.json" -PathType Leaf) 'missing package.json' }
    Run-Check 'INSTALL.md exists' { Assert-True (Test-Path "$ProjectRoot/INSTALL.md" -PathType Leaf) 'missing INSTALL.md' }
    Run-Check 'docs/discord-setup.md exists' { Assert-True (Test-Path "$ProjectRoot/docs/discord-setup.md" -PathType Leaf) 'missing docs/discord-setup.md' }
    Run-Check 'docs/service-recipes.md exists' { Assert-True (Test-Path "$ProjectRoot/docs/service-recipes.md" -PathType Leaf) 'missing docs/service-recipes.md' }
    Run-Check 'docs/verification.md exists' { Assert-True (Test-Path "$ProjectRoot/docs/verification.md" -PathType Leaf) 'missing docs/verification.md' }
    Run-Check 'setup.ps1 exists' { Assert-True (Test-Path "$ProjectRoot/setup.ps1" -PathType Leaf) 'missing setup.ps1' }
    Run-Check 'setup.sh exists' { Assert-True (Test-Path "$ProjectRoot/setup.sh" -PathType Leaf) 'missing setup.sh' }
    Run-Check 'package metadata contains pi.extensions' {
        $pkg = Get-Content "$ProjectRoot/package.json" -Raw | ConvertFrom-Json
        Assert-True ($pkg.pi.extensions -contains './src/extension/index.ts') 'missing pi.extensions entry'
    }
    Run-Check 'package metadata contains pi-package keyword' {
        $pkg = Get-Content "$ProjectRoot/package.json" -Raw | ConvertFrom-Json
        Assert-True ($pkg.keywords -contains 'pi-package') 'missing pi-package keyword'
    }
    Run-Check 'project builds cleanly' {
        npm run build | Out-Null
        Assert-True ($LASTEXITCODE -eq 0) 'npm run build failed'
    }
    Run-Check 'built helper exists' { Assert-True (Test-Path "$ProjectRoot/dist/cli/run-helper.js" -PathType Leaf) 'missing built helper' }
    Run-Check 'built extension exists' { Assert-True (Test-Path "$ProjectRoot/dist/extension/index.js" -PathType Leaf) 'missing built extension' }
    Run-Check 'tests pass' {
        npm test | Out-Null
        Assert-True ($LASTEXITCODE -eq 0) 'npm test failed'
    }
    Run-Check 'npm pack --dry-run succeeds' {
        npm pack --dry-run | Out-Null
        Assert-True ($LASTEXITCODE -eq 0) 'npm pack --dry-run failed'
    }
    Run-Check 'temporary helper starts' { Start-TemporaryHelper }
    Run-Check 'helper accepts presence payloads' {
        $payload = @{
            app = 'pi-coding-agent'
            provider = 'openai'
            model = 'gpt-4.1'
            state = 'thinking'
            projectName = 'verify-script'
            startedAt = 1735689600
            sessionId = 'verify-script'
            privacyMode = $true
        } | ConvertTo-Json -Compress

        $response = Invoke-WebRequest -Uri "http://127.0.0.1:$TempPort/presence" -Method Post -ContentType 'application/json' -Body $payload -UseBasicParsing
        Assert-True ($response.StatusCode -eq 204) 'presence endpoint did not return 204'
    }

    if (Get-Command pi -ErrorAction SilentlyContinue) {
        if ($ExercisePiInstall) {
            Run-Check 'pi install . succeeds' {
                pi install . | Out-Null
                Assert-True ($LASTEXITCODE -eq 0) 'pi install . failed'
            }
        } else {
            Run-Optional 'pi command available' {
                pi --version | Out-Null
                Assert-True ($LASTEXITCODE -eq 0) 'pi --version failed'
            }
        }
    } else {
        $Total++
        Write-Host 'Testing: pi command available' -ForegroundColor Blue
        Skip-Test 'pi command available'
        Write-Host ''
    }

    Write-Host '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' -ForegroundColor Cyan
    Write-Host ' GSD ► VERIFICATION RESULTS' -ForegroundColor Cyan
    Write-Host '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' -ForegroundColor Cyan
    Write-Host "Total tests: $Total"
    Write-Host "Passed: $Passed" -ForegroundColor Green
    Write-Host "Failed: $Failed" -ForegroundColor Red
    Write-Host "Skipped: $Skipped" -ForegroundColor Yellow
    Write-Host ''

    if ($Failed -eq 0) {
        Write-Host '✓ Verification checks passed' -ForegroundColor Green
        Write-Host 'Manual Discord validation is still recommended via docs/verification.md'
        exit 0
    }

    Write-Host '✗ Verification failed' -ForegroundColor Red
    Write-Host "Review docs/verification.md and the helper log at $LogFile"
    exit 1
}
finally {
    Stop-TemporaryHelper
}
