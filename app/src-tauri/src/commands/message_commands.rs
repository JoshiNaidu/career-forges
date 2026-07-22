use tauri::{
    AppHandle,
    Manager,
};

use crate::db::{
    ChatMessage,
    DbPool,
    MessageRepository,
};

/*
    CREATE MESSAGE
*/
#[tauri::command]
pub async fn db_create_message(
    app: AppHandle,
    session_id: String,
    role: String,
    content: String,
    model: Option<String>,
    tokens_used: Option<i32>,
) -> Result<ChatMessage, String>
{
    let pool =
        app.state::<DbPool>();

    MessageRepository::create(
        &pool,
        &session_id,
        &role,
        &content,
        model,
        tokens_used,
    )
    .await
    .map_err(|e| e.to_string())
}

/*
    GET MESSAGE
*/
#[tauri::command]
pub async fn db_get_message(
    app: AppHandle,
    id: String,
) -> Result<Option<ChatMessage>, String>
{
    let pool =
        app.state::<DbPool>();

    MessageRepository::get_by_id(
        &pool,
        &id,
    )
    .await
    .map_err(|e| e.to_string())
}

/*
    LIST SESSION MESSAGES
*/
#[tauri::command]
pub async fn db_list_session_messages(
    app: AppHandle,
    session_id: String,
) -> Result<Vec<ChatMessage>, String> {
    let pool =
        app.state::<DbPool>();

    MessageRepository::list_by_session(
        &pool,
        &session_id,
    )
    .await
    .map_err(|e| e.to_string())
}

/*
    LIST RECENT MESSAGES
*/
#[tauri::command]
pub async fn db_list_recent_messages(
    app: AppHandle,
    limit: i64,
) -> Result<Vec<ChatMessage>, String> {
    let pool =
        app.state::<DbPool>();

    MessageRepository::list_recent(
        &pool,
        limit,
    )
    .await
    .map_err(|e| e.to_string())
}

/*
    DELETE MESSAGE
*/
#[tauri::command]
pub async fn db_delete_message(
    app: AppHandle,
    id: String,
) -> Result<(), String> {
    let pool =
        app.state::<DbPool>();

    MessageRepository::delete(
        &pool,
        &id,
    )
    .await
    .map_err(|e| e.to_string())
}

/*
    COUNT TOKENS
*/
#[tauri::command]
pub async fn db_count_session_tokens(
    app: AppHandle,
    session_id: String,
) -> Result<i64, String> {
    let pool =
        app.state::<DbPool>();

    MessageRepository::count_tokens_by_session(
        &pool,
        &session_id,
    )
    .await
    .map_err(|e| e.to_string())
}