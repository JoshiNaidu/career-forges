use crate::db::connection::{execute_with_params, query_row, query_rows, DbPool};
use crate::db::error::{DbError, DbResult};

use chrono::Utc;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JobApplication {
    pub id: String,
    pub user_id: String,
    pub job_id: String,
    pub resume_id: Option<String>,
    pub cover_letter_id: Option<String>,
    pub generated_resume_id: Option<String>,
    pub generated_cover_letter_id: Option<String>,
    pub applied_at: String,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
}

pub struct ApplicationRepository;

impl ApplicationRepository {
    pub async fn create(
        pool: &DbPool,
        user_id: &str,
        job_id: &str,
        resume_id: Option<String>,
        cover_letter_id: Option<String>,
        generated_resume_id: Option<String>,
        generated_cover_letter_id: Option<String>,
    ) -> DbResult<JobApplication> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339();

        execute_with_params(
            pool,
            "
            INSERT INTO job_applications (
                id,
                user_id,
                job_id,
                resume_id,
                cover_letter_id,
                generated_resume_id,
                generated_cover_letter_id,
                applied_at,
                status,
                created_at,
                updated_at
            )
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
            ON CONFLICT(job_id) DO UPDATE SET
                resume_id = excluded.resume_id,
                cover_letter_id = excluded.cover_letter_id,
                generated_resume_id = excluded.generated_resume_id,
                generated_cover_letter_id = excluded.generated_cover_letter_id,
                applied_at = excluded.applied_at,
                status = excluded.status,
                updated_at = excluded.updated_at
            ",
            (
                id.clone(),
                user_id.to_string(),
                job_id.to_string(),
                resume_id,
                cover_letter_id,
                generated_resume_id,
                generated_cover_letter_id,
                now.clone(),
                "applied".to_string(),
                now.clone(),
                now.clone(),
            ),
        )
        .await?;

        Self::get_by_job_id(pool, job_id)
            .await?
            .ok_or(DbError::NotFound)
    }

    pub async fn get_by_id(
        pool: &DbPool,
        id: &str,
    ) -> DbResult<Option<JobApplication>> {
        query_row(
            pool,
            "
            SELECT
                id, user_id, job_id, resume_id, cover_letter_id,
                generated_resume_id, generated_cover_letter_id,
                applied_at, status, created_at, updated_at
            FROM job_applications
            WHERE id = ?1
            ",
            (id.to_string(),),
            |row| {
                Ok(JobApplication {
                    id: row.get(0)?,
                    user_id: row.get(1)?,
                    job_id: row.get(2)?,
                    resume_id: row.get(3)?,
                    cover_letter_id: row.get(4)?,
                    generated_resume_id: row.get(5)?,
                    generated_cover_letter_id: row.get(6)?,
                    applied_at: row.get(7)?,
                    status: row.get(8)?,
                    created_at: row.get(9)?,
                    updated_at: row.get(10)?,
                })
            },
        )
        .await
    }

    pub async fn get_by_job_id(
        pool: &DbPool,
        job_id: &str,
    ) -> DbResult<Option<JobApplication>> {
        query_row(
            pool,
            "
            SELECT
                id, user_id, job_id, resume_id, cover_letter_id,
                generated_resume_id, generated_cover_letter_id,
                applied_at, status, created_at, updated_at
            FROM job_applications
            WHERE job_id = ?1
            ",
            (job_id.to_string(),),
            |row| {
                Ok(JobApplication {
                    id: row.get(0)?,
                    user_id: row.get(1)?,
                    job_id: row.get(2)?,
                    resume_id: row.get(3)?,
                    cover_letter_id: row.get(4)?,
                    generated_resume_id: row.get(5)?,
                    generated_cover_letter_id: row.get(6)?,
                    applied_at: row.get(7)?,
                    status: row.get(8)?,
                    created_at: row.get(9)?,
                    updated_at: row.get(10)?,
                })
            },
        )
        .await
    }

    pub async fn list_by_user(
        pool: &DbPool,
        user_id: &str,
    ) -> DbResult<Vec<JobApplication>> {
        query_rows(
            pool,
            "
            SELECT
                id, user_id, job_id, resume_id, cover_letter_id,
                generated_resume_id, generated_cover_letter_id,
                applied_at, status, created_at, updated_at
            FROM job_applications
            WHERE user_id = ?1
            ORDER BY applied_at DESC
            ",
            (user_id.to_string(),),
            |row| {
                Ok(JobApplication {
                    id: row.get(0)?,
                    user_id: row.get(1)?,
                    job_id: row.get(2)?,
                    resume_id: row.get(3)?,
                    cover_letter_id: row.get(4)?,
                    generated_resume_id: row.get(5)?,
                    generated_cover_letter_id: row.get(6)?,
                    applied_at: row.get(7)?,
                    status: row.get(8)?,
                    created_at: row.get(9)?,
                    updated_at: row.get(10)?,
                })
            },
        )
        .await
    }

    pub async fn update_status(
        pool: &DbPool,
        id: &str,
        status: &str,
    ) -> DbResult<()> {
        let now = Utc::now().to_rfc3339();
        execute_with_params(
            pool,
            "UPDATE job_applications SET status = ?1, updated_at = ?2 WHERE id = ?3",
            (status.to_string(), now, id.to_string()),
        )
        .await?;
        Ok(())
    }
}
