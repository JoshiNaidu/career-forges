#!/bin/bash

set -e

# ==========================================
# CareerForges macOS Installer
# ==========================================

APP_NAME="CareerForges"
GITHUB_REPO="JoshiNaidu/career-forges"

CONFIG_DIR="$HOME/Library/Application Support/CareerForges"
CONFIG_FILE="$CONFIG_DIR/config.json"

TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

# ==========================================
# Colors
# ==========================================
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
RESET='\033[0m'

info()    { echo -e "${CYAN}$1${RESET}"; }
success() { echo -e "${GREEN}$1${RESET}"; }
warn()    { echo -e "${YELLOW}$1${RESET}"; }
err()     { echo -e "${RED}$1${RESET}"; }

# ==========================================
# Available Preset Models (Reordered for Speed)
# ==========================================
PRESET_MODELS=(
    "llama3.2:1b"
    "gemma3:4b"
    "qwen3:8b"
    "qwen3.5:latest"
    "gemma3:12b"
    "deepseek-r1:8b"
    "qwen3:14b"
)
PRESET_LABELS=(
    "[Fastest][Recommended] Llama 3.2 1B"
    "[Fast]        Gemma 3 4B"
    "[Recommended] Qwen 3 8B"
    "[Reasoning]   Qwen 3.5"
    "[Quality]     Gemma 3 12B"
    "[Reasoning]   DeepSeek R1 8B"
    "[Best]        Qwen 3 14B"
)
PRESET_SIZES=( "1.3 GB" "3 GB" "5.2 GB" "6.6 GB" "8 GB" "5 GB" "10 GB" )
PRESET_DESCS=(
    "Recommended for CareerForges (Instant Onboarding)"
    "Lightweight and fast"
    "Faster Option"
    "Better reasoning"
    "Higher quality responses"
    "Strong reasoning"
    "Best local quality"
)

# ==========================================
# Helper: get installed models
# ==========================================
get_installed_models() {
    ollama list 2>/dev/null \
        | tail -n +2 \
        | awk '{print $1}' \
        | grep -v '^$' \
        | sort -u
}

# ==========================================
# Helper: read a custom model name
# ==========================================
read_custom_model() {
    echo "" >&2
    info "Enter any model name available on Ollama Hub." >&2
    info "Examples: mistral:7b  |  phi3:mini  |  llava:13b  |  codellama:7b" >&2
    info "Browse all models at: https://ollama.com/library" >&2
    echo "" >&2
    while true; do
        read -rp "Custom model name: " custom_name
        custom_name="$(echo "$custom_name" | xargs)"   # trim whitespace
        if [ -n "$custom_name" ]; then
            echo "$custom_name"
            return
        fi
        warn "Model name cannot be empty. Please try again." >&2
    done
}

# ==========================================
# Model Selection
# Echoes the chosen model name on stdout.
# All user-facing output goes to stderr so
# the caller can capture just the model name.
# ==========================================
select_model() {

    mapfile -t installed < <(get_installed_models)

    # ---- If models already present, offer reuse ----
    if [ "${#installed[@]}" -gt 0 ]; then
        echo "" >&2
        echo -e "${BOLD}Installed Models:${RESET}" >&2
        echo "" >&2
        for m in "${installed[@]}"; do
            echo "  [installed] $m" >&2
        done
        echo "" >&2
        echo "  [1] Use an existing model" >&2
        echo "  [2] Download a preset model" >&2
        echo "  [3] Enter a custom model name" >&2
        echo "" >&2

        while true; do
            read -rp "Select an option (1-3): " choice
            case "$choice" in
                1|2|3) break ;;
                *) warn "Please enter 1, 2, or 3." >&2 ;;
            esac
        done

        if [ "$choice" = "1" ]; then
            echo "" >&2
            for i in "${!installed[@]}"; do
                echo "  [$((i+1))] ${installed[$i]}" >&2
            done
            echo "" >&2
            while true; do
                read -rp "Choose a model (1-${#installed[@]}): " sel
                if [[ "$sel" =~ ^[0-9]+$ ]] && [ "$sel" -ge 1 ] && [ "$sel" -le "${#installed[@]}" ]; then
                    echo "${installed[$((sel-1))]}"
                    return
                fi
                warn "Invalid selection. Try again." >&2
            done
        fi

        if [ "$choice" = "3" ]; then
            read_custom_model
            return
        fi

        # Falls through to preset list
    fi

    # ---- Preset model list ----
    echo "" >&2
    echo -e "${BOLD}Available Preset Models${RESET}" >&2
    echo "" >&2
    printf "  %-4s %-36s %-8s %s\n" "No." "Model" "Size" "Description" >&2
    echo "  $(printf '%0.s-' {1..75})" >&2
    for i in "${!PRESET_MODELS[@]}"; do
        printf "  [%s]  %-34s %-8s %s\n" \
            "$((i+1))" \
            "${PRESET_LABELS[$i]}" \
            "${PRESET_SIZES[$i]}" \
            "${PRESET_DESCS[$i]}" >&2
    done
    echo "" >&2
    echo "  [C]  Enter a custom model name (e.g. mistral:7b, phi3:mini)" >&2
    echo "" >&2

    count="${#PRESET_MODELS[@]}"
    while true; do
        read -rp "Select a model (1-${count} or C) [Default: 1]: " choice
        if [ -z "$choice" ]; then
            choice="1"
        fi
        if [[ "$choice" =~ ^[Cc]$ ]]; then
            read_custom_model
            return
        fi
        if [[ "$choice" =~ ^[0-9]+$ ]] && [ "$choice" -ge 1 ] && [ "$choice" -le "$count" ]; then
            echo "${PRESET_MODELS[$((choice-1))]}"
            return
        fi
        warn "Invalid selection. Please enter a number between 1 and ${count}, or C." >&2
    done
}

