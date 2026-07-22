````md
# Developer Setup

This guide helps contributors set up CareerForges locally for development.

---

# Requirements

Install:

- Node.js 20+
- Rust
- Git
- Visual Studio Build Tools (Windows only)

---

# 1. Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/career-forges.git
cd career-forges/app
```

---

# 2. Install Node.js

Download:

https://nodejs.org

Verify:

```bash
node -v
npm -v
```

---

# 3. Install Rust

## Windows

```powershell
winget install Rustlang.Rustup
```

## macOS / Linux

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

Verify installation:

```bash
rustc --version
cargo --version
```

---

# 4. Install Visual Studio Build Tools (Windows Only)

Required for Rust/Tauri compilation.

Install:

```powershell
winget install Microsoft.VisualStudio.2022.BuildTools
```

Inside installer select:

- Desktop development with C++

Verify:

```powershell
where link
```

---

# 5. Add Cargo To PATH (If Needed)

Cargo is usually installed at:

```txt
C:\Users\<YOUR_USERNAME>\.cargo\bin
```

If `cargo --version` fails, add the folder above to your Windows PATH.

## Windows PATH Setup

1. Open:

```txt
Edit the system environment variables
```

2. Click:

```txt
Environment Variables
```

3. Under:

```txt
User variables
```

edit `Path`

4. Add:

```txt
C:\Users\<YOUR_USERNAME>\.cargo\bin
```

5. Restart:
- VS Code
- PowerShell
- terminal windows

Verify:

```bash
cargo --version
```

---

# 6. Windows Security / Defender Fixes

Rust and Tauri generate temporary executables during compilation.

Some Windows Defender or security policies may block builds with errors like:

```txt
An Application Control policy has blocked this file. (os error 4551)
```

If this happens, apply the fixes below.

---

## Add Windows Defender Exclusions

Open:

```txt
Windows Security
→ Virus & threat protection
→ Manage settings
→ Exclusions
→ Add or remove exclusions
```

Add these folders:

```txt
C:\Users\<YOUR_USERNAME>\.cargo
```

```txt
C:\Users\<YOUR_USERNAME>\.rustup
```

```txt
C:\Personal\CareerForges
```

Restart VS Code afterwards.

---

## Enable Developer Mode

Open:

```txt
Settings
→ Privacy & Security
→ For Developers
```

Enable:

```txt
Developer Mode
```

Restart Windows afterwards.

---

## Run VS Code As Administrator

If builds still fail:

1. Close VS Code
2. Right click VS Code
3. Select:

```txt
Run as administrator
```

---

## Move Project To Simpler Path

Some Windows security policies block builds in deeply nested folders.

Recommended project location:

```txt
C:\dev\career-forges
```

Avoid:
- Desktop
- Downloads
- OneDrive folders
- protected corporate folders

---

# 7. Install Dependencies

Inside `app/`:

```bash
npm install
```

---

# 8. Install Frontend Libraries

```bash
npm install react-router-dom zustand lucide-react framer-motion clsx tailwind-merge date-fns nanoid
```

---

# 9. Install TailwindCSS

```bash
npm install -D tailwindcss@3 postcss autoprefixer
```

Initialize:

```bash
npx tailwindcss init -p
```

---

# 10. Install shadcn/ui

```bash
npx shadcn@latest init
```

Recommended:

- Radix
- Nova preset

---

# 11. Run Development App

```bash
npm run tauri dev
```

This launches:

- Vite frontend server
- native Tauri desktop app

---

# Common Errors

## cargo metadata failed

### Cause

- Rust/Cargo missing from PATH

### Fix

Verify:

```bash
cargo --version
```

If command fails:

- reinstall Rust
- restart terminal
- verify PATH
- restart VS Code completely

---

## cargo command not found

### Cause

- Cargo missing from PATH

### Fix

Add Cargo to PATH:

```txt
C:\Users\<YOUR_USERNAME>\.cargo\bin
```

Restart:
- VS Code
- terminal
- PowerShell

Verify:

```bash
cargo --version
```

---

## link.exe not found

### Cause

- Visual Studio Build Tools missing

### Fix

Install:

- Desktop development with C++

inside Visual Studio Build Tools installer.

Verify:

```powershell
where link
```

---

## An Application Control policy has blocked this file (os error 4551)

### Cause

Windows security software blocked Rust build executables.

Possible sources:
- Windows Defender
- Smart App Control
- antivirus
- Controlled Folder Access
- enterprise security policies

### Fix

Try these solutions:

- add Windows Defender exclusions
- enable Developer Mode
- run VS Code as Administrator
- move project to `C:\dev`
- restart Windows after changes

Then clean and rebuild:

```bash
cargo clean
cargo run
```

---

## Unknown at rule @tailwind

### Cause

- VS Code warning only

### Fix

Install:

- Tailwind CSS IntelliSense extension

---

# Project Structure

```txt
career-forges/
 ├── app/          # Tauri desktop app
 ├── landing/      # Marketing website
 ├── docs/
 └── README.md
```
````
