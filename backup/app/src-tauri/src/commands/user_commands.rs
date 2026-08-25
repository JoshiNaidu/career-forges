use tauri::{AppHandle, Manager};
use crate::db::{UserRepository, DbPool, User};

#[tauri::command]
pub async fn db_create_user(
    app: AppHandle,
    email: String,
    name: Option<String>,
) -> Result<User, String> {
    let pool = app.state::<DbPool>();

    UserRepository::create(&pool, &email, name)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn db_get_user(
    app: AppHandle,
    id: String,
) -> Result<Option<User>, String> {
    let pool = app.state::<DbPool>();

    UserRepository::get_by_id(&pool, &id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn db_get_user_by_email(
    app: AppHandle,
    email: String,
) -> Result<Option<User>, String> {
    let pool = app.state::<DbPool>();

    UserRepository::get_by_email(&pool, &email)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn db_list_users(
    app: AppHandle,
) -> Result<Vec<User>, String> {
    let pool = app.state::<DbPool>();

    UserRepository::list(&pool)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn db_update_user(
    app: AppHandle,
    id: String,
    name: Option<String>,
    avatar_url: Option<String>,
) -> Result<User, String> {
    let pool = app.state::<DbPool>();

    UserRepository::update(&pool, &id, name, avatar_url)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn db_delete_user(
    app: AppHandle,
    id: String,
) -> Result<(), String> {
    let pool = app.state::<DbPool>();

    UserRepository::delete(&pool, &id)
        .await
        .map_err(|e| e.to_string())
}