# ==========================================
# Save config
# ==========================================
save_config() {
    local model="$1"
    local timestamp
    timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    mkdir -p "$CONFIG_DIR"
    cat > "$CONFIG_FILE" <<EOF
{
  "selectedModel": "$model",
  "configuredAt": "$timestamp"
}
EOF
    success "Saved CareerForges model configuration."
    echo "Config: $CONFIG_FILE"
}

# ==========================================
# Main
# ==========================================

echo ""
echo "===================================="
echo "      CareerForges Installer"
echo "===================================="
echo ""

# --- Check / Install Ollama ---
info "Checking Ollama..."

if ! command -v ollama >/dev/null 2>&1; then
    warn "Ollama not found. Installing..."
    curl -fsSL https://ollama.com/install.sh | sh
    success "Ollama installed successfully."
else
    success "Ollama already installed."
fi

info "Verifying Ollama CLI..."
OLLAMA_VER=$(ollama -v 2>/dev/null || true)
if [ -z "$OLLAMA_VER" ]; then
    err "Ollama CLI is installed but not functioning correctly."
    exit 1
fi
success "$OLLAMA_VER"

# --- Ensure API is running ---
info "Checking Ollama API..."
READY=false

if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
    READY=true
    success "Ollama API already running."
else
    warn "Ollama API not running. Starting service..."
    ollama serve >/dev/null 2>&1 &
    info "Waiting for Ollama API..."
    for i in $(seq 1 60); do
        if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
            READY=true
            break
        fi
        sleep 1
    done
fi

if [ "$READY" = false ]; then
    err "Ollama failed to start after 60 seconds."
    exit 1
fi
success "Ollama API is ready."

# --- Model Selection ---
echo ""
echo "===================================="
echo "        Model Selection"
echo "===================================="

SELECTED_MODEL=$(select_model)

if [ -z "$SELECTED_MODEL" ]; then
    err "No model selected. Aborting."
    exit 1
fi

echo ""
info "Selected model: $SELECTED_MODEL"

# Pull model if not already installed
if get_installed_models | grep -qx "$SELECTED_MODEL"; then
    success "Model already installed. Reusing existing model."
else
    info "Downloading model: $SELECTED_MODEL"
    if ! ollama pull "$SELECTED_MODEL"; then
        err "Failed to download model '$SELECTED_MODEL'."
        err "Check the model name at: https://ollama.com/library"
        exit 1
    fi
    success "Model downloaded successfully."
fi

# --- Find latest release asset ---
echo ""
info "Finding latest CareerForges release..."

RELEASE_JSON=$(curl -fsSL "https://api.github.com/repos/${GITHUB_REPO}/releases/latest")

DOWNLOAD_URL=$(echo "$RELEASE_JSON" \
    | grep '"browser_download_url"' \
    | grep '\.app\.tar\.gz' \
    | head -1 \
    | sed 's/.*"browser_download_url": "\(.*\)".*/\1/')

if [ -z "$DOWNLOAD_URL" ]; then
    err "Could not find a macOS release asset (.app.tar.gz) in the latest release."
    exit 1
fi

info "Downloading CareerForges..."
curl -L "$DOWNLOAD_URL" -o "$TMP_DIR/app.tar.gz"
success "Download completed."

# --- Extract & Install ---
info "Extracting..."
tar -xzf "$TMP_DIR/app.tar.gz" -C "$TMP_DIR"

info "Removing old installation (if any)..."
rm -rf "/Applications/$APP_NAME.app"

info "Installing to /Applications..."
mv "$TMP_DIR/$APP_NAME.app" /Applications/

info "Removing quarantine flags..."
xattr -cr "/Applications/$APP_NAME.app"

info "Fixing permissions..."
chmod -R 755 "/Applications/$APP_NAME.app"

info "Applying ad-hoc signature..."
codesign --force --deep --sign - "/Applications/$APP_NAME.app"

# --- Save config ---
info "Saving CareerForges configuration..."
save_config "$SELECTED_MODEL"

# --- Launch ---
info "Launching app..."
open "/Applications/$APP_NAME.app"

echo ""
success "CareerForges installed successfully!"
echo ""
echo "Selected Model : $SELECTED_MODEL"
echo ""