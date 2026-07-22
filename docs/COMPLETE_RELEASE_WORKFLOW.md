# Complete Release & Build Workflow Guide

## ❓ Quick Answers to Your Questions

### Q1: How to Start Kill Switch?
```bash
# When there's a critical bug and you need to IMMEDIATELY stop all updates:
node update-control.js disable

# Everyone sees version 999.99.99 (higher than any real version)
# No updates offered = problem solved temporarily

# When you release fix:
node update-control.js enable

# Users now see the new version
```

### Q2: Can Contributors Build & Release?
```
❌ NO - Here's why:

Contributors:
  - Can write code ✅
  - Can push to branches ✅
  - Can create PRs ✅
  - ❌ CANNOT sign releases (private key in GitHub Secrets)
  - ❌ CANNOT push to main (needs approval)
  - ❌ CANNOT create releases (needs maintainer permission)

Only YOU can:
  - Approve PRs
  - Merge to main
  - Create GitHub releases
  - Sign with your private key
```

### Q3: How to Build & Release?
**See "Complete Release Workflow" section below** - It's exactly what you do, step by step.

### Q4: Before & After Pushing Updates
**See "Full Release Checklist" section below** - Complete checklist.

### Q5: Manual vs Automated?
```
AUTOMATED (GitHub Actions does this):
  ✅ Build the app
  ✅ Sign the installer
  ✅ Generate latest.json
  ✅ Upload to release
  
MANUAL (You do this):
  🔧 Bump version number
  🔧 Create GitHub release
  🔧 Use kill-switch if emergency
```

### Q6: What to Do NOW?
**See "Immediate Action Items (DO TODAY)" section below** - Exactly what you do today.

### Q7: Can You Commit Everything?
**YES!** See "What to Commit to Git" section below - Everything is safe to commit.

---

## 🔨 Complete Release Workflow

### STEP-BY-STEP Release Process

#### Phase 1: Prepare (You Do This)
```
1. Merge all code from contributors via PRs
2. Test everything locally
3. Decide on version number
4. Change version in tauri.conf.json
   
   Example: 0.2.2 → 0.2.3
   
   Edit: app/src-tauri/tauri.conf.json
   {
     "version": "0.2.3"  ← Change this
   }
```

#### Phase 2: Commit & Push (You Do This)
```bash
# Commit the version change
git add app/src-tauri/tauri.conf.json
git commit -m "Bump version to 0.2.3"
git push origin main

# Everything is now on main branch
```

#### Phase 3: GitHub Release (You Do This - 2 minutes)
```
1. Go to: https://github.com/JoshiNaidu/career-forges/releases
2. Click: "Draft a new release"
3. Fill in:
   Tag: v0.2.3
   Title: Version 0.2.3
   Description: 
     ## What's New
     - Feature X
     - Feature Y
     - Bug fix Z
4. Click: "Publish release"
```

#### Phase 4: GitHub Actions (AUTOMATED ✨)
```
🤖 Automatically happens (5-10 minutes):
  ✅ Pulls your code from main
  ✅ npm install
  ✅ npm run build (frontend)
  ✅ npm run tauri build (Rust + app)
  ✅ Reads private key from GitHub Secrets
  ✅ Signs the installer
  ✅ Creates latest.json with signature
  ✅ Uploads latest.json to release assets
  
✅ YOU DON'T NEED TO DO ANYTHING
```

#### Phase 5: Verify (You Do This - 1 minute)
```
1. Go to release page
2. Scroll down to "Assets"
3. Check:
   ✅ CareerForges_0.2.3_x64-setup.exe exists
   ✅ latest.json exists
4. Click latest.json to verify it contains:
   {
     "version": "0.2.3",
     "signature": "dU50cnVz...",  ← MUST have this!
     "url": "..."
   }

If signature is missing → GitHub Actions failed
  Fix: Re-run workflow or debug error logs
```

#### Phase 6: Users Get Update
```
🎉 Automatically happens:
  ✅ Users' apps check for updates on startup
  ✅ See "Update to 0.2.3 available" dialog
  ✅ Click "Update"
  ✅ App installs automatically
  ✅ Restarts with new version
```

---

## ⚡ Full Release Checklist

### Before Release
```
[ ] Code review all PRs
[ ] Merge to main
[ ] Test app locally: npm run tauri dev
[ ] No console errors
[ ] No obvious bugs
[ ] Decide version number
```

### Create Release
```
[ ] Bump version in app/src-tauri/tauri.conf.json
[ ] git add app/src-tauri/tauri.conf.json
[ ] git commit -m "Bump to X.X.X"
[ ] git push origin main
[ ] Create GitHub release with tag vX.X.X
[ ] Write release notes
[ ] Click "Publish release"
```

