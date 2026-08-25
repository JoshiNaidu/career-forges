# CareerForges Backend Architecture Guide

## Overview

CareerForges uses:

* Tauri v2
* Rust
* SQLite
* Deadpool SQLite Pool
* Local-first architecture
* Repository pattern
* Migration-based schema management

The app is fully local. No cloud database is required.

---

# High Level Architecture

```txt
Frontend (React)
      ↓
Tauri Commands
      ↓
Repositories
      ↓
SQLite Database
```

Additional layer:

```txt
Services
```

for:

* parsing
* AI orchestration
* normalization
* business logic

---

# Folder Structure

```txt
src-tauri/src/

commands/
db/
services/
types.rs
utils.rs
lib.rs
main.rs
```

---

# What Each Folder Does

---

## commands/

Acts like backend APIs.

Frontend communicates with Rust using:

```ts
invoke("command_name")
```

Each command:

* receives frontend requests
* validates input
* calls repositories/services
* returns response

Example files:

```txt
commands/user_commands.rs
commands/session_commands.rs
commands/resume_commands.rs
```

---

## db/

Database system.

Contains:

* SQLite connection
* migrations
* repositories
* schema management

---

## db/connection.rs

Responsible for:

* initializing SQLite
* creating Deadpool connection pool
* enabling WAL mode
* handling async DB access

Main functions:

```rust
init_db()
get_connection()
execute()
query_row()
```

---

## db/migration.rs

Custom migration engine.

Responsible for:

* tracking executed migrations
* applying new migrations safely
* schema upgrades

Migrations are tracked inside:

```sql
_migrations
```

table.

---

## db/schema.rs

Contains ALL database migrations.

Every DB change must be added here.

NEVER modify old migrations after release.

Always append new migration.

---

## db/repositories/

Database access layer.

Repositories:

* contain SQL
* isolate DB logic
* return typed data

Examples:

```txt
user_repository.rs
resume_repository.rs
settings_repository.rs
```

Commands should NOT directly write SQL.

---

## services/

Business logic layer.

Contains:

* parsing
* normalization
* AI orchestration
* resume extraction

Services should NOT:

* directly manage frontend
* contain UI logic

---

## types.rs

Shared Rust structs/types.

Contains:

* request payloads
* response payloads
* API shapes

---

## utils.rs

Helper functions.

Examples:

* OS detection
* command execution
* helper utilities

---

## lib.rs

Main backend entry point.

Responsible for:

* app startup
* plugin initialization
* DB startup
* migration execution
* command registration

This is the backend brain.

---

# Database Lifecycle

## On App Startup

App automatically:

```txt
1. Creates app data directory
2. Opens SQLite database
3. Initializes connection pool
4. Runs migrations
5. Registers commands
6. Starts app
```

---

# Database File Location

## Windows

```txt
AppData/Roaming/com.careerforges.app/
```

Database file:

```txt
careerforges.db
```

---

# How Migrations Work

Migrations automatically:

* create tables
* update schema
* preserve old user data

Each migration runs ONCE only.

Executed migrations are stored inside:

```sql
_migrations
```

table.

---

# IMPORTANT RULE

NEVER edit old migrations after release.

BAD:

```rust
001_initial_schema
```

modified later.

GOOD:

```rust
015_add_resume_score
```

new migration appended.

---

# Creating New Database Table

## Step 1

Open:

```txt
db/schema.rs
```

---

## Step 2

Add new migration at END of vector.

Example:

```rust
migration!(
    "015_bookmarks_table",
    "
    CREATE TABLE bookmarks (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT,
        created_at TIMESTAMP NOT NULL
    );
    "
),
```

---

## Step 3

Restart app.

Migration runs automatically.

---

# Updating Existing Table

Example:
Add new column.

```rust
migration!(
    "016_add_resume_score",
    "
    ALTER TABLE resumes
    ADD COLUMN ats_score REAL;
    "
),
```

Restart app.

Migration auto-applies.

---

# Creating New Feature

Example:
Bookmarks feature.

Recommended steps:

---

## 1. Add Migration

Inside:

```txt
db/schema.rs
```

Create DB table.

---

## 2. Create Repository

Inside:

```txt
db/repositories/bookmark_repository.rs
```

Handles:

* insert
* update
* delete
* query

---

## 3. Register Repository

Inside:

```txt
db/repositories/mod.rs
```

Add:

```rust
pub mod bookmark_repository;
```

---

## 4. Create Commands

Inside:

```txt
commands/bookmark_commands.rs
```

Add Tauri commands:

```rust
#[tauri::command]
pub async fn db_create_bookmark() {}

#[tauri::command]
pub async fn db_list_bookmarks() {}
```

---

## 5. Register Command Module

Inside:

```txt
commands/mod.rs
```

Add:

```rust
pub mod bookmark_commands;
```

---

## 6. Register Tauri Commands

Inside:

```rust
invoke_handler!
```

in:

```txt
lib.rs
```

Add:

```rust
db_create_bookmark,
db_list_bookmarks,
```

---

## 7. Frontend Usage

React frontend:

```ts
await invoke("db_create_bookmark")
```

---

# Creating New API

In Tauri:
commands ARE APIs.

Flow:

```txt
Frontend
→ invoke()
→ command
→ repository/service
→ database
→ response
```

---

# Repository Rules

Repositories SHOULD:

* contain SQL
* return typed data
* isolate DB access

Repositories SHOULD NOT:

* manage UI
* contain frontend logic
* perform navigation

---

# Service Rules

Services SHOULD:

* contain business logic
* parse data
* orchestrate AI
* transform data

Services SHOULD NOT:

* directly write SQL
* manage frontend

---

# Recommended Future Structure

```txt
models/
```

Recommended future models:

```txt
models/
  user.rs
  resume.rs
  session.rs
  message.rs
```

Models define typed app entities.

---

# Build Commands

## Development

```bash
npm run tauri dev
```

---

## Rust Validation

```bash
cargo check
```

---

## Production Build

```bash
npm run tauri build
```

---

# Important Rules

## NEVER

* modify old migrations
* write SQL directly inside frontend
* put business logic inside commands
* directly access DB from frontend

---

## ALWAYS

* add new migrations
* use repositories
* keep commands small
* keep services reusable

---

# Current Backend Strengths

CareerForges already includes:

* migration system
* repository architecture
* local-first DB
* connection pooling
* modular command structure
* AI orchestration
* updater support
* scalable architecture

This is already beyond MVP-level architecture.

---

# Future Improvements

Recommended future upgrades:

* models/
* tests/
* vector database
* embedding storage
* structured logging
* AI orchestration modules
* analytics system
* encrypted local secrets

---

# Mental Model

Think of backend layers like this:

```txt
Frontend = UI
Commands = API routes
Repositories = DB access
Services = business logic
SQLite = local storage
Migrations = DB upgrades
```

That is the complete CareerForges backend architecture.
