use tauri::AppHandle;
use tauri::Manager;
use crate::db::{DbPool, InterviewRepository, InterviewSession, UserRepository};

#[tauri::command]
pub async fn db_create_interview_session(
    app: AppHandle,
    session_type: String,
    job_title: Option<String>,
    company: Option<String>,
    job_id: Option<String>,
    job_description: Option<String>,
    experience_level: Option<String>,
    personality: Option<String>,
    resume_context: Option<String>,
) -> Result<InterviewSession, String> {
    let pool = app.state::<DbPool>();
    
    let user = match UserRepository::get_by_email(&pool, "localuser@careerforges.local").await {
        Ok(Some(u)) => u,
        _ => return Err("Local user not found".to_string()),
    };

     InterviewRepository::create(
        &pool,
        &user.id,
        &session_type,
        job_title,
        company,
        job_id,
        job_description,
        experience_level,
        personality,
        resume_context,
    )
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn db_get_interview_session(
    app: AppHandle,
    id: String,
) -> Result<Option<InterviewSession>, String> {
    let pool = app.state::<DbPool>();
    InterviewRepository::get_by_id(&pool, &id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn db_list_interview_sessions(
    app: AppHandle,
) -> Result<Vec<InterviewSession>, String> {
    let pool = app.state::<DbPool>();
    
    let user = match UserRepository::get_by_email(&pool, "localuser@careerforges.local").await {
        Ok(Some(u)) => u,
        _ => return Err("Local user not found".to_string()),
    };

    InterviewRepository::list_by_user(&pool, &user.id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn db_update_interview_score(
    app: AppHandle,
    id: String,
    score: f64,
    feedback: String,
    duration_seconds: i32,
) -> Result<(), String> {
    let pool = app.state::<DbPool>();
    InterviewRepository::update_score(&pool, &id, score, feedback, duration_seconds)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn db_delete_interview_session(
    app: AppHandle,
    id: String,
) -> Result<(), String> {
    let pool = app.state::<DbPool>();
    InterviewRepository::delete(&pool, &id)
        .await
        .map_err(|e| e.to_string())
}
