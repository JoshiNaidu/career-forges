/**
 * Settings Tauri Commands
 * Handles user preferences and application configuration
 */

use tauri::AppHandle;
use crate::db::{SettingRepository, DbPool};
use crate::db::Setting;
use tauri::Manager;
// use crate::db::connection::get_db_size;

/**
 * Get setting by key
 */
#[tauri::command]
pub async fn db_get_setting(
    app: AppHandle,
    key: String,
) -> Result<Option<Setting>, String> {
    let pool = app.state::<DbPool>();
    
    log::debug!("Getting setting: {}", key);
    
    SettingRepository::get(&pool, &key)
        .await
        .map_err(|e| {
            log::error!("Failed to get setting {}: {}", key, e);
            format!("Failed to get setting: {}", e)
        })
}

/**
 * Set setting key-value pair (upsert)
 */
#[tauri::command]
pub async fn db_set_setting(
    app: AppHandle,
    key: String,
    value: String,
) -> Result<Setting, String> {
    let pool = app.state::<DbPool>();
    
    log::debug!("Setting: {} = {}", key, value);
    
    SettingRepository::set(&pool, &key, &value)
        .await
        .map_err(|e| {
            log::error!("Failed to set setting {}: {}", key, e);
            format!("Failed to set setting: {}", e)
        })
}

/**
 * Get setting as boolean
 */
#[tauri::command]
pub async fn db_get_setting_bool(
    app: AppHandle,
    key: String,
) -> Result<bool, String> {
    let pool = app.state::<DbPool>();
    
    log::debug!("Getting setting bool: {}", key);
    
    SettingRepository::get_bool(&pool, &key)
        .await
        .map_err(|e| {
            log::error!("Failed to get setting bool {}: {}", key, e);
            format!("Failed to get setting: {}", e)
        })
}

/**
 * Get setting as string
 */
#[tauri::command]
pub async fn db_get_setting_string(
    app: AppHandle,
    key: String,
) -> Result<String, String>  {
    let pool = app.state::<DbPool>();
    
    log::debug!("Getting setting string: {}", key);
    
    SettingRepository::get_string(&pool, &key)
        .await
        .map_err(|e| {
            log::error!("Failed to get setting string {}: {}", key, e);
            format!("Failed to get setting: {}", e)
        })
}

/**
 * Get setting as number
 */
#[tauri::command]
pub async fn db_get_setting_number(
    app: AppHandle,
    key: String,
) -> Result<f64, String> {
    let pool = app.state::<DbPool>();
    
    log::debug!("Getting setting number: {}", key);
    
    SettingRepository::get_number(&pool, &key)
        .await
        .map_err(|e| {
            log::error!("Failed to get setting number {}: {}", key, e);
            format!("Failed to get setting: {}", e)
        })
}

/**
 * List all settings
 */
#[tauri::command]
pub async fn db_list_settings(
    _app: AppHandle,
) -> Result<Vec<Setting>, String> {
    // let pool = _app.state::<DbPool>();
    
    log::debug!("Listing all settings");
    
    // Temporarily disabled until async query_rows replacement exists
    // SettingRepository::list_installed(&pool)
    //     .await
    //     .map_err(|e| {
    //         log::error!("Failed to list settings: {}", e);
    //         format!("Failed to list settings: {}", e)
    //     })

    Ok(vec![])
}

/**
 * Delete setting by key
 */
#[tauri::command]
pub async fn db_delete_setting(
    app: AppHandle,
    key: String,
) -> Result<(), String> {
    let pool = app.state::<DbPool>();
    
    log::debug!("Deleting setting: {}", key);
    
    SettingRepository::delete(&pool, &key)
        .await
        .map_err(|e| {
            log::error!("Failed to delete setting {}: {}", key, e);
            format!("Failed to delete setting: {}", e)
        })
}

/**
 * Reset all settings to defaults
 */
#[tauri::command]
pub async fn db_reset_settings_to_defaults(
    app: AppHandle,
) -> Result<(), String> {
    let pool = app.state::<DbPool>();
    
    log::warn!("Resetting all settings to defaults");
    
    SettingRepository::reset_to_defaults(&pool)
        .await
        .map_err(|e| {
            log::error!("Failed to reset settings: {}", e);
            format!("Failed to reset settings: {}", e)
        })
}

/**
 * Get theme setting
 */
#[tauri::command]
pub async fn db_get_theme(
    app: AppHandle,
) -> Result<String, String> {
    let pool = app.state::<DbPool>();
    
    log::debug!("Getting theme setting");
    
    SettingRepository::get_string(&pool, "theme")
        .await
        .map(|value| value)
        .map_err(|e| {
            log::error!("Failed to get theme: {}", e);
            format!("Failed to get theme: {}", e)
        })
}

/**
 * Set theme setting
 */
#[tauri::command]
pub async fn db_set_theme(
    app: AppHandle,
    theme: String,
) -> Result<(), String> {
    let pool = app.state::<DbPool>();
    
    log::debug!("Setting theme: {}", theme);
    
    SettingRepository::set(&pool, "theme", &theme)
        .await
        .map_err(|e| {
            log::error!("Failed to set theme: {}", e);
            format!("Failed to set theme: {}", e)
        })?;
    
    Ok(())
}

/**
 * Get auto-save sessions setting
 */
#[tauri::command]
pub async fn db_get_auto_save_sessions(
    app: AppHandle,
) -> Result<bool, String> {
    let pool = app.state::<DbPool>();
    
    log::debug!("Getting auto_save_sessions setting");
    
    SettingRepository::get_bool(&pool, "auto_save_sessions")
        .await
        .map_err(|e| {
            log::error!("Failed to get auto_save_sessions: {}", e);
            format!("Failed to get setting: {}", e)
        })
}

/**
 * Set auto-save sessions setting
 */
#[tauri::command]
pub async fn db_set_auto_save_sessions(
    app: AppHandle,
    enabled: bool,
) -> Result<(), String> {
    let pool = app.state::<DbPool>();
    
    log::debug!("Setting auto_save_sessions: {}", enabled);
    
    SettingRepository::set(&pool, "auto_save_sessions", &enabled.to_string())
        .await
        .map_err(|e| {
            log::error!("Failed to set auto_save_sessions: {}", e);
            format!("Failed to set setting: {}", e)
        })?;
    
    Ok(())
}

/**
 * Database health check
 */
#[tauri::command]
pub async fn db_ping(
    app: AppHandle,
) -> Result<bool, String> {
    let pool = app.state::<DbPool>();
    
    log::debug!("Database ping");
    let connection_result = crate::db::get_connection(&pool).await;

    match connection_result {
        Ok(_) => {
            log::debug!("Database ping successful");
            Ok(true)
        }
        Err(e) => {
            log::error!("Database ping failed: {}", e);
            Ok(false)
        }
    }
}

/**
 * Get database size in bytes
 */
#[tauri::command]
pub async fn db_get_size(
    _app: AppHandle,
) -> Result<u64, String> {
    Ok(0)
}