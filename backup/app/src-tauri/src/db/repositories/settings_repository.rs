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
pub struct Setting {
    pub id: String,
    pub key: String,
    pub value: String,
    pub data_type: Option<String>,
    pub description: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

pub struct SettingRepository;

impl SettingRepository {
    /*
        SET
    */
    pub async fn set(
        pool: &DbPool,
        key: &str,
        value: &str,
    ) -> DbResult<Setting> {
        let now =
            Utc::now().to_rfc3339();

        /*
            UPDATE FIRST
        */
        let updated =
            execute_with_params(
                pool,
                "
                UPDATE settings
                SET
                    value = ?1,
                    updated_at = ?2
                WHERE key = ?3
                ",
                (
                    value.to_string(),
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
            INSERT INTO settings (
                id,
                key,
                value,
                created_at,
                updated_at
            )
            VALUES (?1, ?2, ?3, ?4, ?5)
            ",
            (
                id.clone(),
                key.to_string(),
                value.to_string(),
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
    ) -> DbResult<Option<Setting>>
    {
        query_row(
            pool,
            "
            SELECT
                id,
                key,
                value,
                data_type,
                description,
                created_at,
                updated_at
            FROM settings
            WHERE key = ?1
            ",
            [key.to_string()],
            |row| {
                Ok(Setting {
                    id: row.get(0)?,
                    key: row.get(1)?,
                    value: row.get(2)?,
                    data_type: row.get(3)?,
                    description: row.get(4)?,
                    created_at: row.get(5)?,
                    updated_at: row.get(6)?,
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
            .map(|setting| {
                setting
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
            .map(|setting| {
                setting.value
            })
            .ok_or(DbError::NotFound)
    }

    /*
        GET NUMBER
    */
    pub async fn get_number(
        pool: &DbPool,
        key: &str,
    ) -> DbResult<f64> {
        Self::get(pool, key)
            .await?
            .map(|setting| {
                setting
                    .value
                    .parse::<f64>()
                    .unwrap_or(0.0)
            })
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
            DELETE FROM settings
            WHERE key = ?1
            ",
            [key.to_string()],
        )
        .await?;

        Ok(())
    }

    /*
        RESET DEFAULTS
    */
    pub async fn reset_to_defaults(
        pool: &DbPool,
    ) -> DbResult<()> {
        let conn =
            get_connection(pool).await?;

        conn.interact(|conn| {
            conn.execute(
                "DELETE FROM settings",
                [],
            )
        })
        .await??;

        Ok(())
    }
}