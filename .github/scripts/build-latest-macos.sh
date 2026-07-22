#!/bin/bash
set -euo pipefail

echo "=== DEBUG: Environment Variables ==="
echo "GITHUB_REPOSITORY: $GITHUB_REPOSITORY"
echo "GITHUB_REF_NAME: $GITHUB_REF_NAME"
echo "GITHUB_EVENT_RELEASE_BODY: ${GITHUB_EVENT_RELEASE_BODY:-'(empty)'}"
echo "GITHUB_EVENT_RELEASE_PUBLISHED_AT: ${GITHUB_EVENT_RELEASE_PUBLISHED_AT:-'(empty)'}"
echo "=== Starting macOS updater metadata generation ==="

VERSION="${GITHUB_REF_NAME#v}"

echo "Version: $VERSION"

echo "Searching for macOS updater signature..."

SIG_FILE=$(find app/src-tauri/target/release/bundle -type f \
  \( -name "*.app.tar.gz.sig" -o -name "*.tar.gz.sig" \) \
  | head -n 1)

if [ -z "${SIG_FILE:-}" ]; then
  echo "ERROR: No macOS updater signature file found."

  echo "Available bundle files:"
  find app/src-tauri/target/release/bundle -type f

  exit 1
fi

echo "Found signature:"
echo "$SIG_FILE"

UPDATER_FILE="${SIG_FILE%.sig}"
UPDATER_NAME="$(basename "$UPDATER_FILE")"

DOWNLOAD_URL="https://github.com/${GITHUB_REPOSITORY}/releases/download/${GITHUB_REF_NAME}/${UPDATER_NAME}"

echo "Constructed URL: $DOWNLOAD_URL"

if [ -z "$DOWNLOAD_URL" ] || [ "$DOWNLOAD_URL" = "https://github.com//releases/download//" ]; then
  echo "ERROR: DOWNLOAD_URL is empty or malformed!"
  exit 1
fi

export VERSION
export SIG_FILE
export DOWNLOAD_URL
export GITHUB_EVENT_RELEASE_BODY
export GITHUB_EVENT_RELEASE_PUBLISHED_AT

cat > generate-latest-macos.js <<'EOF'
const fs = require("fs");

const sig = fs.readFileSync(process.env.SIG_FILE, "utf8").trim();

const out = {
  version: process.env.VERSION,
  notes: process.env.GITHUB_EVENT_RELEASE_BODY || "",
  pub_date: process.env.GITHUB_EVENT_RELEASE_PUBLISHED_AT,
  platforms: {
    "darwin-x86_64": {
      signature: sig,
      url: process.env.DOWNLOAD_URL
    }
  }
};

fs.writeFileSync(
  "latest-darwin-x86_64.json",
  JSON.stringify(out, null, 2)
);

console.log("Generated latest-darwin-x86_64.json");
EOF

node generate-latest-macos.js

echo "Done."