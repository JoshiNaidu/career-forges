# CareerForges — Development Environment Setup Guide

## Overview

CareerForges is a **local-first AI desktop application** built using:

* Tauri
* React
* TypeScript
* Tailwind CSS
* SQLite

Since Tauri creates **native desktop applications**, some system-level dependencies are required.

This guide explains:

* what needs to be installed
* why it is required
* how to set it up properly
* how to run the app on Windows, macOS, and Linux

---

# Why These Dependencies Are Required

## React Handles Only the UI

React builds:

* buttons
* layouts
* dashboards
* frontend interactions

But desktop apps require:

* native windows
* filesystem access
* OS integration
* installers
* secure system APIs

That native layer is handled by:

```txt
Tauri + Rust
```

---

# Why Rust Is Required

Tauri internally uses Rust for:

* native desktop runtime
* performance
* security
* memory safety
* app packaging

Even if most development happens in:

* React
* TypeScript

Rust is still required underneath for compilation.

---

# Why C++ Build Tools Are Required (Windows)

Rust on Windows compiles using:

* Microsoft Visual C++ compiler
* Windows SDK
* linker (`link.exe`)

Without these:

* Tauri cannot compile
* Rust builds fail
* desktop app cannot launch

---

# Required Software

## Required For All Platforms

| Dependency | Purpose              |
| ---------- | -------------------- |
| Node.js    | Frontend tooling     |
| Rust       | Native Tauri runtime |
| Git        | Version control      |

---

# Windows Setup

---

## 1. Install Node.js

Recommended:

* Node.js 20+

Download:

[Node.js](https://nodejs.org?utm_source=chatgpt.com)

Verify:

```bash
node -v
npm -v
```

---

## 2. Install Rust

### CLI Installation

```powershell
winget install Rustlang.Rustup
```

OR manually:

[Rust Installer](https://rustup.rs?utm_source=chatgpt.com)

Verify:

```bash
rustc --version
cargo --version
```

---

## 3. Install Visual Studio Build Tools

### CLI Installation

```powershell
winget install Microsoft.VisualStudio.2022.BuildTools
```

OR manually:

[Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/?utm_source=chatgpt.com)

---

## IMPORTANT

Inside installer select:

```txt
Desktop development with C++
```

Required components:

* MSVC Build Tools
* Windows SDK
* C++ CMake tools

Verify installation:

```powershell
where link
```

If successful:
a path to `link.exe` will appear.

---

## 4. Add Rust To PATH (If Needed)

Windows sometimes does not automatically expose Cargo inside VS Code terminals.

Add:

```txt
C:\Users\<YOUR_USERNAME>\.cargo\bin
```

to:

* User Environment Variables
* PATH

Then restart:

* VS Code
* terminals

Verify:

```bash
cargo --version
```

---

# macOS Setup

---

## 1. Install Homebrew

[Homebrew](https://brew.sh?utm_source=chatgpt.com)

---

## 2. Install Node.js

```bash
brew install node
```

---

## 3. Install Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

Verify:

```bash
rustc --version
cargo --version
```

---

## 4. Install Xcode Command Line Tools

```bash
xcode-select --install
```

Required for:

* native compilation
* Apple SDKs
* linker support

---

# Linux Setup

---

## Ubuntu / Debian

### Install Dependencies

```bash
sudo apt update
```

```bash
sudo apt install -y \
build-essential \
curl \
wget \
file \
libssl-dev \
libgtk-3-dev \
libayatana-appindicator3-dev \
librsvg2-dev
```

---

## Install Node.js

```bash
sudo apt install nodejs npm
```

---

## Install Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

Verify:

```bash
rustc --version
cargo --version
```

---

# Repository Structure

```txt
career-forges/
 ├── app/          ← Tauri desktop application
 ├── landing/      ← Marketing website
 ├── docs/
 ├── assets/
 └── README.md
```

---

# Initial Project Setup

Inside repository root:

```bash
mkdir app
cd app
```

---

# Create Tauri App

```bash
npm create tauri-app@latest .
```

Recommended selections:

| Option          | Value      |
| --------------- | ---------- |
| Framework       | React      |
| Language        | TypeScript |
| Package Manager | npm        |

---

# Install Dependencies

```bash
npm install
```

---

# Run Development Server

```bash
npm run tauri dev
```

This launches:

* Vite frontend server
* native desktop application window

---

# Recommended Frontend Libraries

```bash
npm install react-router-dom zustand lucide-react framer-motion clsx tailwind-merge date-fns nanoid
```

---

# Install TailwindCSS

```bash
npm install -D tailwindcss@3 postcss autoprefixer
```

Initialize:

```bash
npx tailwindcss init -p
```

---

# Install shadcn/ui

```bash
npx shadcn@latest init
```

Recommended:

* Radix
* Nova preset

---

# Common Errors

---

## `cargo metadata` failed

### Cause

Rust/Cargo not installed or not available in PATH.

### Fix

```bash
cargo --version
```

If command fails:

* reinstall Rust
* restart terminal
* verify PATH

---

## `link.exe not found`

### Cause

Visual Studio Build Tools missing.

### Fix

Install:

```txt
Desktop development with C++
```

inside:

* Visual Studio Build Tools installer

---

## `Unknown at rule @tailwind`

### Cause

VS Code warning only.

### Fix

Install:

```txt
Tailwind CSS IntelliSense
```

extension.

---

# Development Philosophy

CareerForges is designed as:

```txt
Local-first
Privacy-focused
AI-powered
No cloud backend
No hosted database
User-owned data
```

All processing should remain local whenever possible.

---

# Core MVP Goal

The first successful milestone is:

1. Upload resume
2. Paste job description
3. Claude analyzes both
4. ATS score generated
5. Optimized resume returned

Everything running locally inside a desktop application.
