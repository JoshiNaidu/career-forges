use crate::db::connection::{execute_with_params, query_row, query_rows, DbPool};
use crate::db::error::DbResult;

use chrono::Utc;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BackgroundTask {
    pub id: String,
    pub task_type: String,
    pub status: String,
    pub label: String,
    pub entity_type: Option<String>,
    pub entity_id: Option<String>,
    pub progress: i64,
    pub total_steps: Option<i64>,
    pub current_step: Option<i64>,
    pub error_message: Option<String>,
    pub result_data: Option<String>,
    pub created_at: String,
    pub started_at: Option<String>,
    pub completed_at: Option<String>,
    pub updated_at: String,
}

pub struct BackgroundTaskRepository;

impl BackgroundTaskRepository {
    pub async fn create(
        pool: &DbPool,
        task_type: &str,
        label: &str,
        entity_type: Option<String>,
        entity_id: Option<String>,
        total_steps: Option<i64>,
    ) -> DbResult<BackgroundTask> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339();

        execute_with_params(
            pool,
            "
            INSERT INTO background_tasks (
                id, task_type, status, label,
                entity_type, entity_id,
                progress, total_steps, current_step,
                error_message, result_data,
                created_at, started_at, completed_at, updated_at
            )
            VALUES (?1, ?2, 'pending', ?3, ?4, ?5, 0, ?6, NULL, NULL, NULL, ?7, NULL, NULL, ?7)
            ",
            (
                id.clone(),
                task_type.to_string(),
                label.to_string(),
                entity_type.clone(),
                entity_id.clone(),
                total_steps,
                now.clone(),
            ),
        )
        .await?;