### Wait & Verify (5-10 minutes)
```
[ ] GitHub Actions workflow starts running
[ ] Workflow completes successfully (check Actions tab)
[ ] Release has latest.json in assets
[ ] latest.json has "signature" field populated
[ ] Signature is not empty/invalid
```

### Post-Release
```
[ ] Monitor for bug reports
[ ] If critical bug:
    [ ] Run: node update-control.js disable
    [ ] Fix bug
    [ ] Release v0.2.4
    [ ] Run: node update-control.js enable
[ ] Update docs if needed
```

---

## 🎯 Kill-Switch Usage (Emergency Only)

### When to Use
```
You just released v0.2.3 and discovered:
  ❌ Critical security bug
  ❌ App crashes on startup
  ❌ Data corruption issue
  ❌ Any blocker that users shouldn't install

ACTION: Use kill-switch immediately!
```

### How to Activate (30 seconds)
```bash
# From any directory
node update-control.js disable

# That's it! Users no longer see update available
```

### What Happens
```
Users' apps check latest.json:
  Version: 999.99.99 (fake, higher than any real version)
  
Result:
  Their version (0.2.3) < 999.99.99? YES
  But can't download 999.99.99
  Result: Update fails silently
  
Outcome: Nobody gets the bad update ✅
```

### How to Re-enable
```bash
# After you fix the bug and release v0.2.4
node update-control.js enable

# Now users see the new version
```

---

## 📊 Manual vs Automated

### What YOU Must Do (No Automation)
```
🔧 MANUAL ONLY:
  1. Review & approve contributor PRs
  2. Merge code to main
  3. Bump version number
  4. Create GitHub release
  5. Use kill-switch if emergency
```

### What GitHub Actions Does (Fully Automated)
```
🤖 AUTOMATIC AFTER YOU CREATE RELEASE:
  1. Triggers automatically
  2. Builds entire app
  3. Compiles Rust + TypeScript
  4. Signs with your private key
  5. Creates latest.json
  6. Uploads to release
  7. All in 5-10 minutes
  
✅ ZERO manual steps!
```

---

## 👥 Contributor Workflow (How They Work With You)

### What Contributors Do
```
1. Clone repo
2. Create feature branch
3. Write code
4. Push to GitHub
5. Create Pull Request

THEY STOP HERE ⚠️

They CANNOT:
  ❌ Access private key
  ❌ Sign releases
  ❌ Run npm run tauri build (on their own for release)
  ❌ Merge to main
  ❌ Create releases
```

### What You Do (Approver)
```
1. Review their PR code
2. If good: Approve & merge to main
3. (Code is now in main)
4. You create release (with YOUR private key)
5. GitHub Actions signs with YOUR key
6. Release is published
```

### Can They Run Tauri Build?
```
✅ YES - They can:
  npm run tauri dev (for development)
  npm run tauri build (for testing)
  
❌ BUT - For releases they cannot:
  Sign with your private key (they don't have it)
  Access GitHub Secrets (they can't)
  Create official releases (only you can)
  
Result: Even if they build locally, their version isn't signed
So their updates won't be verified by users' apps!
```

---

## ✅ What to Commit to Git (RIGHT NOW)

### Safe to Commit ✅
```
✅ app/src-tauri/tauri.conf.json (has public key - safe)
✅ app/src-tauri/tauri.key.pub (public key file - safe)
✅ src/lib/updater.ts (frontend code - safe)
✅ src/app/layouts/app-layout.tsx (frontend code - safe)
✅ .github/workflows/publish-release.yml (workflow - safe)
✅ update-control.js (script - safe)
✅ setup-github-secrets.js (helper - safe)
✅ docs/ folder (all documentation - safe)
```

### NEVER Commit ❌
```
❌ app/src-tauri/tauri.key (PRIVATE KEY!)
   Already in .gitignore ✓
   
❌ app/src-tauri/tauri.key.pub 
   Technically public but don't need in repo
   (public key is in tauri.conf.json)
   Already in .gitignore ✓
```

### Check Your .gitignore
```
cat .gitignore

Should have:
  .env
  *.env
  *.key      ← Protects tauri.key
  *.pem
  node_modules/
```

✅ Already done! Private key is protected.

---

## 🚀 Immediate Action Items (DO TODAY)

### ✅ Item 1: Add Private Key to GitHub Secrets (CRITICAL!)
```
Why: GitHub Actions needs it to sign releases

Steps:
1. Go to: https://github.com/JoshiNaidu/career-forges/settings/secrets/actions
2. Click: "New repository secret"
3. Create:
   Name: TAURI_SIGNING_PRIVATE_KEY
   Value: (paste contents of app/src-tauri/tauri.key)
4. Click: "Add secret"

Time: 5 minutes
Urgency: 🔴 DO THIS FIRST!
```

