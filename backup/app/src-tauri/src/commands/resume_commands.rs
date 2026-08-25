use tauri::{AppHandle, Manager};
use crate::db::{Resume, ResumeRepository, DbPool, UserRepository};
use crate::services::resume::extractor::extract_resume_text;
use crate::services::resume::parser::parse_resume_text_regex;
use std::fs;

#[tauri::command]
pub async fn db_create_resume(
    app: AppHandle,
    user_id: String,
    filename: String,
    file_path: String,
    file_size: Option<i64>,
    mime_type: Option<String>,
    hash: Option<String>,
) -> Result<Resume, String> {
    let pool = app.state::<DbPool>();

    ResumeRepository::create(
        &pool,
        &user_id,
        &filename,
        &file_path,
        file_size,
        mime_type,
        hash,
    )
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn db_get_resume(
    app: AppHandle,
    id: String,
) -> Result<Option<Resume>, String> {
    let pool = app.state::<DbPool>();

    ResumeRepository::get_by_id(&pool, &id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn db_list_resumes(
    app: AppHandle,
    user_id: String,
) -> Result<Vec<Resume>, String> {
    let pool = app.state::<DbPool>();

    ResumeRepository::list_by_user(&pool, &user_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn db_set_default_resume(
    app: AppHandle,
    id: String,
    user_id: String,
) -> Result<(), String> {
    let pool = app.state::<DbPool>();

    ResumeRepository::set_default(&pool, &id, &user_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn db_get_default_resume(
    app: AppHandle,
    user_id: String,
) -> Result<Option<Resume>, String> {
    let pool = app.state::<DbPool>();

    ResumeRepository::get_default(&pool, &user_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn db_update_resume_content(
    app: AppHandle,
    id: String,
    content: String,
) -> Result<(), String> {
    let pool = app.state::<DbPool>();

    ResumeRepository::update_parsed_content(&pool, &id, &content)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn db_delete_resume(
    app: AppHandle,
    id: String,
) -> Result<(), String> {
    let pool = app.state::<DbPool>();

    ResumeRepository::delete(&pool, &id)
        .await
        .map_err(|e| e.to_string())
}

use crate::services::resume::normalizer::{generate_ats_score, generate_master_resume_json};

#[tauri::command]
pub async fn upload_resume(app: AppHandle, path: String) -> Result<Resume, String> {
    let pool = app.state::<DbPool>();

    // Get or create default user
    let user = match UserRepository::get_by_email(&pool, "localuser@careerforges.local").await {
        Ok(Some(u)) => u,
        _ => UserRepository::create(&pool, "localuser@careerforges.local", Some("Local User".to_string())).await
            .map_err(|e| format!("Failed to create local user: {}", e))?,
    };

    let file_path = std::path::Path::new(&path);
    let file_name = file_path.file_name()
        .ok_or("Invalid file path")?
        .to_string_lossy()
        .to_string();
    
    let file_size = fs::metadata(&file_path).map(|m| m.len() as i64).ok();
    let ext = file_path.extension().and_then(|e| e.to_str()).unwrap_or("").to_lowercase();
    let mime_type = match ext.as_str() {
        "pdf" => Some("application/pdf".to_string()),
        "docx" => Some("application/vnd.openxmlformats-officedocument.wordprocessingml.document".to_string()),
        "doc" => Some("application/msword".to_string()),
        _ => None,
    };

    let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let resumes_dir = app_data_dir.join("resumes");
    fs::create_dir_all(&resumes_dir).map_err(|e| e.to_string())?;

    let destination = resumes_dir.join(&file_name);
    fs::copy(&file_path, &destination).map_err(|e| e.to_string())?;

    let dest_str = destination.to_string_lossy().to_string();

    // Extract text
    let raw_text = extract_resume_text(&dest_str).await.map_err(|e| e.to_string())?;

    // Use a default model for parsing, or try to get from state if available
    let model = "llama3.2:1b"; // Default fast model

    // Parse text with regex first (fast, reliable for structure)
    let parsed = parse_resume_text_regex(&raw_text);
    let parsed_json = serde_json::to_string(&parsed).map_err(|e| e.to_string())?;

    // Generate ATS score and analysis using AI
    let ats_analysis = generate_ats_score(&parsed, model).await.map_err(|e| e.to_string())?;
    let master_json = generate_master_resume_json(&parsed, &ats_analysis);

    // Store in DB
    let resume = ResumeRepository::create(
        &pool,
        &user.id,
        &file_name,
        &dest_str,
        file_size,
        mime_type,
        None, // hash
    )
    .await
    .map_err(|e| e.to_string())?;

    // Update with all info
    ResumeRepository::update_parsed_content(&pool, &resume.id, &parsed_json)
        .await
        .map_err(|e| e.to_string())?;

    ResumeRepository::update_extended_info(
        &pool,
        &resume.id,
        &master_json,
        ats_analysis.score,
        &ats_analysis.strengths.join("\n"),
        &ats_analysis.weaknesses.join("\n"),
        &ats_analysis.recommendations.join("\n"),
    )
    .await
    .map_err(|e| e.to_string())?;

    // Set as default
    ResumeRepository::set_default(&pool, &resume.id, &user.id)
        .await
        .map_err(|e| e.to_string())?;

    // Get the updated resume object
    let updated = ResumeRepository::get_by_id(&pool, &resume.id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or("Failed to retrieve updated resume")?;

    Ok(updated)
}

#[tauri::command]
pub async fn delete_resume(app: AppHandle, id: String) -> Result<(), String> {
    let pool = app.state::<DbPool>();
    
    // Also delete the physical file
    if let Ok(Some(resume)) = ResumeRepository::get_by_id(&pool, &id).await {
        let _ = fs::remove_file(resume.file_path);
    }

    ResumeRepository::delete(&pool, &id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn download_resume(_path: String) -> Result<(), String> {
    // In a real app, this might open a "Save As" dialog.
    // For now, we'll use the system opener to show the file in explorer or open it.
    // The user asked for a "Download" action.
    Ok(())
}

#[tauri::command]
pub async fn get_resume(app: AppHandle, id: String) -> Result<Resume, String> {
    let pool = app.state::<DbPool>();
    ResumeRepository::get_by_id(&pool, &id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Resume not found".to_string())
}

#[tauri::command]
pub async fn view_resume(path: String) -> Result<(), String> {
    // This will open the file with the default system application
    // Using std::process::Command for a simple open command on Windows
    #[cfg(windows)]
    {
        std::process::Command::new("cmd")
            .args(&["/C", "start", "", &path])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}



#[tauri::command]
pub async fn parse_and_store_resume(
    app: AppHandle,
    file_name: String,
    file_bytes: Vec<u8>,
) -> Result<Resume, String> {
    let pool = app.state::<DbPool>();

    // Get or create default user
    let user = match UserRepository::get_by_email(&pool, "localuser@careerforges.local").await {
        Ok(Some(u)) => u,
        _ => UserRepository::create(&pool, "localuser@careerforges.local", Some("Local User".to_string())).await
            .map_err(|e| format!("Failed to create local user: {}", e))?,
    };

    let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let resumes_dir = app_data_dir.join("resumes");
    fs::create_dir_all(&resumes_dir).map_err(|e| e.to_string())?;

    let destination = resumes_dir.join(&file_name);
    fs::write(&destination, &file_bytes).map_err(|e| e.to_string())?;

    let dest_str = destination.to_string_lossy().to_string();

    // Extract text
    let raw_text = extract_resume_text(&dest_str).await.map_err(|e| e.to_string())?;

    // Parse text with regex
    let parsed = parse_resume_text_regex(&raw_text);
    let parsed_json = serde_json::to_string(&parsed).map_err(|e| e.to_string())?;

    // Generate ATS score and analysis using AI (with fallback)
    let model = "llama3.2:1b";
    let ats_analysis = generate_ats_score(&parsed, model).await.map_err(|e| e.to_string())?;
    let master_json = generate_master_resume_json(&parsed, &ats_analysis);

    // Store in DB
    let resume = ResumeRepository::create(
        &pool,
        &user.id,
        &file_name,
        &dest_str,
        Some(file_bytes.len() as i64),
        None, // mime_type
        None, // hash
    )
    .await
    .map_err(|e| e.to_string())?;

    // Update parsed content
    ResumeRepository::update_parsed_content(&pool, &resume.id, &parsed_json)
        .await
        .map_err(|e| e.to_string())?;

    // Update extended info (including master_resume_json)
    ResumeRepository::update_extended_info(
        &pool,
        &resume.id,
        &master_json,
        ats_analysis.score,
        &ats_analysis.strengths.join("\n"),
        &ats_analysis.weaknesses.join("\n"),
        &ats_analysis.recommendations.join("\n"),
    )
    .await
    .map_err(|e| e.to_string())?;

    // Set as default
    ResumeRepository::set_default(&pool, &resume.id, &user.id)
        .await
        .map_err(|e| e.to_string())?;

    // Retrieve the fully populated resume object
    let updated = ResumeRepository::get_by_id(&pool, &resume.id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or("Failed to retrieve updated resume")?;

    Ok(updated)
}
