use chrono::Utc;

use serde::{
    Deserialize,
    Serialize,
};

use uuid::Uuid;

use crate::db::{
    connection::{
        execute_with_params,
        query_row,
        query_rows,
        DbPool,
    },
    error::{
        DbError,
        DbResult,
    },
};

#[derive(
    Debug,
    Clone,
    Serialize,
    Deserialize,
)]
pub struct ChatSession {
    pub id: String,
    pub user_id: String,
    pub title: String,
    pub model: String,
    pub mode: String,
    pub created_at: String,
    pub updated_at: String,
    pub job_id: Option<String>,
    pub job_description: Option<String>,
    pub company: Option<String>,
    pub job_title: Option<String>,
}

pub struct SessionRepository;

impl SessionRepository {
    /*
        CREATE
    */
    pub async fn create(
        pool: &DbPool,
        user_id: &str,
        title: &str,
        model: &str,
        mode: &str,
        job_id: Option<String>,
        job_description: Option<String>,
        company: Option<String>,
        job_title: Option<String>,
    ) -> DbResult<ChatSession> {
        let id =
            Uuid::new_v4().to_string();

        let now =
            Utc::now().to_rfc3339();

        execute_with_params(
            pool,
            "
            INSERT INTO sessions (
                id,
                user_id,
                title,
                model,
                mode,
                created_at,
                updated_at,
                job_id,
                job_description,
                company,
                job_title
            )
            VALUES (
                ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11
            )
            ",
            (
                id.clone(),
                user_id.to_string(),
                title.to_string(),
                model.to_string(),
                mode.to_string(),
                now.clone(),
                now.clone(),
                job_id,
                job_description,
                company,
                job_title,
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
    ) -> DbResult<Option<ChatSession>>
    {
        query_row(
            pool,
            "
            SELECT
                id,
                user_id,
                title,
                model,
                mode,
                created_at,
                updated_at,
                job_id,
                job_description,
                company,
                job_title
            FROM sessions
            WHERE id = ?1
            AND deleted_at IS NULL
            ",
            [id.to_string()],
            |row| {
                Ok(ChatSession {
                    id: row.get(0)?,
                    user_id: row.get(1)?,
                    title: row.get(2)?,
                    model: row.get(3)?,
                    mode: row.get(4)?,
                    created_at: row.get(5)?,
                    updated_at: row.get(6)?,
                    job_id: row.get(7)?,
                    job_description: row.get(8)?,
                    company: row.get(9)?,
                    job_title: row.get(10)?,
                })
            },
        )
        .await
    }

    /*
        UPDATE TITLE
    */
    pub async fn update_title(
        pool: &DbPool,
        id: &str,
        title: &str,
    ) -> DbResult<ChatSession> {
        let now =
            Utc::now().to_rfc3339();

        execute_with_params(
            pool,
            "
            UPDATE sessions
            SET
                title = ?1,
                updated_at = ?2
            WHERE id = ?3
            ",
(
    title.to_string(),
    now.clone(),
    id.to_string(),
),
        )
        .await?;

        Self::get_by_id(pool, id)
            .await?
            .ok_or(DbError::NotFound)
    }

    /*
        DELETE
    */
    pub async fn delete(
        pool: &DbPool,
        id: &str,
    ) -> DbResult<()> {
        let now =
            Utc::now().to_rfc3339();

        execute_with_params(
            pool,
            "
            UPDATE sessions
            SET deleted_at = ?1
            WHERE id = ?2
            ",
(
    now.clone(),
    id.to_string(),
),
        )
        .await?;

        Ok(())
    }

    /*
        LIST BY USER
    */
    pub async fn list_by_user(
        pool: &DbPool,
        user_id: &str,
    ) -> DbResult<Vec<ChatSession>> {
        query_rows(
            pool,
            "
            SELECT
                id,
                user_id,
                title,
                model,
                mode,
                created_at,
                updated_at,
                job_id,
                job_description,
                company,
                job_title
            FROM sessions
            WHERE user_id = ?1
            AND deleted_at IS NULL
            ORDER BY updated_at DESC
            ",
            [user_id.to_string()],
            |row| {
                Ok(ChatSession {
                    id: row.get(0)?,
                    user_id: row.get(1)?,
                    title: row.get(2)?,
                    model: row.get(3)?,
                    mode: row.get(4)?,
                    created_at: row.get(5)?,
                    updated_at: row.get(6)?,
                    job_id: row.get(7)?,
                    job_description: row.get(8)?,
                    company: row.get(9)?,
                    job_title: row.get(10)?,
                })
            },
        )
        .await
    }

    /*
        COUNT BY USER
    */
    pub async fn count_by_user(
        pool: &DbPool,
        user_id: &str,
    ) -> DbResult<i32> {
        query_row(
            pool,
            "
            SELECT COUNT(*)
            FROM sessions
            WHERE user_id = ?1
            AND deleted_at IS NULL
            ",
            [user_id.to_string()],
            |row| row.get(0),
        )
        .await?
        .ok_or(
            DbError::QueryError(
                "Failed to count sessions"
                    .into(),
            ),
        )
    }
}