# Force UTF-8 output so console renders correctly
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$ErrorActionPreference = "Stop"

$TempDir = Join-Path $env:TEMP "CareerForgesInstall"

# ==========================================
# CareerForges Model Configuration
# ==========================================
$CareerForgesConfigDir  = Join-Path $env:ProgramData "CareerForges"
$CareerForgesConfigFile = Join-Path $CareerForgesConfigDir "config.json"

# ==========================================
# Available Models (no emojis - plain ASCII)
# ==========================================
$AvailableModels = @(
    @{ Id = 1; Model = "llama3.2:1b";     Label = "[Fastest][Recommended]     Llama 3.2 1B"; Size = "1.3 GB"; Description = "Recommended for CareerForges" }
    @{ Id = 2; Model = "gemma3:4b";       Label = "[Fast]        Gemma 3 4B";   Size = "3 GB";   Description = "Lightweight and fast" },
    @{ Id = 3; Model = "qwen3:8b";        Label = "[Recommended] Qwen 3 8B";    Size = "5.2 GB"; Description = "Faster Option" },
    @{ Id = 4; Model = "qwen3.5:latest";  Label = "[Reasoning]   Qwen 3.5";     Size = "6.6 GB"; Description = "Better reasoning" },
    @{ Id = 5; Model = "gemma3:12b";      Label = "[Quality]     Gemma 3 12B";  Size = "8 GB";   Description = "Higher quality responses" },
    @{ Id = 6; Model = "deepseek-r1:8b";  Label = "[Reasoning]   DeepSeek R1 8B"; Size = "5 GB"; Description = "Strong reasoning" },
    @{ Id = 7; Model = "qwen3:14b";       Label = "[Best]        Qwen 3 14B";   Size = "10 GB";  Description = "Best local quality" },
)

# ==========================================
# Helper Functions
# ==========================================

function Write-Info    { param([string]$m) Write-Host $m -ForegroundColor Cyan }
function Write-Success { param([string]$m) Write-Host $m -ForegroundColor Green }
function Write-Warn    { param([string]$m) Write-Host $m -ForegroundColor Yellow }
function Write-Err     { param([string]$m) Write-Host $m -ForegroundColor Red }

function Test-OllamaApi {
    try {
        Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get -TimeoutSec 3 | Out-Null
        return $true
    } catch { return $false }
}

function Wait-ForOllamaApi {
    param([int]$TimeoutSeconds = 300)
    Write-Info "Waiting for Ollama API to become available..."
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    while ($sw.Elapsed.TotalSeconds -lt $TimeoutSeconds) {
        if (Test-OllamaApi) { $sw.Stop(); return $true }
        Start-Sleep -Seconds 1
    }
    return $false
}

function Get-InstalledOllamaModels {
    try {
        $output = ollama list 2>$null
        if (-not $output) { return @() }
        $models = @()
        foreach ($line in $output) {
            if ($line -match "^NAME\s+") { continue }
            $trimmed = $line.Trim()
            if ([string]::IsNullOrWhiteSpace($trimmed)) { continue }
            $name = ($trimmed -split '\s+')[0]
            if (-not [string]::IsNullOrWhiteSpace($name)) { $models += $name }
        }
        return $models | Sort-Object -Unique
    } catch { return @() }
}

