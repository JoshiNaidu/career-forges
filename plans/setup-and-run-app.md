# CareerForges - Local Setup & Run Plan

## Overview

This plan walks through getting the CareerForges Tauri desktop app running locally with the SQLite database, fixing any errors along the way.

## Architecture Reminder

```
React Frontend (TypeScript/Vite) ◄── Tauri IPC Bridge ──► Rust Backend (Tauri v2)
                                                              │
                                                    ┌─────────┴──────────┐
                                                    │   SQLite Database   │
                                                    │  (Auto-created via  │
                                                    │    migrations)      │
                                                    └────────────────────┘
```

The **SQLite database is auto-created** on first app launch via the migration system in [`app/src-tauri/src/db/migration.rs`](app/src-tauri/src/db/migration.rs). No manual database setup is needed.

## Prerequisites Check

| Tool | Required | How to Check |
|------|----------|-------------|
| Node.js 20+ | ✅ | `node --version` |
| npm | ✅ | `npm --version` |
| Rust (rustc) | ✅ | `rustc --version` |
| Cargo | ✅ | `cargo --version` |
| VS Build Tools (Windows) | ✅ | `where link` |

## Setup Steps

### Step 1: Install Frontend Dependencies
```bash
cd app
npm install
```
> **Already done?** The `node_modules/` directory exists, so likely yes. But running `npm install` again won't hurt—it'll just ensure everything is up to date.

### Step 2: Build & Run the App
```bash
cd app
npm run tauri dev
```

This single command:
1. Starts the Vite dev server (port 1420)
2. Compiles the Rust backend
3. Launches the native desktop window
4. SQLite database auto-creates with migrations on first run

### Step 3: Fix Compilation Errors (if any)

#### Common Rust Errors:
| Error | Likely Cause | Fix |
|-------|-------------|-----|
| `cargo metadata` failed | Rust/Cargo not in PATH | Add `C:\Users\<user>\.cargo\bin` to PATH |
| `link.exe` not found | Missing VS Build Tools | Install "Desktop development with C++" workload |
| Rust compilation errors | Code issues | Check [`lib.rs`](app/src-tauri/src/lib.rs) (~1037 lines) for errors |

#### Common TypeScript Errors:
| Error | Likely Cause | Fix |
|-------|-------------|-----|
| Missing module imports | npm not run or missing deps | `npm install` |
| Type errors | Outdated types | Check [`models.ts`](app/src/lib/db/models.ts) alignment with Rust types |

### Step 4: Verify Database

After the app runs successfully:
- The SQLite DB file will be created at the app's data directory
- Tables are auto-created via migrations (10 migrations total - see [`schema.rs`](app/src-tauri/src/db/schema.rs))
- You can inspect the DB using any SQLite browser (e.g., DB Browser for SQLite)

### Step 5: Additional Debugging

If the app fails to start, check:
1. **VS Code terminal** for Rust compilation output
2. **Vite dev server** for frontend errors
3. **Tauri devtools** (`F12` in the app window) for runtime errors

## Key Files Reference

| File | Purpose |
|------|---------|
| [`app/src-tauri/src/lib.rs`](app/src-tauri/src/lib.rs) | Main Rust entry point (~1037 lines, core logic) |
| [`app/src-tauri/src/db/schema.rs`](app/src-tauri/src/db/schema.rs) | All 10 DB migrations |
| [`app/src-tauri/src/db/connection.rs`](app/src-tauri/src/db/connection.rs) | SQLite connection pool |
| [`app/package.json`](app/package.json) | Frontend dependencies |
| [`app/src-tauri/Cargo.toml`](app/src-tauri/Cargo.toml) | Rust dependencies |
| [`app/src-tauri/tauri.conf.json`](app/src-tauri/tauri.conf.json) | Tauri app config |
| [`app/src/app/router.tsx`](app/src/app/router.tsx) | React routes |
| [`app/src/lib/db/service.ts`](app/src/lib/db/service.ts) | Frontend DB service |
| [`app/src/lib/db/invoke.ts`](app/src/lib/db/invoke.ts) | Tauri IPC wrappers |
