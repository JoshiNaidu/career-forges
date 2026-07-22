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
pub struct User {
    pub id: String,
    pub email: String,
    pub name: Option<String>,
    pub avatar_url: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

pub struct UserRepository;

impl UserRepository {
    /*
        CREATE
    */
    pub async fn create(
        pool: &DbPool,
        email: &str,
        name: Option<String>,
    ) -> DbResult<User> {
        let id =
            Uuid::new_v4().to_string();

        let now =
            Utc::now().to_rfc3339();

        let name_val =
            name.unwrap_or_default();

        execute_with_params(
            pool,
            "
            INSERT INTO users (
                id,
                email,
                name,
                created_at,
                updated_at
            )
            VALUES (?1, ?2, ?3, ?4, ?5)
            ",
            (
                id.clone(),
                email.to_string(),
                name_val,
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
    ) -> DbResult<Option<User>>
    {
        query_row(
            pool,
            "
            SELECT
                id,
                email,
                name,
                avatar_url,
                created_at,
                updated_at
            FROM users
            WHERE id = ?1
            AND deleted_at IS NULL
            ",
            [id.to_string()],
            |row| {
                Ok(User {
                    id: row.get(0)?,
                    email: row.get(1)?,
                    name: row.get(2)?,
                    avatar_url: row.get(3)?,
                    created_at: row.get(4)?,
                    updated_at: row.get(5)?,
                })
            },
        )
        .await
    }

    /*
        GET BY EMAIL
    */
    pub async fn get_by_email(
        pool: &DbPool,
        email: &str,
    ) -> DbResult<Option<User>>
    {
        query_row(
            pool,
            "
            SELECT
                id,
                email,
                name,
                avatar_url,
                created_at,
                updated_at
            FROM users
            WHERE email = ?1
            AND deleted_at IS NULL
            ",
            [email.to_string()],
            |row| {
                Ok(User {
                    id: row.get(0)?,
                    email: row.get(1)?,
                    name: row.get(2)?,
                    avatar_url: row.get(3)?,
                    created_at: row.get(4)?,
                    updated_at: row.get(5)?,
                })
            },
        )
        .await
    }

    /*
        LIST
    */
    pub async fn list(
        pool: &DbPool,
    ) -> DbResult<Vec<User>> {
        query_rows(
            pool,
            "
            SELECT
                id,
                email,
                name,
                avatar_url,
                created_at,
                updated_at
            FROM users
            WHERE deleted_at IS NULL
            ORDER BY created_at DESC
            ",
            [],
            |row| {
                Ok(User {
                    id: row.get(0)?,
                    email: row.get(1)?,
                    name: row.get(2)?,
                    avatar_url: row.get(3)?,
                    created_at: row.get(4)?,
                    updated_at: row.get(5)?,
                })
            },
        )
        .await
    }

    /*
        UPDATE
    */
    pub async fn update(
        pool: &DbPool,
        id: &str,
        name: Option<String>,
        avatar_url: Option<String>,
    ) -> DbResult<User> {
        let now =
            Utc::now().to_rfc3339();

        let name_val =
            name.unwrap_or_default();

        let avatar_val =
            avatar_url.unwrap_or_default();

        execute_with_params(
            pool,
            "
            UPDATE users
            SET
                name = ?1,
                avatar_url = ?2,
                updated_at = ?3
            WHERE id = ?4
            ",
            (
                name_val,
                avatar_val,
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
            UPDATE users
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
}