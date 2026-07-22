# 🔐 CareerForges Update System - Security & Keys Explained

## CRITICAL: Your Keys Have Been Generated!

```
Private Key Location: app/src-tauri/tauri.key
Public Key Location: app/src-tauri/tauri.key.pub
Config Updated: app/src-tauri/tauri.conf.json
```

---

## ⚠️ SECURITY CHECKLIST

### ✅ ALREADY DONE FOR YOU:
- [x] Private key generated locally (`tauri.key`)
- [x] Public key generated locally (`tauri.key.pub`)
- [x] `tauri.conf.json` updated with public key
- [x] `.gitignore` already has `*.key` protection

### ⚠️ YOU MUST DO NOW:
1. **BACK UP YOUR PRIVATE KEY SAFELY** (not in git!)
2. **Store private key in GitHub Secrets** (for CI/CD)
3. **Never commit `tauri.key` to git**
4. **Keep your backup secure**

---

## 🔑 Understanding the Keys

### Private Key (Your Treasure 🏴‍☠️)
- **File**: `app/src-tauri/tauri.key`
- **Currently**: On your machine only
- **What it does**: SIGNS the installer to prove it's from you
- **If lost**: You CANNOT sign future updates
- **If compromised**: Attacker can sign malicious updates

### Public Key (Can Share 🌐)
- **Currently in**: `app/src-tauri/tauri.conf.json` and `app/src-tauri/tauri.key.pub`
- **What it does**: VERIFIES signatures are authentic
- **If modified**: Updates won't be trusted (app rejects them)
- **Everyone sees**: Yes, it's public

### How They Work Together

```
1. You Release v0.2.3
   ↓
2. GitHub Actions Builds App + Signs with PRIVATE KEY
   ↓
3. Creates latest.json with signature
   ↓
4. User Downloads Update
   ↓
5. App Verifies Signature with PUBLIC KEY
   ↓
6. If Signature Valid ✅ → Update Installed
   If Signature Invalid ❌ → Update Rejected (Security!)
```

---

## 📋 What This Protects Against

### Attacker Scenario #1: Compromise GitHub Account
- Attacker gains access to your repo
- Tries to upload malicious update
- Can't sign it (needs private key)
- Update gets rejected by users' apps ✅ PROTECTED

### Attacker Scenario #2: Compromise GitHub Actions
- Tries to build malicious version
- Can't sign without private key
- Fake update fails verification ✅ PROTECTED

### Attacker Scenario #3: Malicious Contributor
- PRs dangerous code
- You review and approve (mistake!)
- Code gets built and signed (your private key)
- BUT: You can still DISABLE updates immediately
- Kill-switch: `node update-control.js disable` ✅ PROTECTED

### Attacker Scenario #4: Modify latest.json
- Changes signature to fake one
- Users' apps verify signature
- Doesn't match private key signature
- Update rejected ✅ PROTECTED

---

## 🚀 Next Steps (DO THIS NOW)

### Step 1: Verify Private Key Exists Locally
```powershell
cat app/src-tauri/tauri.key
# Should show: dU50cnVzdGVkIGNvbW1lbnQ6...
```

### Step 2: BACK UP Your Private Key
**Save to a SECURE location (not in git, not online yet):**
```bash
# Copy the contents of app/src-tauri/tauri.key
# Save to: YourSecureBackup/tauri.key.backup
# Store in: Password manager or secure drive
```

### Step 3: Add Private Key to GitHub Secrets
**This allows GitHub Actions to sign releases:**

1. Go to: `https://github.com/JoshiNaidu/career-forges/settings/secrets/actions`
2. Click: **"New repository secret"**
3. Create Secret #1:
   ```
   Name: TAURI_SIGNING_PRIVATE_KEY
   Value: (paste entire contents of app/src-tauri/tauri.key)
   ```
4. Click: **"Add secret"**

### Step 4: Test the Build
```bash
cd app
npm run tauri build
```

Expected output:
```
Finished `release` profile...
Built application at: ...
```

---

## 🔒 Security Best Practices

