# CareerForges Auto-Update System Documentation

## 📋 Overview

Your app uses **Tauri's built-in auto-updater** with **GitHub Releases** as the update source. This system:
- Automatically detects new updates when users launch the app
- Verifies updates are legitimate using cryptographic signatures
- Allows you to block/enable updates without a backend
- Prevents contributors from deploying malicious updates

---

## 🔐 Security: How Keys Work

### The Two Keys (Asymmetric Cryptography)

| Key | Purpose | Location | Visible? |
|-----|---------|----------|----------|
| **Private Key** | SIGNS installers (proof they're from you) | `src-tauri/tauri.key` (your machine) | 🔒 Secret |
| **Public Key** | VERIFIES signatures are authentic | `tauri.conf.json` (in repo) | 🌐 Public |

### How It Protects You

```
Example: Contributor tries to push malicious code

1. Contributor PRs bad code
2. You review & merge it
3. GitHub Actions AUTOMATICALLY:
   - Builds the app
   - Signs it with YOUR private key
   - Creates latest.json with the signature
4. User's app downloads update
5. App VERIFIES signature with public key
6. ✅ Signature valid → Update proceeds
7. ✅ Signature invalid → Update REJECTED (security)

If attacker tried to:
- Modify the .exe file → Signature breaks ❌
- Modify latest.json → Signature doesn't match ❌
- Re-sign without private key → Impossible ❌
```

### Why Contributors Can't Compromise It

- Private key is in `*.key` (excluded from git)
- Even if they had code access, the signature is calculated AFTER build
- They can't sign without the private key
- GitHub Actions only runs YOUR workflow on YOUR releases

---

## 🚀 Setting Up for First Release

### Step 1: Export Your Private Key as GitHub Secret

Your private key already exists locally from when you generated it. You need to:

```powershell
# On your machine (where you built Tauri originally)
# Find your private key:
cat app/src-tauri/tauri.key

# Copy the ENTIRE content (including -----BEGIN/END PRIVATE KEY-----)
```

1. Go to GitHub repo → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `TAURI_SIGNING_PRIVATE_KEY`
4. Value: Paste your entire private key content
5. Click "Add secret"

**If you have a password on your key:**
1. Create another secret named `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`
2. Value: Your key password

### Step 2: Test the Workflow

```bash
# 1. Bump version in app/src-tauri/tauri.conf.json
{
  "version": "0.2.3"  # Changed from 0.2.2
}

# 2. Commit and push
git add app/src-tauri/tauri.conf.json
git commit -m "Bump to 0.2.3"
git push

# 3. Create a GitHub release (with tag v0.2.3)
# Go to: GitHub.com → Releases → Draft a new release
# Tag: v0.2.3
# Title: Version 0.2.3
# Description: Your release notes
# Click "Publish release"

# GitHub Actions automatically:
# - Builds your app
# - Generates latest.json
# - Uploads it to the release
```

### Step 3: Verify It Worked

1. Go to your GitHub release (v0.2.3)
2. Check that `latest.json` is in the assets
3. Download and check the content:
```json
{
  "version": "0.2.3",
  "signature": "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXk...",
  "url": "https://github.com/.../CareerForges_0.2.3_x64-setup.exe"
}
```

---

## 📱 What Happens When Users Install

### First Time Installation
- User downloads `CareerForges_0.2.3_x64-setup.exe` from GitHub
- Installs to their machine
- App runs with version 0.2.3

### On Every App Startup
```
1. App launches
2. Calls: await check() from updater service
3. Downloads latest.json from GitHub
4. Compares:
   - App version: 0.2.3
   - Latest version: (from latest.json)
5. If app version < latest version:
   - Show dialog "Update available"
   - User accepts
   - Download new version
   - Verify signature
   - Install & restart
```

### For Already-Installed Users
- If you release v0.2.4, they'll see "Update to 0.2.4" on next startup
- They can accept or skip
- Update downloads and installs in background
- App restarts automatically

---

## 🔐 Emergency: Blocking Updates (Kill Switch)

**Scenario**: You just released v0.2.4 and discovered a critical bug

### Option 1: Using Update Controller Script (Recommended)
```bash
# BLOCK all updates immediately
node update-control.js disable

# Users won't see any update available
# (The fake version 999.99.99 is higher than any real version)
```

When you're ready:
```bash
# RE-ENABLE updates
node update-control.js enable

# Now users see the next real release
```

### Option 2: Manual - Edit latest.json
```json
{
  "version": "999.99.99",
  "notes": "Updates temporarily disabled for maintenance",
  "pub_date": "2026-05-23T...",
  "platforms": {...}
}
```
Upload to GitHub release and update the download URL.

---

## 🛠️ Rollback (What If You Need to Go Back?)

**Scenario**: Released v0.2.4 but users should stay on v0.2.3

```bash
# Option 1: Just disable updates
node update-control.js disable

# Option 2: Point back to old version
# Edit latest.json to have:
{
  "version": "0.2.3",  // Points back to old version
  "url": "https://github.com/.../CareerForges_0.2.3_x64-setup.exe"
}
```

Old version users: No update offered (0.2.3 is not > 0.2.3)
v0.2.4 users: Update back to 0.2.3

---

## 📁 Files Reference

```
Important Files:

✅ app/src-tauri/tauri.conf.json
   - Contains PUBLIC key (safe, in repo)
   - Update endpoint URL
   - Dialog settings

✅ app/src/lib/updater.ts
   - Frontend code that calls check()
   - Handles download and install

✅ app/src/app/layouts/app-layout.tsx
   - Calls updater on app startup
   - Runs background checks

✅ .github/workflows/publish-release.yml
   - Automatically builds and signs on release
   - Generates latest.json

✅ update-control.js
   - Emergency kill-switch script
   - No backend needed

🔒 app/src-tauri/tauri.key (NOT IN REPO)
   - Private key (protected by .gitignore)
   - GitHub Actions accesses via Secret

🔒 app/src-tauri/tauri.key.pub (NOT IN REPO)
   - Public key copy (auto-generated)
```

---

## 🐛 Troubleshooting

### "Update not showing up"
- Check that `latest.json` exists in GitHub release
- Verify signature matches (should auto-generate)
- Check browser console for errors: F12 → Console → search "Updater"

### "Signature invalid"
- Public key in `tauri.conf.json` doesn't match
- Latest.json signature was manually edited
- Run GitHub Actions workflow to regenerate

### "Can't download update"
- Check URL in `latest.json` is correct
- GitHub release might be private (make public)
- Network/firewall blocking GitHub

### "Already-installed users don't get update"
- Check app version is lower than `latest.json` version
- Run `npm run tauri build` to generate latest.json with new version

---

## 🎯 Release Checklist

Every time you release:

- [ ] Bump version in `app/src-tauri/tauri.conf.json`
- [ ] Commit: `git commit -m "Bump to X.X.X"`
- [ ] Push: `git push`
- [ ] Create GitHub release with tag `vX.X.X`
- [ ] Wait for GitHub Actions to complete (5-10 min)
- [ ] Verify `latest.json` appears in release assets
- [ ] Download `latest.json` and verify signature is present
- [ ] Test: Run app and check console for update detection

---

## 📞 Support

If something breaks:
1. Check browser console (F12)
2. Check GitHub Actions workflow logs
3. Verify private key is in GitHub Secrets
4. Make sure version in `tauri.conf.json` < version in `latest.json`

Happy releasing! 🚀
