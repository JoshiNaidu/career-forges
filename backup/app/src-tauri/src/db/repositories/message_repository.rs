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
pub struct ChatMessage {
    pub id: String,
    pub session_id: String,
    pub role: String,
    pub content: String,
    pub model: Option<String>,
    pub tokens_used: Option<i32>,
    pub created_at: String,
}

pub struct MessageRepository;

impl MessageRepository {
    /*
        CREATE
    */
    pub async fn create(
        pool: &DbPool,
        session_id: &str,
        role: &str,
        content: &str,
        model: Option<String>,
        tokens_used: Option<i32>,
    ) -> DbResult<ChatMessage> {
        let id =
            Uuid::new_v4().to_string();

        let now =
            Utc::now().to_rfc3339();

        execute_with_params(
            pool,
            "
            INSERT INTO messages (
                id,
                session_id,
                role,
                content,
                model,
                tokens_used,
                created_at
            )
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
            ",
            (
                id.clone(),
                session_id.to_string(),
                role.to_string(),
                content.to_string(),
                model,
                tokens_used,
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
    ) -> DbResult<Option<ChatMessage>>
    {
        query_row(
            pool,
            "
            SELECT
                id,
                session_id,
                role,
                content,
                model,
                tokens_used,
                created_at
            FROM messages
            WHERE id = ?1
            AND deleted_at IS NULL
            ",
            [id.to_string()],
            |row| {
                Ok(ChatMessage {
                    id: row.get(0)?,
                    session_id: row.get(1)?,
                    role: row.get(2)?,
                    content: row.get(3)?,
                    model: row.get(4)?,
                    tokens_used: row.get(5)?,
                    created_at: row.get(6)?,
                })
            },
        )
        .await
    }

    /*
        LIST BY SESSION
    */
    pub async fn list_by_session(
        pool: &DbPool,
        session_id: &str,
    ) -> DbResult<Vec<ChatMessage>> {
        query_rows(
            pool,
            "
            SELECT
                id,
                session_id,
                role,
                content,
                model,
                tokens_used,
                created_at
            FROM messages
            WHERE session_id = ?1
            AND deleted_at IS NULL
            ORDER BY created_at ASC
            ",
            [session_id.to_string()],
            |row| {
                Ok(ChatMessage {
                    id: row.get(0)?,
                    session_id: row.get(1)?,
                    role: row.get(2)?,
                    content: row.get(3)?,
                    model: row.get(4)?,
                    tokens_used: row.get(5)?,
                    created_at: row.get(6)?,
                })
            },
        )
        .await
    }

    /*
        LIST RECENT
    */
    pub async fn list_recent(
        pool: &DbPool,
        limit: i64,
    ) -> DbResult<Vec<ChatMessage>> {
        query_rows(
            pool,
            "
            SELECT
                id,
                session_id,
                role,
                content,
                model,
                tokens_used,
                created_at
            FROM messages
            WHERE deleted_at IS NULL
            ORDER BY created_at DESC
            LIMIT ?1
            ",
            [limit],
            |row| {
                Ok(ChatMessage {
                    id: row.get(0)?,
                    session_id: row.get(1)?,
                    role: row.get(2)?,
                    content: row.get(3)?,
                    model: row.get(4)?,
                    tokens_used: row.get(5)?,
                    created_at: row.get(6)?,
                })
            },
        )
        .await
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
            UPDATE messages
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
        DELETE BY SESSION
    */
    pub async fn delete_by_session(
        pool: &DbPool,
        session_id: &str,
    ) -> DbResult<()> {
        let now =
            Utc::now().to_rfc3339();

        execute_with_params(
            pool,
            "
            UPDATE messages
            SET deleted_at = ?1
            WHERE session_id = ?2
            ",
            (
                now.clone(),
                session_id.to_string(),
            ),
        )
        .await?;

        Ok(())
    }

    /*
        COUNT TOKENS
    */
    pub async fn count_tokens_by_session(
        pool: &DbPool,
        session_id: &str,
    ) -> DbResult<i64> {
        query_row(
            pool,
            "
            SELECT COALESCE(
                SUM(tokens_used),
                0
            )
            FROM messages
            WHERE session_id = ?1
            AND deleted_at IS NULL
            ",
            [session_id.to_string()],
            |row| row.get(0),
        )
        .await?
        .ok_or(
            DbError::QueryError(
                "Failed to count tokens"
                    .into(),
            ),
        )
    }
}