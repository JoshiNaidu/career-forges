use crate::migration;

/// All migrations for CareerForges database
pub fn get_migrations() -> Vec<crate::db::migration::Migration> {
    vec![
        migration!(
            "001_initial_schema",
            "
            -- 1. Users
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT NOT NULL UNIQUE,
                name TEXT,
                avatar_url TEXT,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL,
                deleted_at TIMESTAMP
            );

            -- 2. User Profiles
            CREATE TABLE IF NOT EXISTS user_profiles (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL UNIQUE,
                full_name TEXT,
                email TEXT,
                phone TEXT,
                linkedin_url TEXT,
                github_url TEXT,
                portfolio_url TEXT,
                location TEXT,
                summary TEXT,
                skills TEXT,
                experience_json TEXT,
                education_json TEXT,
                certifications_json TEXT,
                projects_json TEXT,
                years_experience REAL,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            -- 3. Sessions (Chat)
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                title TEXT NOT NULL,
                model TEXT NOT NULL,
                mode TEXT DEFAULT 'casual',
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL,
                deleted_at TIMESTAMP,
                job_id TEXT,
                job_description TEXT,
                company TEXT,
                job_title TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            -- 4. Messages
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
                content TEXT NOT NULL,
                model TEXT,
                tokens_used INTEGER,
                created_at TIMESTAMP NOT NULL,
                deleted_at TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
            );

            -- 5. Resumes
            CREATE TABLE IF NOT EXISTS resumes (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                filename TEXT NOT NULL,
                file_path TEXT NOT NULL,
                file_size INTEGER,
                mime_type TEXT,
                parsed_content TEXT,
                hash TEXT UNIQUE,
                is_default BOOLEAN DEFAULT 0,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL,
                deleted_at TIMESTAMP,
                master_resume_json TEXT,
                ats_score REAL,
                ats_strengths TEXT,
                ats_weaknesses TEXT,
                ats_recommendations TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            -- 6. Jobs
            CREATE TABLE IF NOT EXISTS jobs (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                title TEXT NOT NULL,
                company TEXT,
                url TEXT,
                description TEXT,
                requirements TEXT,
                salary_min REAL,
                salary_max REAL,
                location TEXT,
                job_type TEXT,
                posted_date TIMESTAMP,
                status TEXT DEFAULT 'recommended' CHECK(status IN ('recommended', 'saved', 'applied', 'rejected', 'interview')),
                match_score REAL,
                notes TEXT,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL,
                deleted_at TIMESTAMP,
                source TEXT,
                source_url TEXT,
                matched_skills TEXT,
                missing_skills TEXT,
                experience_match BOOLEAN,
                title_match BOOLEAN,
                discovered_at TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            -- 7. Preferences (Generic)
            CREATE TABLE IF NOT EXISTS preferences (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                key TEXT NOT NULL,
                value TEXT,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL,
                UNIQUE(user_id, key),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            -- 8. App Config
            CREATE TABLE IF NOT EXISTS app_config (
                id TEXT PRIMARY KEY,
                key TEXT NOT NULL UNIQUE,
                value TEXT,
                type TEXT,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL
            );

            -- 9. Interview Sessions
            CREATE TABLE IF NOT EXISTS interview_sessions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                session_type TEXT NOT NULL CHECK(session_type IN ('practice', 'realistic', 'technical', 'hr', 'behavioral', 'rapid_fire', 'system-design')),
                job_title TEXT,
                company TEXT,
                score REAL,
                duration_seconds INTEGER,
                feedback TEXT,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL,
                deleted_at TIMESTAMP,
                job_id TEXT,
                job_description TEXT,
                experience_level TEXT,
                personality TEXT,
                resume_context TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            -- 10. Activity Logs
            CREATE TABLE IF NOT EXISTS activity_logs (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                action TEXT NOT NULL,
                entity_type TEXT,
                entity_id TEXT,
                details TEXT,
                created_at TIMESTAMP NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            -- 11. App State
            CREATE TABLE IF NOT EXISTS app_state (
                id TEXT PRIMARY KEY,
                key TEXT NOT NULL UNIQUE,
                value TEXT NOT NULL,
                data_type TEXT,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL
            );

            -- 12. AI Agents
            CREATE TABLE IF NOT EXISTS ai_agents (
                id TEXT PRIMARY KEY,
                provider TEXT NOT NULL CHECK(provider IN ('ollama', 'claude', 'openai', 'anthropic')),
                name TEXT NOT NULL,
                model_id TEXT,
                display_name TEXT NOT NULL,
                description TEXT,
                is_installed BOOLEAN DEFAULT 1,
                is_available BOOLEAN DEFAULT 1,
                is_default BOOLEAN DEFAULT 0,
                download_url TEXT,
                local_path TEXT,
                version TEXT,
                size_mb REAL,
                performance_tier TEXT,
                capabilities TEXT,
                last_checked TIMESTAMP,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL,
                deleted_at TIMESTAMP
            );

            -- 13. Settings
            CREATE TABLE IF NOT EXISTS settings (
                id TEXT PRIMARY KEY,
                key TEXT NOT NULL UNIQUE,
                value TEXT NOT NULL,
                data_type TEXT,
                description TEXT,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL
            );

            -- 14. Generated Documents
            CREATE TABLE IF NOT EXISTS generated_resumes (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                job_id TEXT NOT NULL,
                resume_id TEXT NOT NULL,
                optimized_summary TEXT,
                optimized_skills TEXT,
                optimized_experience TEXT,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
                FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS generated_cover_letters (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                job_id TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
            );

            -- 15. Job Applications
            CREATE TABLE IF NOT EXISTS job_applications (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                job_id TEXT NOT NULL UNIQUE,
                resume_id TEXT,
                cover_letter_id TEXT,
                applied_at TIMESTAMP NOT NULL,
                status TEXT DEFAULT 'applied',
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
                FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE SET NULL,
                FOREIGN KEY (cover_letter_id) REFERENCES generated_cover_letters(id) ON DELETE SET NULL
            );

            -- Indices
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
            CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
            CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
            CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
            CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
            CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_id ON interview_sessions(user_id);
            CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
            CREATE INDEX IF NOT EXISTS idx_app_state_key ON app_state(key);
            CREATE INDEX IF NOT EXISTS idx_ai_agents_provider ON ai_agents(provider);
            CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
            CREATE INDEX IF NOT EXISTS idx_gen_resumes_job_id ON generated_resumes(job_id);
            CREATE INDEX IF NOT EXISTS idx_gen_cv_job_id ON generated_cover_letters(job_id);
            CREATE INDEX IF NOT EXISTS idx_job_apps_job_id ON job_applications(job_id);

            -- Initial Data
            INSERT OR IGNORE INTO users (id, email, name, created_at, updated_at) 
            VALUES ('local-user-id', 'localuser@careerforges.local', 'Local User', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

            INSERT OR IGNORE INTO app_config (id, key, value, type, created_at, updated_at) VALUES
            ('1', 'db_version', '1', 'string', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            ('2', 'app_initialized', 'true', 'boolean', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

            INSERT OR IGNORE INTO app_state (id, key, value, data_type, created_at, updated_at) VALUES
            ('1', 'onboarding_completed', 'false', 'boolean', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            ('2', 'onboarding_step', 'provider_selection', 'string', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            ('3', 'selected_provider', '', 'string', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            ('4', 'selected_model', '', 'string', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            ('5', 'ollama_detected', 'false', 'boolean', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            ('6', 'claude_cli_detected', 'false', 'boolean', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            ('7', 'resume_uploaded', 'false', 'boolean', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            ('8', 'anonymous_installation_id', 'local-install', 'string', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

            INSERT OR IGNORE INTO settings (id, key, value, data_type, description, created_at, updated_at) VALUES
            ('1', 'theme', 'dark', 'string', 'UI theme: dark or light', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            ('2', 'default_interview_mode', 'practice', 'string', 'Default interview mode', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            ('3', 'auto_save_sessions', 'true', 'boolean', 'Automatically save chat sessions', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            ('4', 'session_timeout_minutes', '30', 'number', 'Session timeout in minutes', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            ('5', 'enable_analytics', 'false', 'boolean', 'Enable usage analytics', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            ('6', 'check_for_updates', 'true', 'boolean', 'Check for updates on startup', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            ('7', 'resume_parser_enabled', 'true', 'boolean', 'Enable resume parsing', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            ('8', 'ai_response_streaming', 'true', 'boolean', 'Stream AI responses', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            ('9', 'job_scheduler_enabled', 'true', 'boolean', 'Enable background job search', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            ('10', 'job_scheduler_frequency', '60', 'number', 'Job search frequency in minutes', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
            "
        ),
        migration!(
            "002_job_application_assets",
            "
            ALTER TABLE generated_resumes ADD COLUMN job_title TEXT;
            ALTER TABLE generated_resumes ADD COLUMN original_resume_json TEXT;
            ALTER TABLE generated_resumes ADD COLUMN generated_resume_json TEXT;
            ALTER TABLE generated_resumes ADD COLUMN ats_score REAL;
            ALTER TABLE generated_resumes ADD COLUMN ats_strengths TEXT;
            ALTER TABLE generated_resumes ADD COLUMN ats_weaknesses TEXT;
            ALTER TABLE generated_resumes ADD COLUMN ats_recommendations TEXT;
            ALTER TABLE generated_resumes ADD COLUMN generated_at TIMESTAMP;

            ALTER TABLE generated_cover_letters ADD COLUMN resume_id TEXT;
            ALTER TABLE generated_cover_letters ADD COLUMN job_title TEXT;
            ALTER TABLE generated_cover_letters ADD COLUMN company_name TEXT;
            ALTER TABLE generated_cover_letters ADD COLUMN original_resume_json TEXT;
            ALTER TABLE generated_cover_letters ADD COLUMN generated_at TIMESTAMP;

            ALTER TABLE job_applications ADD COLUMN generated_resume_id TEXT;
            ALTER TABLE job_applications ADD COLUMN generated_cover_letter_id TEXT;

            CREATE INDEX IF NOT EXISTS idx_gen_resumes_user_job ON generated_resumes(user_id, job_id);
            CREATE INDEX IF NOT EXISTS idx_gen_cover_letters_user_job ON generated_cover_letters(user_id, job_id);
            "
        ),
    ]
}