### ✅ DO:
- [ ] Back up private key in secure location
- [ ] Store in password manager
- [ ] Only add to GitHub Secrets (not in code)
- [ ] Rotate keys annually (optional)
- [ ] Use `node update-control.js disable` if emergency

### ❌ DON'T:
- [ ] Commit `tauri.key` to git
- [ ] Share private key in chat/email
- [ ] Paste it anywhere except GitHub Secrets
- [ ] Use same key for multiple projects
- [ ] Lose your backup (can't recover!)

---

## 💾 Recovery Plans

### If You Lose Your Private Key:
**You CAN'T sign future updates.** Solution:
1. Generate NEW keys: `npm run tauri keygen`
2. Update `tauri.conf.json` with new public key
3. Commit and push changes
4. Release new installer with updated public key
5. Users who download the new version will be able to update again
6. Old version users: stuck (can't verify with old key)

**This is why backing up is CRITICAL!**

### If Private Key Is Compromised:
1. Generate NEW keys immediately
2. DO NOT use the old key anymore
3. Update all GitHub Secrets with new key
4. Release new version with new public key
5. Warn existing users to update

---

## 📝 Folder Structure (After Setup)

```
career-forges/
├── app/
│   └── src-tauri/
│       ├── tauri.conf.json          ← Updated with PUBLIC key
│       ├── tauri.key                ← 🔒 PRIVATE (in .gitignore)
│       ├── tauri.key.pub            ← PUBLIC key file
│       └── ...
├── .gitignore                       ← Has *.key protection
├── .github/
│   └── workflows/
│       └── publish-release.yml      ← Uses TAURI_SIGNING_PRIVATE_KEY secret
├── docs/
│   ├── AUTO_UPDATE_SYSTEM.md        ← Full system docs
│   └── SECURITY_KEYS.md             ← This file
├── update-control.js                ← Emergency kill-switch
└── setup-github-secrets.js          ← Helper script
```

---

## 🧪 Testing Update System

### Test 1: Verify Keys Work
```bash
cd app/src-tauri
npm run tauri build
# Should complete without errors
# Should create .sig file in target/release/bundle/
```

### Test 2: Create Test Release
1. Bump version in `tauri.conf.json` (e.g., 0.2.3)
2. Commit: `git add . && git commit -m "Bump to 0.2.3"`
3. Push: `git push`
4. Create GitHub release with tag `v0.2.3`
5. Wait 5 minutes for GitHub Actions
6. Check release has `latest.json` in assets

### Test 3: Verify Signature
```bash
# In release assets, download latest.json
# Should contain:
{
  "version": "0.2.3",
  "signature": "dU50cnVzdGVkIGNvbW1lbnQ6IHNpZ25h...",
  "url": "https://github.com/.../CareerForges_0.2.3_x64-setup.exe"
}
```

---

## 🚨 Emergency: Block All Updates

If you release a bad version:
```bash
node update-control.js disable
# Users won't see any update available
```

When ready to re-enable:
```bash
node update-control.js enable
```

---

## 📞 Common Questions

**Q: Can contributors compromise the keys?**
A: No. Private key is in GitHub Secrets (not in repo). Contributors can't access it.

**Q: What if I delete `tauri.key`?**
A: Keep your backup! You can restore from backup. If both are gone, generate new keys (old updates won't work for old app version users).

**Q: Does the public key need to be in the repo?**
A: Yes! It's in `tauri.conf.json`. Apps use it to verify updates.

**Q: Can I change the public key?**
A: Yes, but only the new version will verify. Old versions stay on old key.

**Q: Is the backup secure?**
A: YES - backup is just data. The key is encrypted by Tauri. Use a password manager.

---

## ✅ Your Setup is Complete!

You now have:
- ✅ Private key generated and safe
- ✅ Public key in config
- ✅ `.gitignore` protecting secrets
- ✅ GitHub Actions ready
- ✅ Emergency kill-switch ready
- ✅ Full documentation

**Next: Add private key to GitHub Secrets, then test a release!** 🚀
