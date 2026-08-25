use tauri::{AppHandle, Manager};
use crate::db::{DbPool, ResumeRepository, JobRepository, GeneratedDocumentRepository, GeneratedResume, GeneratedCoverLetter, ApplicationRepository, JobApplication};
use crate::services::ats::AtsGenerator;
use serde_json::json;

#[tauri::command]
pub async fn mark_job_as_applied(
    app: AppHandle,
    job_id: String,
    mut resume_id: Option<String>,
    mut cover_letter_id: Option<String>,
) -> Result<JobApplication, String> {
    let pool = app.state::<DbPool>();

    // 1. Get Job to get user_id and description
    let job = JobRepository::get_by_id(&pool, &job_id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or("Job not found")?;

    // 2. If no resume_id provided, use default resume
    if resume_id.is_none() {
        if let Ok(Some(default_resume)) = ResumeRepository::get_default(&pool, &job.user_id).await {
            resume_id = Some(default_resume.id);
        }
    }

    // 3. Auto-generate ATS resume if missing
    let mut generated_resume_id: Option<String> = None;
    let mut generated_cover_letter_id: Option<String> = cover_letter_id.clone();

    if let Some(ref rid) = resume_id {
        let existing_generated = GeneratedDocumentRepository::list_resumes_by_job(&pool, &job_id)
            .await
            .unwrap_or_default();
        
        if let Some(latest) = existing_generated.first() {
            generated_resume_id = Some(latest.id.clone());
        } else if let Ok(gen) = generate_ats_resume(app.clone(), job_id.clone(), rid.clone()).await {
            generated_resume_id = Some(gen.id);
        }
    }

    // 4. Auto-generate Cover Letter if missing
    if let Some(ref rid) = resume_id {
        let existing_cl = GeneratedDocumentRepository::list_cover_letters_by_job(&pool, &job_id)
            .await
            .unwrap_or_default();
        
        if existing_cl.is_empty() {
            if let Some(latest) = existing_cl.first() {
                generated_cover_letter_id = Some(latest.id.clone());
                if cover_letter_id.is_none() {
                    cover_letter_id = Some(latest.id.clone());
                }
            } else if let Ok(gen) = generate_cover_letter(app.clone(), job_id.clone(), rid.clone()).await {
                generated_cover_letter_id = Some(gen.id.clone());
                cover_letter_id.get_or_insert(gen.id);
            }
        } else if let Some(latest) = existing_cl.first() {
            generated_cover_letter_id = Some(latest.id.clone());
        }
    }

    // 5. Update Job status
    JobRepository::update_status(&pool, &job_id, "applied")
        .await
        .map_err(|e| e.to_string())?;

    // 6. Create application record
    ApplicationRepository::create(
        &pool,
        &job.user_id,
        &job_id,
        resume_id,
        cover_letter_id,
        generated_resume_id,
        generated_cover_letter_id,
    )
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn db_list_applications(
    app: AppHandle,
    user_id: String,
) -> Result<Vec<JobApplication>, String> {
    let pool = app.state::<DbPool>();
    ApplicationRepository::list_by_user(&pool, &user_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn db_get_application_by_job(
    app: AppHandle,
    job_id: String,
) -> Result<Option<JobApplication>, String> {
    let pool = app.state::<DbPool>();
    ApplicationRepository::get_by_job_id(&pool, &job_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn generate_ats_resume(
    app: AppHandle,
    job_id: String,
    resume_id: String,
) -> Result<GeneratedResume, String> {
    let pool = app.state::<DbPool>();

    // 1. Get Job
    let job = JobRepository::get_by_id(&pool, &job_id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or("Job not found")?;

    // 2. Get Resume
    let resume = ResumeRepository::get_by_id(&pool, &resume_id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or("Resume not found")?;

    let master_json = resume.master_resume_json.ok_or("Resume has no master data")?;
    let job_desc = job.description.unwrap_or_else(|| "No description available".to_string());

    // 3. Generate using AI
    let model = "llama3.2:1b"; // Use fast model
    let optimized = AtsGenerator::generate_optimized_resume(&master_json, &job_desc, model)
        .await
        .map_err(|e| e.to_string())?;

    let optimized_summary = optimized.summary.clone();
    let optimized_skills = optimized.skills.clone();
    let optimized_experience_bullets = optimized.experience_bullets.clone();
    let ats_strengths = optimized.strengths.clone();
    let ats_weaknesses = optimized.weaknesses.clone();
    let ats_recommendations = optimized.recommendations.clone();
    let master_value = serde_json::from_str::<serde_json::Value>(&master_json)
        .unwrap_or_else(|_| json!({ "raw": master_json }));
    let generated_resume_json = json!({
        "source": "careerforges_ats",
        "job": {
            "id": job.id.clone(),
            "title": job.title.clone(),
            "company": job.company.clone(),
            "description": job_desc.clone()
        },
        "master_resume": master_value,
        "optimized": {
            "summary": optimized_summary,
            "skills": optimized_skills,
            "experience_bullets": optimized_experience_bullets,
            "ats_score": optimized.ats_score,
            "strengths": ats_strengths,
            "weaknesses": ats_weaknesses,
            "recommendations": ats_recommendations
        }
    });

    // 4. Store in DB
    let generated = GeneratedDocumentRepository::create_resume(
        &pool,
        &resume.user_id,
        &job_id,
        &resume_id,
        Some(job.title.clone()),
        Some(master_json),
        Some(generated_resume_json.to_string()),
        Some(optimized.ats_score),
        Some(optimized.strengths.join("\n")),
        Some(optimized.weaknesses.join("\n")),
        Some(optimized.recommendations.join("\n")),
        Some(generated_resume_json["optimized"]["summary"].as_str().unwrap_or_default().to_string()),
        Some(
            generated_resume_json["optimized"]["skills"]
                .as_array()
                .map(|skills| skills.iter().filter_map(|skill| skill.as_str()).collect::<Vec<_>>().join(", "))
                .unwrap_or_default()
        ),
        Some(generated_resume_json["optimized"]["experience_bullets"].to_string()),
    )
    .await
    .map_err(|e| e.to_string())?;

    Ok(generated)
}

#[tauri::command]
pub async fn generate_cover_letter(
    app: AppHandle,
    job_id: String,
    resume_id: String,
) -> Result<GeneratedCoverLetter, String> {
    let pool = app.state::<DbPool>();

    // 1. Get Job
    let job = JobRepository::get_by_id(&pool, &job_id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or("Job not found")?;

    // 2. Get Resume
    let resume = ResumeRepository::get_by_id(&pool, &resume_id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or("Resume not found")?;

    let master_json = resume.master_resume_json.ok_or("Resume has no master data")?;
    let job_desc = job.description.unwrap_or_else(|| "No description available".to_string());
    let company_name = job.company.clone();

    // 3. Generate using AI
    let model = "llama3.2:1b";
    let content = AtsGenerator::generate_cover_letter(&master_json, &job_desc, company_name.as_deref(), model)
        .await
        .map_err(|e| e.to_string())?;

    // 4. Store in DB
    let generated = GeneratedDocumentRepository::create_cover_letter(
        &pool,
        &resume.user_id,
        &job_id,
        Some(resume_id),
        Some(job.title),
        company_name,
        Some(master_json),
        &content,
    )
    .await
    .map_err(|e| e.to_string())?;

    Ok(generated)
}

#[tauri::command]
pub async fn db_list_generated_resumes(
    app: AppHandle,
    job_id: String,
) -> Result<Vec<GeneratedResume>, String> {
    let pool = app.state::<DbPool>();
    GeneratedDocumentRepository::list_resumes_by_job(&pool, &job_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn db_list_generated_cover_letters(
    app: AppHandle,
    job_id: String,
) -> Result<Vec<GeneratedCoverLetter>, String> {
    let pool = app.state::<DbPool>();
    GeneratedDocumentRepository::list_cover_letters_by_job(&pool, &job_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn db_list_all_generated_resumes(
    app: AppHandle,
    user_id: String,
) -> Result<Vec<GeneratedResume>, String> {
    let pool = app.state::<DbPool>();
    GeneratedDocumentRepository::list_all_resumes(&pool, &user_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn db_list_all_generated_cover_letters(
    app: AppHandle,
    user_id: String,
) -> Result<Vec<GeneratedCoverLetter>, String> {
    let pool = app.state::<DbPool>();
    GeneratedDocumentRepository::list_all_cover_letters(&pool, &user_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn db_delete_generated_resume(
    app: AppHandle,
    id: String,
) -> Result<(), String> {
    let pool = app.state::<DbPool>();
    GeneratedDocumentRepository::delete_resume(&pool, &id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn db_delete_generated_cover_letter(
    app: AppHandle,
    id: String,
) -> Result<(), String> {
    let pool = app.state::<DbPool>();
    GeneratedDocumentRepository::delete_cover_letter(&pool, &id)
        .await
        .map_err(|e| e.to_string())
}