### ✅ Item 2: Backup Private Key (CRITICAL!)
```
Why: If you lose it, you can't sign future updates

Where to save:
  ✅ Password manager (LastPass, 1Password, Bitwarden)
  ✅ Encrypted file on USB drive
  ✅ Secure cloud storage with encryption
  
DON'T save:
  ❌ Plain text file on desktop
  ❌ Unencrypted email
  ❌ In git (already protected by .gitignore)

Time: 2 minutes
Urgency: 🔴 DO THIS TODAY!
```

### ✅ Item 3: Commit All Changes
```
What to do:
git add -A
git commit -m "Setup: Add auto-update system

- Add updater service (src/lib/updater.ts)
- Integrate updater in app layout
- Setup GitHub Actions workflow
- Generate signing keys
- Add emergency update controller
- Add complete documentation"

git push origin main

Time: 1 minute
Urgency: 🟡 DO THIS WHEN READY
```

### ✅ Item 4: Test First Release
```
Steps:
1. Bump version in app/src-tauri/tauri.conf.json
   "version": "0.2.3"

2. Commit: git add . && git commit -m "Bump to 0.2.3"

3. Push: git push origin main

4. Create GitHub release:
   Tag: v0.2.3
   Publish

5. Wait 10 minutes

6. Verify:
   - Check release has latest.json
   - Verify latest.json has "signature" field

Time: 15 minutes
Urgency: 🟡 DO THIS THIS WEEK
```

---

## 📋 Your Complete Timeline

### RIGHT NOW (Today)
```
⏰ 5 min:  Add private key to GitHub Secrets
⏰ 2 min:  Backup private key
⏰ 1 min:  Commit all changes
─────────────────
Total: 8 minutes
```

### NEXT (This Week)
```
⏰ 15 min: Test first release
  - Bump version
  - Create release
  - Wait for GitHub Actions
  - Verify latest.json generated
```

### ONGOING (Every Release)
```
⏰ 2 min:  Review PRs from contributors
⏰ 1 min:  Bump version
⏰ 1 min:  Create GitHub release
⏰ 10 min: Wait for GitHub Actions
⏰ 1 min:  Verify latest.json exists
─────────────────
Total: ~15 minutes per release
```

### EMERGENCY (Only if needed)
```
⏰ 10 sec: node update-control.js disable
⏰ Fix code...
⏰ 15 min: Release fix version
⏰ 10 sec: node update-control.js enable
```

---

## 🎯 Simple Release Command Reference

```bash
# Build locally (for testing - doesn't sign for release)
cd app
npm run tauri build
# Creates: app/src-tauri/target/release/bundle/nsis/CareerForges_X.X.X_x64-setup.exe

# Kill-switch: block all updates
node update-control.js disable

# Kill-switch: re-enable updates
node update-control.js enable

# Everything else is GitHub Actions (automated)
```

---

## ❌ What NOT to Do

```
❌ DON'T manually create latest.json
   GitHub Actions does this automatically

❌ DON'T manually sign the .exe file
   Tauri does this automatically

❌ DON'T let contributors merge to main directly
   Always require PR review

❌ DON'T commit tauri.key to git
   Already protected by .gitignore

❌ DON'T manually upload files to GitHub release
   GitHub Actions does this for you

❌ DON'T skip the "Verify" step after release
   Make sure latest.json has the signature!

❌ DON'T release without bumping version
   Version comparison is how updates work
```

---

## 🎓 Summary Table

| Task | Who Does It | How Often | Time |
|------|------------|-----------|------|
| Review PRs | You | Per PR | 5-15 min |
| Bump Version | You | Per release | 1 min |
| Create Release | You | Per release | 1 min |
| Build App | GitHub Actions | Per release | 5-10 min |
| Sign App | GitHub Actions | Per release | Auto |
| Generate latest.json | GitHub Actions | Per release | Auto |
| Verify Release | You | Per release | 1 min |
| Use Kill-Switch | You | Emergency only | 10 sec |
| Update Control | You | Anytime needed | 10 sec |

---

## ✨ You're All Set!

Here's your checklist:

### TODAY
```
[ ] Add private key to GitHub Secrets (CRITICAL!)
[ ] Backup private key
[ ] Run: git add -A && git commit -m "Setup: Add auto-update system" && git push
```

### THIS WEEK
```
[ ] Test first release (bump version → create release)
[ ] Verify latest.json generated
[ ] Check workflow logs for any errors
```

### ONGOING
```
[ ] Every release: Bump version → Create release
[ ] Every release: Verify latest.json exists
[ ] Keep kill-switch command bookmarked for emergencies
```

**Everything is automated now. All you do is:**
1. ✅ Approve contributor code
2. ✅ Bump version number
3. ✅ Create GitHub release
4. ✅ Wait for automation
5. ✅ Verify it worked

**No more manual signing. No more manual latest.json. No more complexity.** 🎉
