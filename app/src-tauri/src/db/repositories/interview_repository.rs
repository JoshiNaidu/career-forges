use chrono::Utc;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use crate::db::connection::{execute_with_params, query_row, query_rows, DbPool};
use crate::db::error::{DbError, DbResult};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InterviewSession {
    pub id: String,
    pub user_id: String,
    pub session_type: String,
    pub job_title: Option<String>,
    pub company: Option<String>,
    pub score: Option<f64>,
    pub duration_seconds: Option<i32>,
    pub feedback: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub job_id: Option<String>,
    pub job_description: Option<String>,
    pub experience_level: Option<String>,
    pub personality: Option<String>,
    pub resume_context: Option<String>,
}

pub struct InterviewRepository;

impl InterviewRepository {
    pub async fn create(
        pool: &DbPool,
        user_id: &str,
        session_type: &str,
        job_title: Option<String>,
        company: Option<String>,
        job_id: Option<String>,
        job_description: Option<String>,
        experience_level: Option<String>,
        personality: Option<String>,
        resume_context: Option<String>,
    ) -> DbResult<InterviewSession> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339();

        let clean_session_type = session_type.strip_prefix("interview_").unwrap_or(session_type);

        execute_with_params(
            pool,
            "
            INSERT INTO interview_sessions (
                id, user_id, session_type, job_title, company,
                created_at, updated_at, job_id, job_description,
                experience_level, personality, resume_context
            )
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)
            ",
            (
                id.clone(),
                user_id.to_string(),
                clean_session_type.to_string(),
                job_title,
                company,
                now.clone(),
                now.clone(),
                job_id,
                job_description,
                experience_level,
                personality,
                resume_context,
            ),
        )
        .await?;

        Self::get_by_id(pool, &id)
            .await?
            .ok_or(DbError::NotFound)
    }

    pub async fn get_by_id(
        pool: &DbPool,
        id: &str,
    ) -> DbResult<Option<InterviewSession>> {
        query_row(
            pool,
            "
            SELECT
                id, user_id, session_type, job_title, company, score,
                duration_seconds, feedback, created_at, updated_at,
                job_id, job_description, experience_level, personality, resume_context
            FROM interview_sessions
            WHERE id = ?1 AND deleted_at IS NULL
            ",
            [id.to_string()],
            |row| {
                Ok(InterviewSession {
                    id: row.get(0)?,
                    user_id: row.get(1)?,
                    session_type: row.get(2)?,
                    job_title: row.get(3)?,
                    company: row.get(4)?,
                    score: row.get(5)?,
                    duration_seconds: row.get(6)?,
                    feedback: row.get(7)?,
                    created_at: row.get(8)?,
                    updated_at: row.get(9)?,
                    job_id: row.get(10)?,
                    job_description: row.get(11)?,
                    experience_level: row.get(12)?,
                    personality: row.get(13)?,
                    resume_context: row.get(14)?,
                })
            },
        )
        .await
    }

    pub async fn list_by_user(
        pool: &DbPool,
        user_id: &str,
    ) -> DbResult<Vec<InterviewSession>> {
        query_rows(
            pool,
            "
            SELECT
                id, user_id, session_type, job_title, company, score,
                duration_seconds, feedback, created_at, updated_at,
                job_id, job_description, experience_level, personality, resume_context
            FROM interview_sessions
            WHERE user_id = ?1 AND deleted_at IS NULL
            ORDER BY created_at DESC
            ",
            [user_id.to_string()],
            |row| {
                Ok(InterviewSession {
                    id: row.get(0)?,
                    user_id: row.get(1)?,
                    session_type: row.get(2)?,
                    job_title: row.get(3)?,
                    company: row.get(4)?,
                    score: row.get(5)?,
                    duration_seconds: row.get(6)?,
                    feedback: row.get(7)?,
                    created_at: row.get(8)?,
                    updated_at: row.get(9)?,
                    job_id: row.get(10)?,
                    job_description: row.get(11)?,
                    experience_level: row.get(12)?,
                    personality: row.get(13)?,
                    resume_context: row.get(14)?,
                })
            },
        )
        .await
    }

    pub async fn update_score(
        pool: &DbPool,
        id: &str,
        score: f64,
        feedback: String,
        duration_seconds: i32,
    ) -> DbResult<()> {
        let now = Utc::now().to_rfc3339();

        execute_with_params(
            pool,
            "
            UPDATE interview_sessions
            SET score = ?1, feedback = ?2, duration_seconds = ?3, updated_at = ?4
            WHERE id = ?5
            ",
            (score, feedback, duration_seconds, now, id.to_string()),
        )
        .await?;

        Ok(())
    }

    pub async fn delete(
        pool: &DbPool,
        id: &str,
    ) -> DbResult<()> {
        let now = Utc::now().to_rfc3339();

        execute_with_params(
            pool,
            "UPDATE interview_sessions SET deleted_at = ?1 WHERE id = ?2",
            (now, id.to_string()),
        )
        .await?;

        Ok(())
    }
}
