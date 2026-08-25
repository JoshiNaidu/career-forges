use crate::db::connection::{execute_with_params, query_row, query_rows, DbPool};
use crate::db::error::{DbError, DbResult};

use chrono::Utc;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Resume {
    pub id: String,
    pub user_id: String,
    pub filename: String,
    pub file_path: String,
    pub file_size: Option<i64>,
    pub mime_type: Option<String>,
    pub parsed_content: Option<String>,
    pub hash: Option<String>,
    pub is_default: bool,
    pub created_at: String,
    pub updated_at: String,
    pub master_resume_json: Option<String>,
    pub ats_score: Option<f64>,
    pub ats_strengths: Option<String>,
    pub ats_weaknesses: Option<String>,
    pub ats_recommendations: Option<String>,
}

pub struct ResumeRepository;

impl ResumeRepository {
    /*
        CREATE
    */
    pub async fn create(
        pool: &DbPool,
        user_id: &str,
        filename: &str,
        file_path: &str,
        file_size: Option<i64>,
        mime_type: Option<String>,
        hash: Option<String>,
    ) -> DbResult<Resume> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339();

        execute_with_params(
            pool,
            "
            INSERT INTO resumes (
                id,
                user_id,
                filename,
                file_path,
                file_size,
                mime_type,
                hash,
                created_at,
                updated_at
            )
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
            ",
            (
                id.clone(),
                user_id.to_string(),
                filename.to_string(),
                file_path.to_string(),
                file_size,
                mime_type,
                hash,
                now.clone(),
                now.clone(),
            ),
        )
        .await?;

