# How CareerForges Updates Work - Complete Flow

## 📊 The Complete Update Flow (Detailed)

### Phase 1: Release by Developer (You)

```
┌─────────────────────────────────────────────────────────┐
│ 1. You bump version in tauri.conf.json                  │
│    "version": "0.2.3"                                   │
│                                                         │
│ 2. You commit and push to main                          │
│    git push origin main                                 │
│                                                         │
│ 3. You create GitHub release with tag v0.2.3           │
│    https://github.com/.../releases/tag/v0.2.3          │
└─────────────────────────────────────────────────────────┘
                          ↓
    GitHub Actions Triggers (automatically)
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 4. GitHub Actions Workflow Runs:                        │
│                                                         │
│    Step 1: Checkout code                               │
│    Step 2: Restore private key from GitHub Secrets     │
│    Step 3: npm run tauri build                         │
│             └→ Builds CareerForges_0.2.3_x64.exe      │
│             └→ Signs with PRIVATE KEY                 │
│             └→ Creates CareerForges_0.2.3_x64.exe.sig │
│    Step 4: Generate latest.json                        │
│             {                                           │
│               "version": "0.2.3",                       │
│               "signature": "dU50cnVz...",  ← SIGNED!   │
│               "url": "https://github.../...exe"        │
│             }                                           │
│    Step 5: Upload latest.json to release assets        │
└─────────────────────────────────────────────────────────┘
                          ↓
            Files now on GitHub Release:
    - CareerForges_0.2.3_x64-setup.exe
    - CareerForges_0.2.3_x64-setup.exe.sig
    - latest.json  ← This is what apps check!
```

---

### Phase 2: User Already Has v0.2.2 Installed

```
┌──────────────────────────────────────────────────────┐
│ User launches CareerForges v0.2.2                    │
│                                                      │
│ App startup calls: await check()                     │
│ └→ From: src/lib/updater.ts                         │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│ Check Action 1: Download latest.json                │
│                                                      │
│ URL: https://github.com/.../latest.json             │
│                                                      │
│ Downloads:                                           │
│ {                                                    │
│   "version": "0.2.3",       ← Latest version         │
│   "notes": "Bug fixes...",                           │
│   "pub_date": "2026-05-23...",                       │
│   "platforms": {                                     │
│     "windows-x86_64": {                              │
│       "signature": "dU50cnVz...",  ← Signature!      │
│       "url": "https://github.../...exe"             │
│     }                                                │
│   }                                                  │
│ }                                                    │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│ Check Action 2: Compare Versions                    │
│                                                      │
│ App version: 0.2.2                                  │
│ Latest version: 0.2.3                               │
│                                                      │
│ 0.2.2 < 0.2.3?  YES ✅                              │
│                                                      │
│ → Update Available! Show Dialog                      │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│ Dialog Shows to User:                                │
│ ┌──────────────────────────────────────────────────┐ │
│ │  Update Available                                │ │
│ │  ───────────────────────────────────────────    │ │
│ │  Version: 0.2.3                                  │ │
│ │  Release Notes: Bug fixes...                     │ │
│ │                                                  │ │
│ │  [ Cancel ]  [ Update & Restart ]               │ │
│ └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
                        ↓
        User clicks "Update & Restart"
                        ↓
┌──────────────────────────────────────────────────────┐
│ Check Action 3: VERIFY SIGNATURE                    │
│                                                      │
│ Before downloading, verify signature from latest.json
│ Using PUBLIC KEY from tauri.conf.json               │
│                                                      │
│ Signature verification:                              │
│   signature = "dU50cnVz..."                          │
│   public_key = "dU50cnVz..." (from config)          │
│   Matches? ✅ YES → Proceed                          │
│   Matches? ❌ NO → REJECT, show error               │
│                                                      │
│ This prevents fake updates!                         │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│ Action 4: Download New Installer                    │
│                                                      │
│ URL: https://github.../CareerForges_0.2.3_x64.exe  │
│                                                      │
│ Downloads ~50MB to temporary location                │
│ Shows progress bar in app                            │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│ Action 5: VERIFY Signature AGAIN                    │
│                                                      │
│ Before installing, verify the .exe file itself       │
│ The .sig file was created during build by Tauri      │
│                                                      │
│ Signature check:                                     │
│   .exe file + .sig file + public key = Valid ✅      │
│                                                      │
│ This prevents tampering during download!            │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│ Action 6: Install & Restart                         │
│                                                      │
│ 1. Run installer (with admin prompt)                 │
│ 2. Uninstall old version                             │
│ 3. Install new version                               │
│ 4. Automatically restart app                         │
│ 5. App launches with v0.2.3                         │
│                                                      │
│ ✅ Update Complete!                                  │
└──────────────────────────────────────────────────────┘
```

---

## 🔒 Security: Multiple Signature Checks

```
         User's App
            ↓
    ┌───────────────────┐
    │  Check latest.json │ ← Has signature from latest.json
    │  signature field   │    Verifies it's legit
    └───────────────────┘
            ↓
    Is it signed by you? ✅ YES
            ↓
    ┌──────────────────┐
    │ Download .exe    │
    │ file from GitHub │
    └──────────────────┘
            ↓
    ┌───────────────────┐
    │  Check .exe.sig   │ ← File signature on disk
    │  file signature   │    Verifies file wasn't tampered
    └───────────────────┘
            ↓
    Is it signed by you? ✅ YES
            ↓
    ┌──────────────────┐
    │  Install & Run!  │
    └──────────────────┘
```

**Result: Two layers of verification = Very secure!**

---

