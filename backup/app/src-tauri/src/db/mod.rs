pub mod error;
pub mod connection;
pub mod migration;
pub mod schema;
pub mod repositories;

pub use connection::{
    init_db,
    get_connection,
    DbPool,
};

pub use error::{
    DbError,
    DbResult,
};

pub use migration::{
    Migration,
    MigrationRunner,
};

pub use schema::get_migrations;

pub use repositories::user_repository::{User, UserRepository};
pub use repositories::session_repository::{ChatSession, SessionRepository};
pub use repositories::message_repository::{ChatMessage, MessageRepository};
pub use repositories::app_state_repository::{AppState, AppStateRepository};
pub use repositories::ai_agent_repository::{AIAgent, AIAgentRepository};
pub use repositories::settings_repository::{Setting, SettingRepository};
pub use repositories::resume_repository::{Resume, ResumeRepository};
pub use repositories::job_repository::{Job, JobRepository};
pub use repositories::activity_log_repository::{ActivityLog, ActivityLogRepository};
pub use repositories::generated_document_repository::{GeneratedResume, GeneratedCoverLetter, GeneratedDocumentRepository};
pub use repositories::application_repository::{JobApplication, ApplicationRepository};
pub use repositories::interview_repository::{InterviewSession, InterviewRepository};