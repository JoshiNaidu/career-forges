use tauri::{AppHandle, Emitter, Manager};
use crate::db::{BackgroundTask, BackgroundTaskRepository, DbPool};

#[tauri::command]
pub async fn db_create_background_task(
    app: AppHandle,
    task_type: String,
    label: String,
    entity_type: Option<String>,
    entity_id: Option<String>,
    total_steps: Option<i64>,
) -> Result<BackgroundTask, String> {
    let pool = app.state::<DbPool>();
    let task = BackgroundTaskRepository::create(
        &pool, &task_type, &label, entity_type, entity_id, total_steps,
    )
    .await
    .map_err(|e| e.to_string())?;

    let _ = app.emit("background-task-created", &task);
    Ok(task)
}

#[tauri::command]
pub async fn db_get_background_task(
    app: AppHandle,
    id: String,
) -> Result<Option<BackgroundTask>, String> {
    let pool = app.state::<DbPool>();
    BackgroundTaskRepository::get_by_id(&pool, &id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn db_list_background_tasks_by_status(
    app: AppHandle,
    status: String,
) -> Result<Vec<BackgroundTask>, String> {
    let pool = app.state::<DbPool>();
    BackgroundTaskRepository::list_by_status(&pool, &status)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn db_list_recent_background_tasks(
    app: AppHandle,
    limit: i64,
) -> Result<Vec<BackgroundTask>, String> {
    let pool = app.state::<DbPool>();
    BackgroundTaskRepository::list_recent(&pool, limit)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn db_list_background_tasks_by_entity(
    app: AppHandle,
    entity_type: String,
    entity_id: String,
) -> Result<Vec<BackgroundTask>, String> {
    let pool = app.state::<DbPool>();
    BackgroundTaskRepository::list_by_entity(&pool, &entity_type, &entity_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn db_update_background_task_status(
    app: AppHandle,
    id: String,
    status: String,
) -> Result<(), String> {
    let pool = app.state::<DbPool>();
    BackgroundTaskRepository::update_status(&pool, &id, &status)
        .await
        .map_err(|e| e.to_string())?;

    let task = BackgroundTaskRepository::get_by_id(&pool, &id)
        .await
        .map_err(|e| e.to_string())?;
    if let Some(t) = task {
        let _ = app.emit("background-task-updated", &t);
    }
    Ok(())
}

#[tauri::command]
pub async fn db_update_background_task_progress(
    app: AppHandle,
    id: String,
    progress: i64,
    current_step: Option<i64>,
) -> Result<(), String> {
    let pool = app.state::<DbPool>();
    BackgroundTaskRepository::update_progress(&pool, &id, progress, current_step)
        .await
        .map_err(|e| e.to_string())?;

    let task = BackgroundTaskRepository::get_by_id(&pool, &id)
        .await
        .map_err(|e| e.to_string())?;
    if let Some(t) = task {
        let _ = app.emit("background-task-updated", &t);
    }
    Ok(())
}

#[tauri::command]
pub async fn db_cancel_background_task(
    app: AppHandle,
    id: String,
) -> Result<(), String> {
    let pool = app.state::<DbPool>();
    BackgroundTaskRepository::update_status(&pool, &id, "cancelled")
        .await
        .map_err(|e| e.to_string())?;

    let task = BackgroundTaskRepository::get_by_id(&pool, &id)
        .await
        .map_err(|e| e.to_string())?;
    if let Some(t) = task {
        let _ = app.emit("background-task-updated", &t);
    }
    Ok(())
}

#[tauri::command]
pub async fn db_retry_background_task(
    app: AppHandle,
    id: String,
) -> Result<(), String> {
    let pool = app.state::<DbPool>();
    BackgroundTaskRepository::update_status(&pool, &id, "pending")
        .await
        .map_err(|e| e.to_string())?;

    let task = BackgroundTaskRepository::get_by_id(&pool, &id)
        .await
        .map_err(|e| e.to_string())?;
    if let Some(t) = task {
        let _ = app.emit("background-task-updated", &t);
    }
    Ok(())
}

#[tauri::command]
pub async fn db_delete_background_task(
    app: AppHandle,
    id: String,
) -> Result<(), String> {
    let pool = app.state::<DbPool>();
    BackgroundTaskRepository::delete(&pool, &id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn db_count_background_tasks_by_status(
    app: AppHandle,
    status: String,
) -> Result<i64, String> {
    let pool = app.state::<DbPool>();
    BackgroundTaskRepository::count_by_status(&pool, &status)
        .await
        .map_err(|e| e.to_string())
}