        Ok(BackgroundTask {
            id,
            task_type: task_type.to_string(),
            status: "pending".to_string(),
            label: label.to_string(),
            entity_type,
            entity_id,
            progress: 0,
            total_steps,
            current_step: None,
            error_message: None,
            result_data: None,
            created_at: now,
            started_at: None,
            completed_at: None,
            updated_at: now,
        })
    }

    pub async fn get_by_id(pool: &DbPool, id: &str) -> DbResult<Option<BackgroundTask>> {
        query_row(
            pool,
            "
            SELECT id, task_type, status, label, entity_type, entity_id,
                   progress, total_steps, current_step, error_message, result_data,
                   created_at, started_at, completed_at, updated_at
            FROM background_tasks WHERE id = ?1
            ",
            (id.to_string(),),
            |row| {
                Ok(BackgroundTask {
                    id: row.get(0)?,
                    task_type: row.get(1)?,
                    status: row.get(2)?,
                    label: row.get(3)?,
                    entity_type: row.get(4)?,
                    entity_id: row.get(5)?,
                    progress: row.get(6)?,
                    total_steps: row.get(7)?,
                    current_step: row.get(8)?,
                    error_message: row.get(9)?,
                    result_data: row.get(10)?,
                    created_at: row.get(11)?,
                    started_at: row.get(12)?,
                    completed_at: row.get(13)?,
                    updated_at: row.get(14)?,
                })
            },
        )
        .await
    }

    pub async fn list_by_status(pool: &DbPool, status: &str) -> DbResult<Vec<BackgroundTask>> {
        query_rows(
            pool,
            "
            SELECT id, task_type, status, label, entity_type, entity_id,
                   progress, total_steps, current_step, error_message, result_data,
                   created_at, started_at, completed_at, updated_at
            FROM background_tasks WHERE status = ?1
            ORDER BY created_at DESC
            ",
            (status.to_string(),),
            Self::map_row,
        )
        .await
    }

    pub async fn list_recent(pool: &DbPool, limit: i64) -> DbResult<Vec<BackgroundTask>> {
        query_rows(
            pool,
            "
            SELECT id, task_type, status, label, entity_type, entity_id,
                   progress, total_steps, current_step, error_message, result_data,
                   created_at, started_at, completed_at, updated_at
            FROM background_tasks
            ORDER BY created_at DESC
            LIMIT ?1
            ",
            (limit,),
            Self::map_row,
        )
        .await
    }

    pub async fn list_by_entity(
        pool: &DbPool,
        entity_type: &str,
        entity_id: &str,
    ) -> DbResult<Vec<BackgroundTask>> {
        query_rows(
            pool,
            "
            SELECT id, task_type, status, label, entity_type, entity_id,
                   progress, total_steps, current_step, error_message, result_data,
                   created_at, started_at, completed_at, updated_at
            FROM background_tasks
            WHERE entity_type = ?1 AND entity_id = ?2
            ORDER BY created_at DESC
            ",
            (entity_type.to_string(), entity_id.to_string()),
            Self::map_row,
        )
        .await
    }

    pub async fn update_status(
        pool: &DbPool,
        id: &str,
        status: &str,
    ) -> DbResult<()> {
        let now = Utc::now().to_rfc3339();
        let started_at = if status == "running" { Some(now.clone()) } else { None };
        let completed_at = if status == "completed" || status == "failed" || status == "cancelled" {
            Some(now.clone())
        } else {
            None
        };

        if started_at.is_some() {
            execute_with_params(
                pool,
                "UPDATE background_tasks SET status = ?1, started_at = ?2, updated_at = ?2 WHERE id = ?3",
                (status.to_string(), now, id.to_string()),
            )
            .await?;
        } else if completed_at.is_some() {
            execute_with_params(
                pool,
                "UPDATE background_tasks SET status = ?1, completed_at = ?2, updated_at = ?2 WHERE id = ?3",
                (status.to_string(), now, id.to_string()),
            )
            .await?;
        } else {
            execute_with_params(
                pool,
                "UPDATE background_tasks SET status = ?1, updated_at = ?2 WHERE id = ?3",
                (status.to_string(), now, id.to_string()),
            )
            .await?;
        }

        Ok(())
    }

    pub async fn update_progress(
        pool: &DbPool,
        id: &str,
        progress: i64,
        current_step: Option<i64>,
    ) -> DbResult<()> {
        let now = Utc::now().to_rfc3339();
        execute_with_params(
            pool,
            "UPDATE background_tasks SET progress = ?1, current_step = ?2, updated_at = ?3 WHERE id = ?4",
            (progress, current_step, now, id.to_string()),
        )
        .await?;
        Ok(())
    }

    pub async fn set_error(pool: &DbPool, id: &str, error: &str) -> DbResult<()> {
        let now = Utc::now().to_rfc3339();
        execute_with_params(
            pool,
            "UPDATE background_tasks SET status = 'failed', error_message = ?1, completed_at = ?2, updated_at = ?2 WHERE id = ?3",
            (error.to_string(), now, id.to_string()),
        )
        .await?;
        Ok(())
    }

    pub async fn set_result(pool: &DbPool, id: &str, result_data: &str) -> DbResult<()> {
        let now = Utc::now().to_rfc3339();
        execute_with_params(
            pool,
            "UPDATE background_tasks SET status = 'completed', result_data = ?1, progress = 100, completed_at = ?2, updated_at = ?2 WHERE id = ?3",
            (result_data.to_string(), now, id.to_string()),
        )
        .await?;
        Ok(())
    }

    pub async fn delete(pool: &DbPool, id: &str) -> DbResult<()> {
        execute_with_params(
            pool,
            "DELETE FROM background_tasks WHERE id = ?1",
            (id.to_string(),),
        )
        .await?;
        Ok(())
    }

    pub async fn count_by_status(pool: &DbPool, status: &str) -> DbResult<i64> {
        query_row(
            pool,
            "SELECT COUNT(*) FROM background_tasks WHERE status = ?1",
            (status.to_string(),),
            |row| row.get(0),
        )
        .await
        .map(|opt| opt.unwrap_or(0))
    }

    fn map_row(row: &rusqlite::Row) -> rusqlite::Result<BackgroundTask> {
        Ok(BackgroundTask {
            id: row.get(0)?,
            task_type: row.get(1)?,
            status: row.get(2)?,
            label: row.get(3)?,
            entity_type: row.get(4)?,
            entity_id: row.get(5)?,
            progress: row.get(6)?,
            total_steps: row.get(7)?,
            current_step: row.get(8)?,
            error_message: row.get(9)?,
            result_data: row.get(10)?,
            created_at: row.get(11)?,
            started_at: row.get(12)?,
            completed_at: row.get(13)?,
            updated_at: row.get(14)?,
        })
    }
}
