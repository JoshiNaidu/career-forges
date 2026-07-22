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
pub struct AIAgent {
    pub id: String,
    pub provider: String,
    pub name: String,
    pub model_id: Option<String>,
    pub display_name: String,
    pub description: Option<String>,
    pub is_installed: bool,
    pub is_available: bool,
    pub is_default: bool,
    pub download_url: Option<String>,
    pub local_path: Option<String>,
    pub version: Option<String>,
    pub size_mb: Option<f64>,
    pub performance_tier: Option<String>,
    pub capabilities: Option<String>,
    pub last_checked: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

pub struct AIAgentRepository;

impl AIAgentRepository {
    /*
        CREATE
    */
    pub async fn create(
        pool: &DbPool,
        provider: &str,
        name: &str,
        display_name: &str,
        is_installed: bool,
    ) -> DbResult<AIAgent> {
        let id =
            Uuid::new_v4().to_string();

        let now =
            Utc::now().to_rfc3339();

        execute_with_params(
            pool,
            "
            INSERT INTO ai_agents (
                id,
                provider,
                name,
                display_name,
                is_installed,
                is_available,
                created_at,
                updated_at
            )
            VALUES (
                ?1,
                ?2,
                ?3,
                ?4,
                ?5,
                1,
                ?6,
                ?7
            )
            ",
            (
    id.clone(),
    provider.to_string(),
    name.to_string(),
    display_name.to_string(),
    if is_installed {
        1
    } else {
        0
    },
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
    ) -> DbResult<Option<AIAgent>>
    {
        query_row(
            pool,
            "
            SELECT
                id,
                provider,
                name,
                model_id,
                display_name,
                description,
                is_installed,
                is_available,
                is_default,
                download_url,
                local_path,
                version,
                size_mb,
                performance_tier,
                capabilities,
                last_checked,
                created_at,
                updated_at
            FROM ai_agents
            WHERE id = ?1
            AND deleted_at IS NULL
            ",
            [id.to_string()],
            |row| {
                Ok(AIAgent {
                    id: row.get(0)?,
                    provider: row.get(1)?,
                    name: row.get(2)?,
                    model_id: row.get(3)?,
                    display_name: row.get(4)?,
                    description: row.get(5)?,
                    is_installed:
                        row.get::<_, i32>(6)?
                            != 0,
                    is_available:
                        row.get::<_, i32>(7)?
                            != 0,
                    is_default:
                        row.get::<_, i32>(8)?
                            != 0,
                    download_url:
                        row.get(9)?,
                    local_path:
                        row.get(10)?,
                    version:
                        row.get(11)?,
                    size_mb:
                        row.get(12)?,
                    performance_tier:
                        row.get(13)?,
                    capabilities:
                        row.get(14)?,
                    last_checked:
                        row.get(15)?,
                    created_at:
                        row.get(16)?,
                    updated_at:
                        row.get(17)?,
                })
            },
        )
        .await
    }

    /*
        GET DEFAULT
    */
    pub async fn get_default(
        pool: &DbPool,
    ) -> DbResult<Option<AIAgent>>
    {
        query_row(
            pool,
            "
            SELECT
                id,
                provider,
                name,
                model_id,
                display_name,
                description,
                is_installed,
                is_available,
                is_default,
                download_url,
                local_path,
                version,
                size_mb,
                performance_tier,
                capabilities,
                last_checked,
                created_at,
                updated_at
            FROM ai_agents
            WHERE is_default = 1
            AND deleted_at IS NULL
            LIMIT 1
            ",
            [],
            |row| {
                Ok(AIAgent {
                    id: row.get(0)?,
                    provider: row.get(1)?,
                    name: row.get(2)?,
                    model_id: row.get(3)?,
                    display_name: row.get(4)?,
                    description: row.get(5)?,
                    is_installed:
                        row.get::<_, i32>(6)?
                            != 0,
                    is_available:
                        row.get::<_, i32>(7)?
                            != 0,
                    is_default:
                        row.get::<_, i32>(8)?
                            != 0,
                    download_url:
                        row.get(9)?,
                    local_path:
                        row.get(10)?,
                    version:
                        row.get(11)?,
                    size_mb:
                        row.get(12)?,
                    performance_tier:
                        row.get(13)?,
                    capabilities:
                        row.get(14)?,
                    last_checked:
                        row.get(15)?,
                    created_at:
                        row.get(16)?,
                    updated_at:
                        row.get(17)?,
                })
            },
        )
        .await
    }

    /*
        LIST BY PROVIDER
    */
    pub async fn list_by_provider(
        pool: &DbPool,
        provider: &str,
    ) -> DbResult<Vec<AIAgent>> {
        query_rows(
            pool,
            "
            SELECT
                id,
                provider,
                name,
                model_id,
                display_name,
                description,
                is_installed,
                is_available,
                is_default,
                download_url,
                local_path,
                version,
                size_mb,
                performance_tier,
                capabilities,
                last_checked,
                created_at,
                updated_at
            FROM ai_agents
            WHERE provider = ?1
            AND deleted_at IS NULL
            ",
            [provider.to_string()],
            |row| {
                Ok(AIAgent {
                    id: row.get(0)?,
                    provider: row.get(1)?,
                    name: row.get(2)?,
                    model_id: row.get(3)?,
                    display_name: row.get(4)?,
                    description: row.get(5)?,
                    is_installed: row.get::<_, i32>(6)? != 0,
                    is_available: row.get::<_, i32>(7)? != 0,
                    is_default: row.get::<_, i32>(8)? != 0,
                    download_url: row.get(9)?,
                    local_path: row.get(10)?,
                    version: row.get(11)?,
                    size_mb: row.get(12)?,
                    performance_tier: row.get(13)?,
                    capabilities: row.get(14)?,
                    last_checked: row.get(15)?,
                    created_at: row.get(16)?,
                    updated_at: row.get(17)?,
                })
            },
        )
        .await
    }

    /*
        LIST INSTALLED
    */
    pub async fn list_installed(
        pool: &DbPool,
    ) -> DbResult<Vec<AIAgent>> {
        query_rows(
            pool,
            "
            SELECT
                id,
                provider,
                name,
                model_id,
                display_name,
                description,
                is_installed,
                is_available,
                is_default,
                download_url,
                local_path,
                version,
                size_mb,
                performance_tier,
                capabilities,
                last_checked,
                created_at,
                updated_at
            FROM ai_agents
            WHERE is_installed = 1
            AND deleted_at IS NULL
            ",
            [],
            |row| {
                Ok(AIAgent {
                    id: row.get(0)?,
                    provider: row.get(1)?,
                    name: row.get(2)?,
                    model_id: row.get(3)?,
                    display_name: row.get(4)?,
                    description: row.get(5)?,
                    is_installed: row.get::<_, i32>(6)? != 0,
                    is_available: row.get::<_, i32>(7)? != 0,
                    is_default: row.get::<_, i32>(8)? != 0,
                    download_url: row.get(9)?,
                    local_path: row.get(10)?,
                    version: row.get(11)?,
                    size_mb: row.get(12)?,
                    performance_tier: row.get(13)?,
                    capabilities: row.get(14)?,
                    last_checked: row.get(15)?,
                    created_at: row.get(16)?,
                    updated_at: row.get(17)?,
                })
            },
        )
        .await
    }

    /*
        LIST ALL
    */
    pub async fn list_all(
        pool: &DbPool,
    ) -> DbResult<Vec<AIAgent>> {
        query_rows(
            pool,
            "
            SELECT
                id,
                provider,
                name,
                model_id,
                display_name,
                description,
                is_installed,
                is_available,
                is_default,
                download_url,
                local_path,
                version,
                size_mb,
                performance_tier,
                capabilities,
                last_checked,
                created_at,
                updated_at
            FROM ai_agents
            WHERE deleted_at IS NULL
            ",
            [],
            |row| {
                Ok(AIAgent {
                    id: row.get(0)?,
                    provider: row.get(1)?,
                    name: row.get(2)?,
                    model_id: row.get(3)?,
                    display_name: row.get(4)?,
                    description: row.get(5)?,
                    is_installed: row.get::<_, i32>(6)? != 0,
                    is_available: row.get::<_, i32>(7)? != 0,
                    is_default: row.get::<_, i32>(8)? != 0,
                    download_url: row.get(9)?,
                    local_path: row.get(10)?,
                    version: row.get(11)?,
                    size_mb: row.get(12)?,
                    performance_tier: row.get(13)?,
                    capabilities: row.get(14)?,
                    last_checked: row.get(15)?,
                    created_at: row.get(16)?,
                    updated_at: row.get(17)?,
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
    ) -> DbResult<AIAgent> {
        let now =
            Utc::now().to_rfc3339();

        let agent =
            Self::get_by_id(pool, id)
                .await?
                .ok_or(
                    DbError::NotFound,
                )?;

        execute_with_params(
            pool,
            "
            UPDATE ai_agents
            SET
                is_default = 0,
                updated_at = ?1
            WHERE provider = ?2
            AND id != ?3
            ",
            (
    now.clone(),
    agent.provider.clone(),
    id.to_string(),
)
        )
        .await?;

        execute_with_params(
            pool,
            "
            UPDATE ai_agents
            SET
                is_default = 1,
                updated_at = ?1
            WHERE id = ?2
            ",
            (
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
        UPDATE INSTALL STATUS
    */
    pub async fn update_installation_status(
        pool: &DbPool,
        id: &str,
        is_installed: bool,
    ) -> DbResult<AIAgent> {
        let now =
            Utc::now().to_rfc3339();

        let value =
            if is_installed {
                1
            } else {
                0
            };

        execute_with_params(
            pool,
            "
            UPDATE ai_agents
            SET
                is_installed = ?1,
                is_available = ?2,
                updated_at = ?3
            WHERE id = ?4
            ",
            (
                value,
                value,
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
        UPDATE AVAILABILITY
    */
    pub async fn update_availability(
        pool: &DbPool,
        id: &str,
        is_available: bool,
    ) -> DbResult<AIAgent> {
        let now =
            Utc::now().to_rfc3339();

        execute_with_params(
            pool,
            "
            UPDATE ai_agents
            SET
                is_available = ?1,
                last_checked = ?2,
                updated_at = ?3
            WHERE id = ?4
            ",
            (
                if is_available {
                    1
                } else {
                    0
                },
                now.clone(),
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
            UPDATE ai_agents
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