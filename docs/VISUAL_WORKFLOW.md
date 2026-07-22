# VISUAL WORKFLOW GUIDE

## 🎯 Your Release Process (Visual)

```
┌─────────────────────────────────────────────────────────┐
│  PHASE 1: PREPARE (You)                                 │
│  ─────────────────────────────────────────────────────  │
│  1. Merge contributor PRs via GitHub                     │
│  2. Test locally: npm run tauri dev                      │
│  3. Decide version number (e.g., 0.2.3)                 │
│  4. Edit: app/src-tauri/tauri.conf.json                 │
│     "version": "0.2.3"                                   │
│  ⏱️ Time: 15 minutes                                     │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  PHASE 2: COMMIT & PUSH (You)                           │
│  ─────────────────────────────────────────────────────  │
│  git add app/src-tauri/tauri.conf.json                  │
│  git commit -m "Bump to 0.2.3"                          │
│  git push origin main                                    │
│  ⏱️ Time: 1 minute                                       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  PHASE 3: CREATE GITHUB RELEASE (You)                   │
│  ─────────────────────────────────────────────────────  │
│  Go to: GitHub → Releases → Draft new release           │
│  Tag: v0.2.3                                             │
│  Title: Version 0.2.3                                    │
│  Notes: Release notes here                               │
│  Click: Publish release                                  │
│  ⏱️ Time: 2 minutes                                      │
└─────────────────────────────────────────────────────────┘
                          ↓
        🤖 GITHUB ACTIONS AUTOMATICALLY RUNS
                          ↓
┌─────────────────────────────────────────────────────────┐
│  PHASE 4: GITHUB ACTIONS (AUTOMATED ✨)                 │
│  ─────────────────────────────────────────────────────  │
│  ✅ npm install                                          │
│  ✅ npm run build (frontend)                             │
│  ✅ npm run tauri build (app + Rust)                    │
│  ✅ Reads private key from GitHub Secrets               │
│  ✅ Signs the .exe file                                 │
│  ✅ Generates latest.json with signature                │
│  ✅ Uploads to GitHub release                           │
│  YOU DO NOTHING - Happens automatically!                │
│  ⏱️ Time: 5-10 minutes                                   │
│  ⏱️ Your time needed: 0 minutes                          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  PHASE 5: VERIFY (You)                                  │
│  ─────────────────────────────────────────────────────  │
│  Go to release page                                      │
│  Check Assets section:                                   │
│    ✅ CareerForges_0.2.3_x64-setup.exe                  │
│    ✅ latest.json                                        │
│  Download latest.json and verify:                        │
│    {                                                     │
│      "version": "0.2.3",                                │
│      "signature": "dU50cnVz...",  ← MUST HAVE!          │
│      "url": "..."                                        │
│    }                                                     │
│  ✅ Release is ready!                                    │
│  ⏱️ Time: 1 minute                                       │
└─────────────────────────────────────────────────────────┘
                          ↓
        🎉 USERS AUTOMATICALLY GET UPDATES
                          ↓
┌─────────────────────────────────────────────────────────┐
│  PHASE 6: USER UPDATE (FULLY AUTOMATIC)                 │
│  ─────────────────────────────────────────────────────  │
│  User launches their app                                 │
│    ↓                                                     │
│  App checks latest.json from GitHub                     │
│    ↓                                                     │
│  Sees 0.2.3 available                                    │
│    ↓                                                     │
│  "Update available" dialog appears                       │
│    ↓                                                     │
│  User clicks "Update & Restart"                         │
│    ↓                                                     │
│  App downloads new version                              │
│    ↓                                                     │
│  Verifies signature ✅                                  │
│    ↓                                                     │
│  Installs and restarts                                  │
│    ↓                                                     │
│  App is now v0.2.3 🎉                                   │
│  ⏱️ User's time: 2 minutes (including wait)              │
└─────────────────────────────────────────────────────────┘
```

**Total YOUR time per release: ~20 minutes (most is waiting)**

---

## 🚨 Emergency: Bad Release

```
9:00 AM - You release v0.2.3
9:05 AM - Users get notification
9:10 AM - Bug reports incoming! 😱

┌─────────────────────────────┐
│  RUN KILL-SWITCH NOW!       │
│  node update-control.js     │
│  disable                    │
└─────────────────────────────┘
                ↓
        Latest.json now says:
        "version": "999.99.99"
                ↓
        Users check:
        "0.2.3 < 999.99.99"
        "Can't install 999.99.99"
        ↓
        ❌ NO UPDATE OFFERED
        ✅ PROBLEM SOLVED
        
Time to block: 10 seconds ⚡

9:15 AM - Fix code
9:30 AM - Release v0.2.4
         git add . && git commit -m "Fix bug" && git push
         Create GitHub release v0.2.4
         
9:40 AM - GitHub Actions finishes
         Verify latest.json generated
         
9:45 AM - Re-enable updates
         node update-control.js enable
         
10:00 AM - Users see v0.2.4 update available
          Users update and all is well
```

---

## 👥 Contributors vs You