# ==========================================
# Model Selection
# Returns a model name string (never $null)
# ==========================================
function Select-CareerForgesModel {

    $installed = Get-InstalledOllamaModels

    # --- If models already on disk, offer to reuse one ---
    if ($installed.Count -gt 0) {
        Write-Host ""
        Write-Host "Installed Models:"
        Write-Host ""
        foreach ($m in $installed) { Write-Host "  [installed] $m" }
        Write-Host ""
        Write-Host "  [1] Use an existing model"
        Write-Host "  [2] Download a preset model"
        Write-Host "  [3] Enter a custom model name"
        Write-Host ""

        do { $choice = Read-Host "Select an option (1-3)" }
        until ($choice -in @("1","2","3"))

        if ($choice -eq "1") {
            Write-Host ""
            for ($i = 0; $i -lt $installed.Count; $i++) {
                Write-Host "  [$($i+1)] $($installed[$i])"
            }
            Write-Host ""
            do {
                $sel = Read-Host "Choose a model (1-$($installed.Count))"
                $idx = $sel -as [int]
                $valid = $idx -and $idx -ge 1 -and $idx -le $installed.Count
            } until ($valid)
            return $installed[$idx - 1]
        }

        if ($choice -eq "3") {
            return Read-CustomModelName
        }

        # Falls through to preset list below
    }

    # --- Preset model list ---
    Write-Host ""
    Write-Host "Available Preset Models"
    Write-Host ""
    Write-Host ("  {0,-4} {1,-30} {2,-8} {3}" -f "No.", "Model", "Size", "Description")
    Write-Host ("  " + ("-" * 70))
    foreach ($m in $AvailableModels) {
        Write-Host ("  [{0}]  {1,-28} {2,-8} {3}" -f $m.Id, $m.Label, $m.Size, $m.Description)
    }
    Write-Host ""
    Write-Host "  [C]  Enter a custom model name (e.g. mistral:7b, phi3:mini)"
    Write-Host ""

    do {
        $choice = Read-Host "Select a model (1-$($AvailableModels.Count) or C)"
        $isCustom  = $choice -match "^[Cc]$"
        $isPreset  = ($choice -as [int]) -and ([int]$choice -ge 1) -and ([int]$choice -le $AvailableModels.Count)
    } until ($isCustom -or $isPreset)

    if ($isCustom) {
        return Read-CustomModelName
    }

    # Lookup by Id - this is the fix for "Property Model cannot be found"
    $selected = $AvailableModels | Where-Object { $_.Id -eq ([int]$choice) }
    return $selected.Model
}

function Read-CustomModelName {
    Write-Host ""
    Write-Host "Enter any model name available on Ollama Hub."
    Write-Host "Examples: mistral:7b  |  phi3:mini  |  llava:13b  |  codellama:7b"
    Write-Host "Browse all models at: https://ollama.com/library"
    Write-Host ""
    do {
        $name = (Read-Host "Custom model name").Trim()
        if ([string]::IsNullOrWhiteSpace($name)) {
            Write-Warn "Model name cannot be empty. Please try again."
        }
    } until (-not [string]::IsNullOrWhiteSpace($name))
    return $name
}

function Save-CareerForgesModelConfig {
    param([Parameter(Mandatory)][string]$Model)
    try {
        New-Item -ItemType Directory -Path $CareerForgesConfigDir -Force | Out-Null
        $config = @{ selectedModel = $Model; configuredAt = (Get-Date).ToString("o") }
        $config | ConvertTo-Json -Depth 5 | Set-Content -Path $CareerForgesConfigFile -Encoding UTF8
        Write-Success "Saved CareerForges model configuration."
        Write-Host "Config: $CareerForgesConfigFile"
    } catch {
        Write-Warn "Unable to save model configuration: $($_.Exception.Message)"
    }
}

# ==========================================
# Main Installer
# ==========================================

if (Test-Path $TempDir) { Remove-Item $TempDir -Recurse -Force -ErrorAction SilentlyContinue }
New-Item -ItemType Directory -Force -Path $TempDir | Out-Null

$CareerForgesInstaller = Join-Path $TempDir "CareerForgesSetup.exe"
$SelectedModel = $null

