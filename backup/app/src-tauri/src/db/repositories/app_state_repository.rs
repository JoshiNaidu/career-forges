use chrono::Utc;

use serde::{
    Deserialize,
    Serialize,
};

use uuid::Uuid;

use crate::db::{
    connection::{
        execute_with_params,
        get_connection,
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
pub struct AppState {
    pub id: String,
    pub key: String,
    pub value: String,
    pub data_type: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

pub struct AppStateRepository;

impl AppStateRepository {
    /*
        SET
    */
    pub async fn set(
        pool: &DbPool,
        key: &str,
        value: &str,
        data_type: Option<&str>,
    ) -> DbResult<AppState> {
        let now =
            Utc::now().to_rfc3339();

        /*
            UPDATE FIRST
        */
        let updated =
            execute_with_params(
                pool,
                "
                UPDATE app_state
                SET
                    value = ?1,
                    data_type = ?2,
                    updated_at = ?3
                WHERE key = ?4
                ",
                (
    value.to_string(),
    data_type.unwrap_or("").to_string(),
    now.clone(),
    key.to_string(),
                ),
            )
            .await?;

        /*
            RETURN UPDATED
        */
        if updated > 0 {
            return Self::get(
                pool,
                key,
            )
            .await?
            .ok_or(DbError::NotFound);
        }

        /*
            INSERT NEW
        */
        let id =
            Uuid::new_v4().to_string();

        execute_with_params(
            pool,
            "
            INSERT INTO app_state (
                id,
                key,
                value,
                data_type,
                created_at,
                updated_at
            )
            VALUES (?1, ?2, ?3, ?4, ?5, ?6)
            ",
            (
    id.clone(),
    key.to_string(),
    value.to_string(),
    data_type.unwrap_or("").to_string(),
    now.clone(),
    now.clone(),
            ),
        )
        .await?;

        Self::get(pool, key)
            .await?
            .ok_or(DbError::NotFound)
    }

    /*
        GET
    */
    pub async fn get(
        pool: &DbPool,
        key: &str,
    ) -> DbResult<Option<AppState>>
    {
        query_row(
            pool,
            "
            SELECT
                id,
                key,
                value,
                data_type,
                created_at,
                updated_at
            FROM app_state
            WHERE key = ?1
            ",
            [key.to_string()],
            |row| {
                Ok(AppState {
                    id: row.get(0)?,
                    key: row.get(1)?,
                    value: row.get(2)?,
                    data_type: row.get(3)?,
                    created_at: row.get(4)?,
                    updated_at: row.get(5)?,
                })
            },
        )
        .await
    }

    /*
        GET BOOL
    */
    pub async fn get_bool(
        pool: &DbPool,
        key: &str,
    ) -> DbResult<bool> {
        Self::get(pool, key)
            .await?
            .map(|state| {
                state
                    .value
                    .to_lowercase()
                    == "true"
            })
            .ok_or(DbError::NotFound)
    }

    /*
        GET STRING
    */
    pub async fn get_string(
        pool: &DbPool,
        key: &str,
    ) -> DbResult<String> {
        Self::get(pool, key)
            .await?
            .map(|state| state.value)
            .ok_or(DbError::NotFound)
    }

    /*
        DELETE
    */
    pub async fn delete(
        pool: &DbPool,
        key: &str,
    ) -> DbResult<()> {
        execute_with_params(
            pool,
            "
            DELETE FROM app_state
            WHERE key = ?1
            ",
            [key.to_string()],
        )
        .await?;

        Ok(())
    }

    /*
        LIST ALL
    */
    pub async fn list_all(
        pool: &DbPool,
    ) -> DbResult<Vec<AppState>> {
        query_rows(
            pool,
            "
            SELECT
                id,
                key,
                value,
                data_type,
                created_at,
                updated_at
            FROM app_state
            ",
            [],
            |row| {
                Ok(AppState {
                    id: row.get(0)?,
                    key: row.get(1)?,
                    value: row.get(2)?,
                    data_type: row.get(3)?,
                    created_at: row.get(4)?,
                    updated_at: row.get(5)?,
                })
            },
        )
        .await
    }

    /*
        RESET ALL
    */
    pub async fn reset_all(
        pool: &DbPool,
    ) -> DbResult<()> {
        let conn =
            get_connection(pool).await?;

        conn.interact(|conn| {
            conn.execute(
                "DELETE FROM app_state",
                [],
            )
        })
        .await??;

        Ok(())
    }
}