        Self::get_by_id(pool, &id)
            .await?
            .ok_or(DbError::NotFound)
    }

    /*
        GET BY ID
    */
    pub async fn get_by_id(
        pool: &DbPool,
        id: &str,
    ) -> DbResult<Option<Resume>> {
        query_row(
            pool,
            "
            SELECT
                id,
                user_id,
                filename,
                file_path,
                file_size,
                mime_type,
                parsed_content,
                hash,
                is_default,
                created_at,
                updated_at,
                master_resume_json,
                ats_score,
                ats_strengths,
                ats_weaknesses,
                ats_recommendations
            FROM resumes
            WHERE id = ?1 AND deleted_at IS NULL
            ",
            (id.to_string(),),
            |row| {
                Ok(Resume {
                    id: row.get(0)?,
                    user_id: row.get(1)?,
                    filename: row.get(2)?,
                    file_path: row.get(3)?,
                    file_size: row.get(4)?,
                    mime_type: row.get(5)?,
                    parsed_content: row.get(6)?,
                    hash: row.get(7)?,
                    is_default: row.get::<_, i32>(8)? != 0,
                    created_at: row.get(9)?,
                    updated_at: row.get(10)?,
                    master_resume_json: row.get(11)?,
                    ats_score: row.get(12)?,
                    ats_strengths: row.get(13)?,
                    ats_weaknesses: row.get(14)?,
                    ats_recommendations: row.get(15)?,
                })
            },
        )
        .await
    }

    /*
        LIST BY USER
    */
    pub async fn list_by_user(
        pool: &DbPool,
        user_id: &str,
    ) -> DbResult<Vec<Resume>> {
        query_rows(
            pool,
            "
            SELECT
                id,
                user_id,
                filename,
                file_path,
                file_size,
                mime_type,
                parsed_content,
                hash,
                is_default,
                created_at,
                updated_at,
                master_resume_json,
                ats_score,
                ats_strengths,
                ats_weaknesses,
                ats_recommendations
            FROM resumes
            WHERE user_id = ?1 AND deleted_at IS NULL
            ORDER BY created_at DESC
            ",
            (user_id.to_string(),),
            |row| {
                Ok(Resume {
                    id: row.get(0)?,
                    user_id: row.get(1)?,
                    filename: row.get(2)?,
                    file_path: row.get(3)?,
                    file_size: row.get(4)?,
                    mime_type: row.get(5)?,
                    parsed_content: row.get(6)?,
                    hash: row.get(7)?,
                    is_default: row.get::<_, i32>(8)? != 0,
                    created_at: row.get(9)?,
                    updated_at: row.get(10)?,
                    master_resume_json: row.get(11)?,
                    ats_score: row.get(12)?,
                    ats_strengths: row.get(13)?,
                    ats_weaknesses: row.get(14)?,
                    ats_recommendations: row.get(15)?,
                })
            },
        )
        .await
    }

    /*
        SET DEFAULT
    */
    pub async fn set_default(
        pool: &DbPool,
        id: &str,
        user_id: &str,
    ) -> DbResult<()> {
        // First reset all defaults for this user
        execute_with_params(
            pool,
            "UPDATE resumes SET is_default = 0 WHERE user_id = ?1",
            (user_id.to_string(),),
        )
        .await?;

        // Then set the new default
        execute_with_params(
            pool,
            "UPDATE resumes SET is_default = 1 WHERE id = ?1",
            (id.to_string(),),
        )
        .await?;

        Ok(())
    }

    /*
        GET DEFAULT
    */
    pub async fn get_default(
        pool: &DbPool,
        user_id: &str,
    ) -> DbResult<Option<Resume>> {
        query_row(
            pool,
            "
            SELECT
                id,
                user_id,
                filename,
                file_path,
                file_size,
                mime_type,
                parsed_content,
                hash,
                is_default,
                created_at,
                updated_at,
                master_resume_json,
                ats_score,
                ats_strengths,
                ats_weaknesses,
                ats_recommendations
            FROM resumes
            WHERE user_id = ?1 AND is_default = 1 AND deleted_at IS NULL
            ",
            (user_id.to_string(),),
            |row| {
                Ok(Resume {
                    id: row.get(0)?,
                    user_id: row.get(1)?,
                    filename: row.get(2)?,
                    file_path: row.get(3)?,
                    file_size: row.get(4)?,
                    mime_type: row.get(5)?,
                    parsed_content: row.get(6)?,
                    hash: row.get(7)?,
                    is_default: row.get::<_, i32>(8)? != 0,
                    created_at: row.get(9)?,
                    updated_at: row.get(10)?,
                    master_resume_json: row.get(11)?,
                    ats_score: row.get(12)?,
                    ats_strengths: row.get(13)?,
                    ats_weaknesses: row.get(14)?,
                    ats_recommendations: row.get(15)?,
                })
            },
        )
        .await
    }

    /*
        UPDATE PARSED CONTENT
    */
    pub async fn update_parsed_content(
        pool: &DbPool,
        id: &str,
        content: &str,
    ) -> DbResult<()> {
        let now = Utc::now().to_rfc3339();

        execute_with_params(
            pool,
            "UPDATE resumes SET parsed_content = ?1, updated_at = ?2 WHERE id = ?3",
            (content.to_string(), now, id.to_string()),
        )
        .await?;

        Ok(())
    }

    /*
        UPDATE EXTENDED INFO
    */
    pub async fn update_extended_info(
        pool: &DbPool,
        id: &str,
        master_resume_json: &str,
        ats_score: f64,
        ats_strengths: &str,
        ats_weaknesses: &str,
        ats_recommendations: &str,
    ) -> DbResult<()> {
        let now = Utc::now().to_rfc3339();

        execute_with_params(
            pool,
            "
            UPDATE resumes 
            SET 
                master_resume_json = ?1, 
                ats_score = ?2, 
                ats_strengths = ?3, 
                ats_weaknesses = ?4, 
                ats_recommendations = ?5, 
                updated_at = ?6 
            WHERE id = ?7
            ",
            (
                master_resume_json.to_string(),
                ats_score,
                ats_strengths.to_string(),
                ats_weaknesses.to_string(),
                ats_recommendations.to_string(),
                now,
                id.to_string(),
            ),
        )
        .await?;

        Ok(())
    }

    /*
        DELETE
    */
    pub async fn delete(
        pool: &DbPool,
        id: &str,
    ) -> DbResult<()> {
        let now = Utc::now().to_rfc3339();

        execute_with_params(
            pool,
            "UPDATE resumes SET deleted_at = ?1 WHERE id = ?2",
            (now, id.to_string()),
        )
        .await?;

        Ok(())
    }
}
