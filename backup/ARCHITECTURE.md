# 🏗️ CareerForges: Technical Architecture & Development Guide

CareerForges is a privacy-first, local AI career operating system built with **Tauri**, **Rust**, and **React**. This document provides a deep dive into the system architecture, data flow, and a guide for adding or updating features.

---

## 🛠️ System Overview

### **Technology Stack**
- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite, Lucide Icons.
- **Backend**: Rust, Tauri 2.0.
- **Database**: SQLite (via `rusqlite` and `deadpool-sqlite` for connection pooling).
- **AI Engine**: Ollama (local execution of LLMs like Llama 3.2, Qwen 2.5, DeepSeek R1).
- **Communication**: Tauri IPC (Invoke) for Frontend-to-Backend; Tauri Events for Backend-to-Frontend.

---

## 📂 Backend Structure (`src-tauri/src`)

The backend is organized into functional modules:

### **1. Database Layer (`db/`)**
- `connection.rs`: Manages the SQLite connection pool.
- `schema.rs`: Defines the database schema and migrations.
- `repositories/`: contains logic for specific entities.
    - `resume_repository.rs`: Master resume and parsed content storage.
    - `job_repository.rs`: Scraped jobs and matching scores.
    - `email_repository.rs`: Simulation and storage of recruiter communications.
    - `application_repository.rs`: Tracks job application status.

### **2. Service Layer (`services/`)**
- `resume/`: Text extraction (PDF) and hybrid parsing (Regex + AI).
- `job/`: 
    - `engine.rs`: Coordinates fetching from adapters and matching against the resume.
    - `scheduler.rs`: Background task that triggers job searches and email simulations.
    - `adapters/`: Scrapers for specific sources (LinkedIn, Indeed, Greenhouse via DuckDuckGo).
- `ats/`: Logic for generating optimized resumes and cover letters.

### **3. Command Layer (`commands/`)**
- Entry points for frontend requests. Each command typically fetches data from a repository or triggers a service.

---

## 🔄 Core Data Flows

### **Job Discovery Flow**
1. **Trigger**: `JobScheduler` runs every N minutes (or user clicks "Refresh").
2. **Context**: Scheduler fetches the `default` resume to extract the user's current job title and top 5 skills.
3. **Search**: `JobDiscoveryEngine` calls adapters. Adapters use DuckDuckGo with site-specific filters (e.g., `site:linkedin.com/jobs/view/`) and a "past week" time filter (`df=w`).
4. **Matching**: `JobMatchingEngine` compares job keywords against the master resume and calculates a score.
5. **Persistence**: New jobs are saved to SQLite. Unique constraints on URL prevent duplicates.
6. **Notification**: If new jobs are found, a Tauri event is emitted to show a desktop notification.

### **ATS Document Generation**
1. **Trigger**: User marks a job as "Applied".
2. **Logic**: `mark_job_as_applied` in `ats_commands.rs` checks if a generated resume already exists.
3. **Generation**: If missing, it calls `AtsGenerator` which sends the `master_resume_json` and `job_description` to Ollama.
4. **Fallback**: If Ollama is offline, a high-quality generic template is used to prevent UI failure.

---

## 📝 How to Update or Add Features

### **Adding a New Database Entity**
1. **Schema**: Add a new migration in `db/schema.rs` with the `CREATE TABLE` statement.
2. **Model**: Create a corresponding struct in `db/repositories/your_feature.rs`.
3. **Repository**: Implement `create`, `get`, `list`, and `delete` methods.
4. **Re-export**: Add the new repository to `db/repositories/mod.rs` and `db/mod.rs`.
5. **Frontend Model**: Add the interface to `src/lib/db/models.ts`.

### **Adding a New AI-Powered Command**
1. **Service**: Implement the logic in a new or existing file under `services/`. Use `reqwest` to call `http://localhost:11434/api/chat`.
2. **Command**: Create a `#[tauri::command]` in `commands/`.
3. **Register**: Add the command to the `invoke_handler` in `src-tauri/src/lib.rs`.
4. **Invoke**: Use `dbInvoke` in `src/lib/db/invoke.ts` and `dbService` in `src/lib/db/service.ts` to expose it to React.

### **Updating Job Search Logic**
- To change how jobs are found, modify `src-tauri/src/services/job/adapters/mod.rs`.
- To change the matching algorithm, modify `src-tauri/src/services/job/matching.rs`.

---

## 💡 Development Tips for LLMs
*When working with this codebase, keep these principles in mind:*
- **Local First**: Never assume an internet connection or external API (except DuckDuckGo/Ollama).
- **Privacy**: User data must stay in the SQLite DB or the local filesystem.
- **Resilience**: Always provide fallbacks for AI generation tasks.
- **Repository Pattern**: Always use the repository layer for DB access; never write raw SQL in commands.
- **Type Safety**: Keep Rust structs and TypeScript interfaces in sync.

---

## 🚀 Deployment & Build
- **Dev**: `npm run tauri dev`
- **Build**: `npm run tauri build`
- **Storage**: Data is stored in the system's AppData folder (e.g., `AppData/Roaming/careerforges`).