try {

    Write-Host ""
    Write-Host "===================================="
    Write-Host "      CareerForges Installer"
    Write-Host "===================================="
    Write-Host ""

    # --- Check / Install Ollama ---
    Write-Info "Checking Ollama..."
    $ollamaCmd = Get-Command ollama -ErrorAction SilentlyContinue

    if (-not $ollamaCmd) {
        Write-Warn "Ollama not found. Installing..."
        try {
            Invoke-Expression (Invoke-RestMethod "https://ollama.com/install.ps1")
            Start-Sleep -Seconds 10
            $env:PATH += ";$env:LOCALAPPDATA\Programs\Ollama"
            $ollamaCmd = Get-Command ollama -ErrorAction SilentlyContinue
            if (-not $ollamaCmd) { throw "Ollama installation verification failed." }
            Write-Success "Ollama installed successfully."
        } catch {
            throw "Failed to install Ollama. $($_.Exception.Message)"
        }
    } else {
        Write-Success "Ollama already installed."
    }

    # --- Verify CLI ---
    Write-Info "Verifying Ollama CLI..."
    $ver = ollama -v
    if (-not $ver) { throw "Ollama CLI is not functioning correctly." }
    Write-Success $ver

    # --- Ensure API is running ---
    Write-Info "Checking Ollama API..."
    if (-not (Test-OllamaApi)) {
        Write-Warn "Ollama API is not running. Starting service..."
        try {
            Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Hidden -ErrorAction Stop | Out-Null
            if (-not (Wait-ForOllamaApi -TimeoutSeconds 300)) {
                throw "Timed out waiting for Ollama API after 300 seconds."
            }
            Write-Success "Ollama API is ready."
        } catch {
            throw "Failed to start Ollama service. $($_.Exception.Message)"
        }
    } else {
        Write-Success "Ollama API already running."
    }

    # --- Model Selection ---
    Write-Host ""
    Write-Host "===================================="
    Write-Host "        Model Selection"
    Write-Host "===================================="

    $SelectedModel = Select-CareerForgesModel

    if ([string]::IsNullOrWhiteSpace($SelectedModel)) {
        throw "No model selected."
    }

    Write-Host ""
    Write-Info "Selected model: $SelectedModel"

    $installed = Get-InstalledOllamaModels
    if ($installed -contains $SelectedModel) {
        Write-Success "Model already installed. Reusing existing model."
    } else {
        Write-Info "Downloading model: $SelectedModel"
        try {
            ollama pull $SelectedModel
            Write-Success "Model downloaded successfully."
        } catch {
            throw "Failed to download model '$SelectedModel'. Check the model name at https://ollama.com/library"
        }
    }

    # --- Download CareerForges ---
    Write-Host ""
    Write-Info "Finding latest CareerForges release..."
    try {
        $release = Invoke-RestMethod -Uri "https://api.github.com/repos/JoshiNaidu/career-forges/releases/latest"
        $asset = $release.assets | Where-Object { $_.name -like "*_x64-setup.exe" } | Select-Object -First 1
        if (-not $asset) { throw "Windows installer asset not found in the latest release." }
    } catch {
        throw "Unable to locate latest CareerForges release. $($_.Exception.Message)"
    }

    Write-Info "Downloading CareerForges..."
    try {
        Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $CareerForgesInstaller
        if (-not (Test-Path $CareerForgesInstaller)) { throw "Installer file not found after download." }
        Write-Success "Download completed."
    } catch {
        throw "Failed to download CareerForges installer. $($_.Exception.Message)"
    }

    # --- Install CareerForges ---
    Write-Info "Installing CareerForges..."
    try {
        Start-Process -FilePath $CareerForgesInstaller -ArgumentList "/S" -Wait -ErrorAction Stop
        Write-Success "CareerForges installed successfully."
    } catch {
        throw "CareerForges installation failed. $($_.Exception.Message)"
    }

    # --- Save Config ---
    Write-Info "Saving CareerForges configuration..."
    Save-CareerForgesModelConfig -Model $SelectedModel

    Write-Host ""
    Write-Success "CareerForges installed successfully!"
    Write-Host ""
    Write-Host "Selected Model : $SelectedModel"
    Write-Host ""

} catch {
    Write-Host ""
    Write-Err "Installation failed."
    Write-Err $_.Exception.Message
    Write-Host ""
    exit 1
} finally {
    try {
        if (Test-Path $TempDir) {
            Remove-Item -Path $TempDir -Recurse -Force -ErrorAction SilentlyContinue
        }
    } catch {}
}