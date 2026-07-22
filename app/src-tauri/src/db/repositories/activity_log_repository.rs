use crate::db::connection::{execute_with_params, query_rows, DbPool};
use crate::db::error::DbResult;

use chrono::Utc;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivityLog {
    pub id: String,
    pub user_id: Option<String>,
    pub action: String,
    pub entity_type: Option<String>,
    pub entity_id: Option<String>,
    pub details: Option<String>,
    pub created_at: String,
}

pub struct ActivityLogRepository;

impl ActivityLogRepository {
    /*
        CREATE
    */
    pub async fn create(
        pool: &DbPool,
        user_id: Option<String>,
        action: &str,
        entity_type: Option<String>,
        entity_id: Option<String>,
        details: Option<String>,
    ) -> DbResult<ActivityLog> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339();

        execute_with_params(
            pool,
            "
            INSERT INTO activity_logs (
                id,
                user_id,
                action,
                entity_type,
                entity_id,
                details,
                created_at
            )
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
            ",
            (
                id.clone(),
                user_id.clone(),
                action.to_string(),
                entity_type.clone(),
                entity_id.clone(),
                details.clone(),
                now.clone(),
            ),
        )
        .await?;

        Ok(ActivityLog {
            id,
            user_id,
            action: action.to_string(),
            entity_type,
            entity_id,
            details,
            created_at: now,
        })
    }

    /*
        LIST BY USER
    */
    pub async fn list_by_user(
        pool: &DbPool,
        user_id: &str,
        limit: i64,
    ) -> DbResult<Vec<ActivityLog>> {
        query_rows(
            pool,
            "
            SELECT
                id,
                user_id,
                action,
                entity_type,
                entity_id,
                details,
                created_at
            FROM activity_logs
            WHERE user_id = ?1
            ORDER BY created_at DESC
            LIMIT ?2
            ",
            (user_id.to_string(), limit),
            |row| {
                Ok(ActivityLog {
                    id: row.get(0)?,
                    user_id: row.get(1)?,
                    action: row.get(2)?,
                    entity_type: row.get(3)?,
                    entity_id: row.get(4)?,
                    details: row.get(5)?,
                    created_at: row.get(6)?,
                })
            },
        )
        .await
    }
}
