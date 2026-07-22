use tauri::{
    AppHandle,
    Manager,
};

use crate::db::{
    ChatSession,
    DbPool,
    SessionRepository,
};

/*
    CREATE SESSION
*/
#[tauri::command]
pub async fn db_create_session(
    app: AppHandle,
    user_id: String,
    title: String,
    model: String,
    mode: String,
    job_id: Option<String>,
    job_description: Option<String>,
    company: Option<String>,
    job_title: Option<String>,
) -> Result<ChatSession, String>
{
    let pool =
        app.state::<DbPool>();

    SessionRepository::create(
        &pool,
        &user_id,
        &title,
        &model,
        &mode,
        job_id,
        job_description,
        company,
        job_title,
    )
    .await
    .map_err(|e| e.to_string())
}

/*
    GET SESSION
*/
#[tauri::command]
pub async fn db_get_session(
    app: AppHandle,
    id: String,
) -> Result<Option<ChatSession>, String>
{
    let pool =
        app.state::<DbPool>();

    SessionRepository::get_by_id(
        &pool,
        &id,
    )
    .await
    .map_err(|e| e.to_string())
}

/*
    LIST USER SESSIONS
*/
#[tauri::command]
pub async fn db_list_user_sessions(
    app: AppHandle,
    user_id: String,
) -> Result<Vec<ChatSession>, String> {
    let pool =
        app.state::<DbPool>();

    SessionRepository::list_by_user(
        &pool,
        &user_id,
    )
    .await
    .map_err(|e| e.to_string())
}

/*
    UPDATE TITLE
*/
#[tauri::command]
pub async fn db_update_session_title(
    app: AppHandle,
    id: String,
    title: String,
) -> Result<ChatSession, String>
{
    let pool =
        app.state::<DbPool>();

    SessionRepository::update_title(
        &pool,
        &id,
        &title,
    )
    .await
    .map_err(|e| e.to_string())
}

/*
    DELETE SESSION
*/
#[tauri::command]
pub async fn db_delete_session(
    app: AppHandle,
    id: String,
) -> Result<(), String> {
    let pool =
        app.state::<DbPool>();

    SessionRepository::delete(
        &pool,
        &id,
    )
    .await
    .map_err(|e| e.to_string())
}

/*
    COUNT USER SESSIONS
*/
#[tauri::command]
pub async fn db_count_user_sessions(
    app: AppHandle,
    user_id: String,
) -> Result<i32, String> {
    let pool =
        app.state::<DbPool>();

    SessionRepository::count_by_user(
        &pool,
        &user_id,
    )
    .await
    .map_err(|e| e.to_string())
}