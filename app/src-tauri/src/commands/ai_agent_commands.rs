/**
 * AI Agent Tauri Commands
 * Handles AI model management,
 * installation status,
 * and default selection
 */

use tauri::{
    AppHandle,
    Manager,
};

use crate::db::{
    AIAgent,
    AIAgentRepository,
    DbPool,
};

/*
    CREATE AI AGENT
*/
#[tauri::command]
pub async fn db_create_ai_agent(
    app: AppHandle,
    provider: String,
    name: String,
    display_name: String,
    is_installed: Option<bool>,
) -> Result<AIAgent, String> {
    let pool =
        app.state::<DbPool>();

    log::info!(
        "Creating AI agent: provider={}, name={}, display_name={}",
        provider,
        name,
        display_name
    );

    AIAgentRepository::create(
        &pool,
        &provider,
        &name,
        &display_name,
        is_installed.unwrap_or(
            false,
        ),
    )
    .await
    .map_err(|e| {
        log::error!(
            "Failed to create AI agent: {}",
            e
        );

        format!(
            "Failed to create AI agent: {}",
            e
        )
    })
}

/*
    GET AI AGENT
*/
#[tauri::command]
pub async fn db_get_ai_agent(
    app: AppHandle,
    id: String,
) -> Result<Option<AIAgent>, String>
{
    let pool =
        app.state::<DbPool>();

    log::debug!(
        "Getting AI agent: {}",
        id
    );

    AIAgentRepository::get_by_id(
        &pool,
        &id,
    )
    .await
    .map_err(|e| {
        log::error!(
            "Failed to get AI agent {}: {}",
            id,
            e
        );

        format!(
            "Failed to get AI agent: {}",
            e
        )
    })
}

/*
    LIST BY PROVIDER
*/
#[tauri::command]
pub async fn db_list_ai_agents_by_provider(
    app: AppHandle,
    provider: String,
) -> Result<Vec<AIAgent>, String> {
    let pool =
        app.state::<DbPool>();

    AIAgentRepository::list_by_provider(
        &pool,
        &provider,
    )
    .await
    .map_err(|e| e.to_string())
}

/*
    LIST INSTALLED
*/
#[tauri::command]
pub async fn db_list_installed_ai_agents(
    app: AppHandle,
) -> Result<Vec<AIAgent>, String> {
    let pool =
        app.state::<DbPool>();

    AIAgentRepository::list_installed(
        &pool,
    )
    .await
    .map_err(|e| e.to_string())
}

/*
    LIST ALL
*/
#[tauri::command]
pub async fn db_list_all_ai_agents(
    app: AppHandle,
) -> Result<Vec<AIAgent>, String> {
    let pool =
        app.state::<DbPool>();

    AIAgentRepository::list_all(
        &pool,
    )
    .await
    .map_err(|e| e.to_string())
}

/*
    GET DEFAULT AI AGENT
*/
#[tauri::command]
pub async fn db_get_default_ai_agent(
    app: AppHandle,
) -> Result<Option<AIAgent>, String>
{
    let pool =
        app.state::<DbPool>();

    log::debug!(
        "Getting default AI agent"
    );

    AIAgentRepository::get_default(
        &pool,
    )
    .await
    .map_err(|e| {
        log::error!(
            "Failed to get default AI agent: {}",
            e
        );

        format!(
            "Failed to get default AI agent: {}",
            e
        )
    })
}

/*
    SET DEFAULT AI AGENT
*/
#[tauri::command]
pub async fn db_set_default_ai_agent(
    app: AppHandle,
    id: String,
) -> Result<AIAgent, String> {
    let pool =
        app.state::<DbPool>();

    log::info!(
        "Setting default AI agent: {}",
        id
    );

    AIAgentRepository::set_default(
        &pool,
        &id,
    )
    .await
    .map_err(|e| {
        log::error!(
            "Failed to set default AI agent {}: {}",
            id,
            e
        );

        format!(
            "Failed to set default AI agent: {}",
            e
        )
    })
}

/*
    UPDATE INSTALL STATUS
*/
#[tauri::command]
pub async fn db_update_ai_agent_install_status(
    app: AppHandle,
    id: String,
    is_installed: bool,
) -> Result<AIAgent, String> {
    let pool =
        app.state::<DbPool>();

    log::debug!(
        "Updating AI agent installation status: id={}, is_installed={}",
        id,
        is_installed
    );

    AIAgentRepository::update_installation_status(
        &pool,
        &id,
        is_installed,
    )
    .await
    .map_err(|e| {
        log::error!(
            "Failed to update AI agent installation status: {}",
            e
        );

        format!(
            "Failed to update installation status: {}",
            e
        )
    })
}

/*
    UPDATE AVAILABILITY
*/
#[tauri::command]
pub async fn db_update_ai_agent_availability(
    app: AppHandle,
    id: String,
    is_available: bool,
) -> Result<AIAgent, String> {
    let pool =
        app.state::<DbPool>();

    log::debug!(
        "Updating AI agent availability: id={}, is_available={}",
        id,
        is_available
    );

    AIAgentRepository::update_availability(
        &pool,
        &id,
        is_available,
    )
    .await
    .map_err(|e| {
        log::error!(
            "Failed to update AI agent availability: {}",
            e
        );

        format!(
            "Failed to update availability: {}",
            e
        )
    })
}

/*
    DELETE AI AGENT
*/
#[tauri::command]
pub async fn db_delete_ai_agent(
    app: AppHandle,
    id: String,
) -> Result<(), String> {
    let pool =
        app.state::<DbPool>();

    log::debug!(
        "Deleting AI agent: {}",
        id
    );

    AIAgentRepository::delete(
        &pool,
        &id,
    )
    .await
    .map_err(|e| {
        log::error!(
            "Failed to delete AI agent {}: {}",
            id,
            e
        );

        format!(
            "Failed to delete AI agent: {}",
            e
        )
    })
}