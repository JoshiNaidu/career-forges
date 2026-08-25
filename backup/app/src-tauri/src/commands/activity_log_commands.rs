use tauri::{AppHandle, Manager};
use crate::db::{ActivityLog, ActivityLogRepository, DbPool};

#[tauri::command]
pub async fn db_create_activity_log(
    app: AppHandle,
    user_id: Option<String>,
    action: String,
    entity_type: Option<String>,
    entity_id: Option<String>,
    details: Option<String>,
) -> Result<ActivityLog, String> {
    let pool = app.state::<DbPool>();

    ActivityLogRepository::create(
        &pool,
        user_id,
        &action,
        entity_type,
        entity_id,
        details,
    )
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn db_list_activity_logs(
    app: AppHandle,
    user_id: String,
    limit: i64,
) -> Result<Vec<ActivityLog>, String> {
    let pool = app.state::<DbPool>();

    ActivityLogRepository::list_by_user(&pool, &user_id, limit)
        .await
        .map_err(|e| e.to_string())
}