## 🚨 What If Something Goes Wrong?

### Scenario 1: Bad Version Released (v0.2.3 has bugs)

```
Timeline:
  5:00 PM - You release v0.2.3
  5:05 PM - Users get update notification
  5:10 PM - Users start updating
  5:15 PM - Bug reports come in! 😱

Solution: KILL SWITCH
  5:16 PM - You run: node update-control.js disable
  5:16 PM - latest.json now says version "999.99.99"
  5:17 PM - Users who haven't updated yet won't see it
  5:18 PM - Users already updated: stuck (until you fix)
  
  5:30 PM - You find bug and commit fix
  6:00 PM - You release v0.2.4
  6:05 PM - You run: node update-control.js enable
  6:05 PM - Users see v0.2.4 update available now
```

### Scenario 2: Signature Doesn't Match

```
Why it happens:
- Someone modified latest.json manually
- GitHub Actions failed to sign properly
- Corrupted download

What happens:
  User tries to update
      ↓
  App downloads latest.json
      ↓
  App checks signature
      ↓
  Signature ≠ Private key
      ↓
  ❌ REJECTED - "Update failed"
      ↓
  User stays on current version (safe!)
```

### Scenario 3: Attacker Tries to Push Update

```
Attacker scenario:
  Hacker compromises GitHub account
  Tries to create malicious release
  
What happens:
  GitHub Actions runs workflow
      ↓
  Builds app from hacker's code
      ↓
  Tries to sign with private key
      ↓
  ❌ Can't! Private key is in GitHub Secrets
      ↓
  Workflow fails
      ↓
  No latest.json created
      ↓
  No update available (users safe!)
```

---

## 📱 Real Example: Version Progression

### Day 1: Initial Release
```
Version in code: 0.2.2
Release: v0.2.2
latest.json: { "version": "0.2.2", ... }
Users already have: 0.2.2

Check for update: 0.2.2 < 0.2.2? NO
Update shown: NO
```

### Day 2: New Feature
```
Version in code: 0.2.3
Release: v0.2.3
latest.json: { "version": "0.2.3", ... }
Users still have: 0.2.2

Check for update: 0.2.2 < 0.2.3? YES ✅
Update shown: YES
User gets: v0.2.3
```

### Day 3: Critical Bug in 0.2.3
```
You disable updates:
  node update-control.js disable
  
latest.json: { "version": "999.99.99", ... }
Users still have: 0.2.2 or 0.2.3

Check for update: 
  0.2.2 < 999.99.99? YES but can't install 999.99.99
  Update shown: NO (graceful failure)
```

### Day 4: Fix Released
```
You fix bug, release v0.2.4
You enable updates:
  node update-control.js enable
  
latest.json: { "version": "0.2.4", ... }
Users: 0.2.2 or 0.2.3

Check for update:
  0.2.2 < 0.2.4? YES ✅
  0.2.3 < 0.2.4? YES ✅
Update shown: YES (for both!)
```

---

## 🎯 Implementation Details in Your Code

### Frontend (TypeScript)
```typescript
// src/lib/updater.ts
import { check } from '@tauri-apps/plugin-updater';

export async function checkForUpdates() {
  const update = await check();  // Downloads latest.json
  
  if (update?.available) {
    // Shows dialog
    // User clicks "Update"
    await update.downloadAndInstall();  // Downloads, verifies, installs
    // App restarts automatically
  }
}
```

### Backend (Rust)
```rust
// src-tauri/src/lib.rs
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        // ↑ This plugin handles:
        //   - Downloading latest.json
        //   - Verifying signatures
        //   - Managing updates
        .run(tauri::generate_context!())
}
```

### Config
```json
// tauri.conf.json
"updater": {
  "active": true,           // Enable updates
  "dialog": true,           // Show dialog
  "pubkey": "dU50cnVz...",  // Public key for verification
  "endpoints": ["https://github.com/.../latest.json"]  // Where to check
}
```

---

## ✅ Checklist for Every Release

```
PRE-RELEASE:
  [ ] Thoroughly test new features
  [ ] Test in real app (npm run tauri dev)
  [ ] No critical bugs
  
RELEASE:
  [ ] Bump version in tauri.conf.json
  [ ] Commit: git commit -m "Bump to X.X.X"
  [ ] Push: git push origin main
  [ ] Create GitHub release with tag vX.X.X
  [ ] Write release notes
  [ ] Publish release
  
POST-RELEASE:
  [ ] Wait 5-10 minutes for GitHub Actions
  [ ] Check release assets for latest.json
  [ ] Download latest.json and verify signature
  [ ] Test update in old app version
  [ ] Monitor for bug reports
  
IF BUG FOUND:
  [ ] Run: node update-control.js disable
  [ ] Fix bug
  [ ] Release new version
  [ ] Run: node update-control.js enable
```

---

## 🎓 Learning Resources

- Tauri Updater Docs: https://tauri.app/v1/guides/distribution/updater/
- Minisign (Signature Library): https://jedisct1.github.io/minisign/
- GitHub Actions: https://docs.github.com/en/actions
- Update Flow Video: (see AUTO_UPDATE_SYSTEM.md for text version)

---

## 💡 Key Takeaways

1. **Two-layer signature verification** prevents fake updates
2. **Private key never leaves your GitHub Secrets** - contributors can't compromise it
3. **Kill-switch is always available** - you can block updates immediately
4. **Public key in config** - updates only work with matching signatures
5. **GitHub Actions automates everything** - no manual signing needed
6. **Already-installed users get automatic checks** - they'll see updates naturally

**You now have a professional-grade update system!** 🚀