```
┌────────────────────────────────────────────┐
│  CONTRIBUTOR WORKFLOW                      │
│  ────────────────────────────────────────  │
│  1. Fork repo                              │
│  2. Create feature branch                  │
│  3. Write code                             │
│  4. Push to their fork                     │
│  5. Create Pull Request                    │
│  6. ⏸️ STOPS HERE                           │
│                                             │
│  They CANNOT:                              │
│    ❌ Access private key                   │
│    ❌ Sign releases                        │
│    ❌ Merge to main                        │
│    ❌ Create releases                      │
└────────────────────────────────────────────┘
        ↓
┌────────────────────────────────────────────┐
│  YOUR WORKFLOW (Maintainer)                │
│  ────────────────────────────────────────  │
│  1. Review contributor's PR                │
│  2. If good: Approve & Merge to main       │
│  3. Test locally                           │
│  4. Bump version                           │
│  5. Create GitHub release                  │
│  6. GitHub Actions auto-signs              │
│  7. Verify latest.json                     │
│  8. Release complete! ✅                   │
│                                             │
│  Only YOU can:                             │
│    ✅ Approve code                         │
│    ✅ Merge to main                        │
│    ✅ Sign with private key                │
│    ✅ Create releases                      │
└────────────────────────────────────────────┘
```

---

## 📋 DO THIS NOW (Complete Checklist)

```
TODAY - 5 MINUTE SETUP:
┌─────────────────────────────────────────────────┐
[ ] 1. Add private key to GitHub Secrets
      Go to: github.com/settings/secrets/actions
      Create secret: TAURI_SIGNING_PRIVATE_KEY
      Value: (paste contents of tauri.key)
      ⏱️ 3 minutes

[ ] 2. Backup private key
      Save app/src-tauri/tauri.key to:
        - Password manager
        - Encrypted USB
        - Secure cloud
      ⏱️ 2 minutes

TOTAL TIME: 5 minutes
URGENCY: 🔴 CRITICAL - DO TODAY
└─────────────────────────────────────────────────┘

THIS WEEK - 10 MINUTE COMMIT:
┌─────────────────────────────────────────────────┐
[ ] 3. Commit everything to git
      cd c:\Personal\CareerForges\career-forges
      git add -A
      git commit -m "Setup: Add auto-update system"
      git push origin main
      ⏱️ 3 minutes

[ ] 4. Test first release
      Bump version to 0.2.3
      Create GitHub release v0.2.3
      Wait 10 minutes
      Verify latest.json exists
      ⏱️ 15 minutes (mostly waiting)

TOTAL TIME: 20 minutes
URGENCY: 🟡 DO THIS WEEK
└─────────────────────────────────────────────────┘
```

---

## 🔑 Three Things You Need to Know

### 1. Automated vs Manual

```
AUTOMATED (GitHub Actions):
  ✅ Build app
  ✅ Compile code
  ✅ Sign installer
  ✅ Generate latest.json
  ✅ Upload to release
  
  YOU DO NOTHING - GitHub Actions handles it!

MANUAL (You):
  🔧 Review PRs
  🔧 Bump version
  🔧 Create release
  🔧 Use kill-switch if needed
  
  These 4 things are ALL you do per release
```

### 2. Private Key Security

```
Your private key:
  🔒 Generated on your machine
  🔒 Added to GitHub Secrets (not visible)
  🔒 Protected by .gitignore (not committed)
  🔒 Only used by GitHub Actions to sign
  
Result:
  ✅ Contributors can't access it
  ✅ GitHub Secrets encrypts it
  ✅ Never exposed in logs
  ✅ Only used for signing
```

### 3. Kill-Switch (Emergency)

```
If you need to stop all updates:
  
  node update-control.js disable
  
That's it! Takes 10 seconds.

Users:
  - Won't see any update
  - Stay on current version
  - No broken installs

When you release fix:
  
  node update-control.js enable
  
Users see the fix immediately.
```

---

## ✨ Your Complete System

```
You control:                GitHub Actions controls:
  ├─ Code reviews            ├─ Building
  ├─ Version bumps           ├─ Signing
  ├─ Creating releases       ├─ Generating latest.json
  ├─ Backup management       └─ Uploading files
  └─ Emergency controls

Security:
  ├─ Private key: Protected
  ├─ Contributors: Can't forge signatures
  ├─ Kill-switch: Always available
  └─ Users: Get verified updates only

Automation:
  ├─ Build: Automatic
  ├─ Sign: Automatic
  ├─ Upload: Automatic
  └─ Your work: Minimal (bump version, create release)
```

---

## 🎓 Final Summary

| Action | Who | When | Time | Frequency |
|--------|-----|------|------|-----------|
| Review code | You | Before release | 5-15 min | Per PR |
| Bump version | You | Before release | 1 min | Per release |
| Create release | You | At release | 2 min | Per release |
| GitHub Actions | Bot | After release | 5-10 min | Per release |
| Verify | You | After Actions | 1 min | Per release |
| Use kill-switch | You | Emergency only | 10 sec | As needed |

**Average time per release: 20 minutes (including GitHub Actions wait)**
**Your active time: ~10 minutes**

---

## ✅ EVERYTHING IS READY

You now have:
  ✅ Private key generated
  ✅ Public key in config
  ✅ GitHub Actions workflow ready
  ✅ Update checking code written
  ✅ Kill-switch script ready
  ✅ Complete documentation
  
Next: Add private key to GitHub Secrets + Commit to git!
