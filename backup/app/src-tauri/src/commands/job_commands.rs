use tauri::{AppHandle, Manager};
use crate::db::{Job, JobRepository, DbPool, UserRepository, SettingRepository};
use crate::services::job::{JobScheduler, scheduler::SchedulerStatus};
use std::sync::Arc;

#[tauri::command]
pub async fn get_scheduler_status(app: AppHandle) -> Result<SchedulerStatus, String> {
    let pool = app.state::<DbPool>();
    let scheduler = JobScheduler::new(Arc::new(pool.inner().clone()), app);
    Ok(scheduler.get_status().await)
}

#[tauri::command]
pub async fn toggle_scheduler(app: AppHandle, enabled: bool) -> Result<(), String> {
    let pool = app.state::<DbPool>();
    SettingRepository::set(&pool, "job_scheduler_enabled", &enabled.to_string())
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn update_scheduler_frequency(app: AppHandle, mins: u64) -> Result<(), String> {
    let pool = app.state::<DbPool>();
    SettingRepository::set(&pool, "job_scheduler_frequency", &mins.to_string())
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn run_scheduler_now(app: AppHandle) -> Result<usize, String> {
    let pool = app.state::<DbPool>();
    let scheduler = JobScheduler::new(Arc::new(pool.inner().clone()), app);
    scheduler.run_now().await
}

#[tauri::command]
pub async fn fetch_jobs(
    app: AppHandle,
    title: Option<String>,
    location: Option<String>,
    remote: bool,
) -> Result<usize, String> {
    let _ = (title, location, remote);
    let pool = app.state::<DbPool>();
    let scheduler = JobScheduler::new(Arc::new(pool.inner().clone()), app);
    scheduler.run_now().await
}

#[tauri::command]
pub async fn search_jobs(
    app: AppHandle,
    query_text: String,
) -> Result<Vec<Job>, String> {
    let pool = app.state::<DbPool>();
    
    let user = match UserRepository::get_by_email(&pool, "localuser@careerforges.local").await {
        Ok(Some(u)) => u,
        _ => return Err("Local user not found".to_string()),
    };

    let all_jobs = JobRepository::list_by_user(&pool, &user.id).await.map_err(|e| e.to_string())?;
    
    // Simple search filtering
    let filtered = all_jobs.into_iter()
        .filter(|j| {
            let qt = query_text.to_lowercase();
            j.title.to_lowercase().contains(&qt) || 
            j.company.as_ref().map(|c| c.to_lowercase().contains(&qt)).unwrap_or(false)
        })
        .collect();

    Ok(filtered)
}

#[tauri::command]
pub async fn save_job(app: AppHandle, id: String) -> Result<(), String> {
    let pool = app.state::<DbPool>();
    JobRepository::update_status(&pool, &id, "saved").await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn reject_job(app: AppHandle, id: String) -> Result<(), String> {
    let pool = app.state::<DbPool>();
    JobRepository::update_status(&pool, &id, "rejected").await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_job_status(app: AppHandle, id: String, status: String) -> Result<(), String> {
    let pool = app.state::<DbPool>();
    JobRepository::update_status(&pool, &id, &status).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_job(app: AppHandle, id: String) -> Result<(), String> {
    let pool = app.state::<DbPool>();
    JobRepository::delete(&pool, &id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_jobs(app: AppHandle) -> Result<Vec<Job>, String> {
    let pool = app.state::<DbPool>();
    
    let user = match UserRepository::get_by_email(&pool, "localuser@careerforges.local").await {
        Ok(Some(u)) => u,
        _ => return Err("Local user not found".to_string()),
    };

    JobRepository::list_by_user(&pool, &user.id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn db_create_job(
    app: AppHandle,
    user_id: String,
    title: String,
    company: Option<String>,
    url: Option<String>,
) -> Result<Job, String> {
    let pool = app.state::<DbPool>();

    JobRepository::create(
        &pool,
        &user_id,
        &title,
        company,
        url,
        None, None, None, None, None, None, None, None, None, None, None
    )
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn db_get_job(
    app: AppHandle,
    id: String,
) -> Result<Option<Job>, String> {
    let pool = app.state::<DbPool>();

    JobRepository::get_by_id(&pool, &id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn db_list_jobs(
    app: AppHandle,
    user_id: String,
) -> Result<Vec<Job>, String> {
    let pool = app.state::<DbPool>();

    JobRepository::list_by_user(&pool, &user_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn db_update_job_status(
    app: AppHandle,
    id: String,
    status: String,
) -> Result<(), String> {
    let pool = app.state::<DbPool>();

    JobRepository::update_status(&pool, &id, &status)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn db_delete_job(
    app: AppHandle,
    id: String,
) -> Result<(), String> {
    let pool = app.state::<DbPool>();

    JobRepository::delete(&pool, &id)
        .await
        .map_err(|e| e.to_string())
}
