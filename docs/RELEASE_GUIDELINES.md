# CareerForges Release Guidelines

## Overview

CareerForges uses semantic versioning and maintains a clear prerelease/release strategy to communicate product maturity to users. This document outlines best practices for managing releases and keeping the landing page synchronized.

---

## Semantic Versioning

CareerForges follows [Semantic Versioning 2.0.0](https://semver.org/):

```
MAJOR.MINOR.PATCH
```

- **MAJOR** (0): Breaking changes or major feature releases
- **MINOR** (1): New features, backward compatible
- **PATCH** (0): Bug fixes, patches, minor improvements

**Example progression:**
- `0.1.0` → `0.1.1` (bug fix)
- `0.1.1` → `0.2.0` (new feature)
- `0.9.0` → `1.0.0` (public release, stable API)

---

## Prerelease vs Release

### **Prerelease (0.x.x)**
- Active development phase
- Features may be incomplete
- Expect breaking changes between versions
- **Currently:** v0.2.0 Alpha

### **Release (1.0.0+)**
- Stable, production-ready version
- API stability guaranteed
- Backward compatibility maintained

---

## Release Process

### Step 1: Update Version in `package.json`

Located at: [app/package.json](../app/package.json)

```json
{
  "version": "0.2.0"
}
```

### Step 2: Create GitHub Release

1. Go to: [GitHub Releases](https://github.com/JoshiNaidu/career-forges/releases)
2. Click "Draft a new release"
3. Tag version: `v0.2.0` (include `v` prefix)
4. Title: `v0.2.0 - [Feature Description]`
5. Description: Include changelog, new features, bug fixes, known issues
6. Check "This is a pre-release" (for 0.x.x versions)
7. Publish release

**Release notes template:**

```markdown
## 🎉 What's New in v0.2.0

### ✨ New Features
- Feature 1 description
- Feature 2 description

### 🐛 Bug Fixes
- Fix 1 description
- Fix 2 description

### 🔄 Breaking Changes
- (If any)

### 📥 Downloads
- [Windows](link)
- [macOS](link)
- [Linux](link)

---
Built with ❤️ by the CareerForges community
```

### Step 3: Update Landing Page

When releasing a new version, update:

**File:** [landing/index.html](../landing/index.html)

**Update the following:**

1. **Hero Stats Bar** (around line 865-870):
```html
<div class="stat prerelease-stat">
  <span class="stat-num">v0.2.0</span>
  <span class="stat-label">Early Access</span>
</div>
```

2. **Footer** (around line 1010):
```html
<p>© 2026 CareerForges • v0.2.0 Prerelease • Built by <a href="https://mattajoshi.in" target="_blank">Matta Joshi</a> • <a href="https://github.com/JoshiNaidu/career-forges/releases" target="_blank">Release Notes</a></p>
```

---

## Landing Page Elements

### 1. **Download Prerelease Button** (Hero Section)
- **Text:** `📥 Download Prerelease`
- **Link:** `https://github.com/JoshiNaidu/career-forges/releases`
- **Location:** Primary CTA in hero buttons
- **Purpose:** Direct users to latest prerelease builds

### 2. **Version Badge** (Stats Bar)
- **Text:** `v0.2.0 Alpha` (or current version)
- **Label:** `Early Access` (or `Stable` for 1.0.0+)
- **Styling:** Orange accent with border
- **Location:** Right side of stats bar
- **Purpose:** Clearly indicate product maturity status

### 3. **Release Notes Link** (Footer)
- **Text:** `Release Notes`
- **Link:** `https://github.com/JoshiNaidu/career-forges/releases`
- **Location:** Footer beside creator attribution
- **Purpose:** Quick access to changelog and download history

---

## Status Labels Guide

| Version | Label | Styling | Meaning |
|---------|-------|---------|---------|
| 0.x.x | `Early Access` | Orange badge | Active development, features may change |
| 1.0.0+ | `Stable` | Green badge | Production-ready, API frozen |

### Switching to Stable Release

When releasing v1.0.0:

1. Change stat label from "Early Access" to "Stable"
2. Update CSS class from `prerelease-stat` to `stable-stat` (optional)
3. Consider updating hero badge text
4. Remove "Prerelease" from footer text

---

## Checklist for New Releases

- [ ] Version updated in `app/package.json`
- [ ] New GitHub Release created with tag format `vX.Y.Z`
- [ ] Release marked as "pre-release" (for 0.x.x)
- [ ] Changelog included in release notes
- [ ] Version updated in landing page stats bar
- [ ] Version updated in landing page footer
- [ ] All links verified and working
- [ ] Announcement posted in relevant channels (if applicable)

---

## Download Links Format

The main download button redirects to:
```
https://github.com/JoshiNaidu/career-forges/releases
```

Users can select the appropriate binary for their OS (Windows, macOS, Linux).

### Future Enhancement

Consider adding version-specific links in the future:
```
https://github.com/JoshiNaidu/career-forges/releases/tag/v0.2.0 Alpha
```

---

## Migration to v1.0.0

When the project reaches stability:

1. Update version to `1.0.0` in `package.json`
2. Update landing page to remove "Early Access" messaging
3. Change version badge styling (green instead of orange)
4. Update footer: remove "Prerelease" text
5. Update hero section (consider removing "Now open source" badge)

---

## Related Files

- [app/package.json](../app/package.json) - Version definition
- [landing/index.html](../landing/index.html) - Landing page (version display)
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contributing guidelines
- GitHub Releases: https://github.com/JoshiNaidu/career-forges/releases

---

**Last Updated:** May 22, 2026
