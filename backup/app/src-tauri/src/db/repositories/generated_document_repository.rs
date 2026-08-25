use crate::db::connection::{execute_with_params, query_row, query_rows, DbPool};
use crate::db::error::{DbError, DbResult};

use chrono::Utc;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeneratedResume {
    pub id: String,
    pub user_id: String,
    pub job_id: String,
    pub resume_id: String,
    pub job_title: Option<String>,
    pub original_resume_json: Option<String>,
    pub generated_resume_json: Option<String>,
    pub ats_score: Option<f64>,
    pub ats_strengths: Option<String>,
    pub ats_weaknesses: Option<String>,
    pub ats_recommendations: Option<String>,
    pub optimized_summary: Option<String>,
    pub optimized_skills: Option<String>,
    pub optimized_experience: Option<String>,
    pub generated_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeneratedCoverLetter {
    pub id: String,
    pub user_id: String,
    pub job_id: String,
    pub resume_id: Option<String>,
    pub job_title: Option<String>,
    pub company_name: Option<String>,
    pub original_resume_json: Option<String>,
    pub content: String,
    pub generated_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

pub struct GeneratedDocumentRepository;

impl GeneratedDocumentRepository {
    /*
        GENERATED RESUMES
    */
    pub async fn create_resume(
        pool: &DbPool,
        user_id: &str,
        job_id: &str,
        resume_id: &str,
        job_title: Option<String>,
        original_resume_json: Option<String>,
        generated_resume_json: Option<String>,
        ats_score: Option<f64>,
        ats_strengths: Option<String>,
        ats_weaknesses: Option<String>,
        ats_recommendations: Option<String>,
        summary: Option<String>,
        skills: Option<String>,
        experience: Option<String>,
    ) -> DbResult<GeneratedResume> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339();

        // Step 1: Insert core fields
        execute_with_params(
            pool,
            "
            INSERT INTO generated_resumes (
                id,
                user_id,
                job_id,
                resume_id,
                created_at,
                updated_at
            )
            VALUES (?1, ?2, ?3, ?4, ?5, ?6)
            ",
            (
                id.clone(),
                user_id.to_string(),
                job_id.to_string(),
                resume_id.to_string(),
                now.clone(),
                now.clone(),
            ),
        )
        .await?;

        // Step 2: Update extended fields
        execute_with_params(
            pool,
            "
            UPDATE generated_resumes SET
                job_title = ?1,
                original_resume_json = ?2,
                generated_resume_json = ?3,
                ats_score = ?4,
                ats_strengths = ?5,
                ats_weaknesses = ?6,
                ats_recommendations = ?7,
                optimized_summary = ?8,
                optimized_skills = ?9,
                optimized_experience = ?10,
                generated_at = ?11,
                updated_at = ?12
            WHERE id = ?13
            ",
            (
                job_title.clone(),
                original_resume_json.clone(),
                generated_resume_json.clone(),
                ats_score,
                ats_strengths.clone(),
                ats_weaknesses.clone(),
                ats_recommendations.clone(),
                summary.clone(),
                skills.clone(),
                experience.clone(),
                Some(now.clone()),
                now.clone(),
                id.clone(),
            ),
        )
        .await?;

        Self::get_resume_by_id(pool, &id)
            .await?
            .ok_or(DbError::NotFound)
    }

    pub async fn get_resume_by_id(
        pool: &DbPool,
        id: &str,
    ) -> DbResult<Option<GeneratedResume>> {
        query_row(
            pool,
            "
            SELECT
                id, user_id, job_id, resume_id,
                job_title, original_resume_json, generated_resume_json,
                ats_score, ats_strengths, ats_weaknesses, ats_recommendations,
                optimized_summary, optimized_skills, optimized_experience, generated_at,
                created_at, updated_at
            FROM generated_resumes
            WHERE id = ?1
            ",
            (id.to_string(),),
            |row| {
                Ok(GeneratedResume {
                    id: row.get(0)?,
                    user_id: row.get(1)?,
                    job_id: row.get(2)?,
                    resume_id: row.get(3)?,
                    job_title: row.get(4)?,
                    original_resume_json: row.get(5)?,
                    generated_resume_json: row.get(6)?,
                    ats_score: row.get(7)?,
                    ats_strengths: row.get(8)?,
                    ats_weaknesses: row.get(9)?,
                    ats_recommendations: row.get(10)?,
                    optimized_summary: row.get(11)?,
                    optimized_skills: row.get(12)?,
                    optimized_experience: row.get(13)?,
                    generated_at: row.get(14)?,
                    created_at: row.get(15)?,
                    updated_at: row.get(16)?,
                })
            },
        )
        .await
    }

    pub async fn list_resumes_by_job(
        pool: &DbPool,
        job_id: &str,
    ) -> DbResult<Vec<GeneratedResume>> {
        query_rows(
            pool,
            "
            SELECT
                id, user_id, job_id, resume_id,
                job_title, original_resume_json, generated_resume_json,
                ats_score, ats_strengths, ats_weaknesses, ats_recommendations,
                optimized_summary, optimized_skills, optimized_experience, generated_at,
                created_at, updated_at
            FROM generated_resumes
            WHERE job_id = ?1
            ORDER BY created_at DESC
            ",
            (job_id.to_string(),),
            |row| {
                Ok(GeneratedResume {
                    id: row.get(0)?,
                    user_id: row.get(1)?,
                    job_id: row.get(2)?,
                    resume_id: row.get(3)?,
                    job_title: row.get(4)?,
                    original_resume_json: row.get(5)?,
                    generated_resume_json: row.get(6)?,
                    ats_score: row.get(7)?,
                    ats_strengths: row.get(8)?,
                    ats_weaknesses: row.get(9)?,
                    ats_recommendations: row.get(10)?,
                    optimized_summary: row.get(11)?,
                    optimized_skills: row.get(12)?,
                    optimized_experience: row.get(13)?,
                    generated_at: row.get(14)?,
                    created_at: row.get(15)?,
                    updated_at: row.get(16)?,
                })
            },
        )
        .await
    }

    pub async fn list_all_resumes(
        pool: &DbPool,
        user_id: &str,
    ) -> DbResult<Vec<GeneratedResume>> {
        query_rows(
            pool,
            "
            SELECT
                id, user_id, job_id, resume_id,
                job_title, original_resume_json, generated_resume_json,
                ats_score, ats_strengths, ats_weaknesses, ats_recommendations,
                optimized_summary, optimized_skills, optimized_experience, generated_at,
                created_at, updated_at
            FROM generated_resumes
            WHERE user_id = ?1
            ORDER BY created_at DESC
            ",
            (user_id.to_string(),),
            |row| {
                Ok(GeneratedResume {
                    id: row.get(0)?,
                    user_id: row.get(1)?,
                    job_id: row.get(2)?,
                    resume_id: row.get(3)?,
                    job_title: row.get(4)?,
                    original_resume_json: row.get(5)?,
                    generated_resume_json: row.get(6)?,
                    ats_score: row.get(7)?,
                    ats_strengths: row.get(8)?,
                    ats_weaknesses: row.get(9)?,
                    ats_recommendations: row.get(10)?,
                    optimized_summary: row.get(11)?,
                    optimized_skills: row.get(12)?,
                    optimized_experience: row.get(13)?,
                    generated_at: row.get(14)?,
                    created_at: row.get(15)?,
                    updated_at: row.get(16)?,
                })
            },
        )
        .await
    }

    pub async fn delete_resume(
        pool: &DbPool,
        id: &str,
    ) -> DbResult<()> {
        execute_with_params(
            pool,
            "DELETE FROM generated_resumes WHERE id = ?1",
            (id.to_string(),),
        )
        .await?;
        Ok(())
    }

    /*
        GENERATED COVER LETTERS
    */
    pub async fn create_cover_letter(
        pool: &DbPool,
        user_id: &str,
        job_id: &str,
        resume_id: Option<String>,
        job_title: Option<String>,
        company_name: Option<String>,
        original_resume_json: Option<String>,
        content: &str,
    ) -> DbResult<GeneratedCoverLetter> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339();

        execute_with_params(
            pool,
            "
            INSERT INTO generated_cover_letters (
                id,
                user_id,
                job_id,
                resume_id,
                job_title,
                company_name,
                original_resume_json,
                content,
                generated_at,
                created_at,
                updated_at
            )
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
            ",
            (
                id.clone(),
                user_id.to_string(),
                job_id.to_string(),
                resume_id,
                job_title,
                company_name,
                original_resume_json,
                content.to_string(),
                now.clone(),
                now.clone(),
                now.clone(),
            ),
        )
        .await?;

        Self::get_cover_letter_by_id(pool, &id)
            .await?
            .ok_or(DbError::NotFound)
    }

    pub async fn get_cover_letter_by_id(
        pool: &DbPool,
        id: &str,
    ) -> DbResult<Option<GeneratedCoverLetter>> {
        query_row(
            pool,
            "
            SELECT
                id, user_id, job_id, resume_id, job_title, company_name,
                original_resume_json, content, generated_at,
                created_at, updated_at
            FROM generated_cover_letters
            WHERE id = ?1
            ",
            (id.to_string(),),
            |row| {
                Ok(GeneratedCoverLetter {
                    id: row.get(0)?,
                    user_id: row.get(1)?,
                    job_id: row.get(2)?,
                    resume_id: row.get(3)?,
                    job_title: row.get(4)?,
                    company_name: row.get(5)?,
                    original_resume_json: row.get(6)?,
                    content: row.get(7)?,
                    generated_at: row.get(8)?,
                    created_at: row.get(9)?,
                    updated_at: row.get(10)?,
                })
            },
        )
        .await
    }

    pub async fn list_cover_letters_by_job(
        pool: &DbPool,
        job_id: &str,
    ) -> DbResult<Vec<GeneratedCoverLetter>> {
        query_rows(
            pool,
            "
            SELECT
                id, user_id, job_id, resume_id, job_title, company_name,
                original_resume_json, content, generated_at,
                created_at, updated_at
            FROM generated_cover_letters
            WHERE job_id = ?1
            ORDER BY created_at DESC
            ",
            (job_id.to_string(),),
            |row| {
                Ok(GeneratedCoverLetter {
                    id: row.get(0)?,
                    user_id: row.get(1)?,
                    job_id: row.get(2)?,
                    resume_id: row.get(3)?,
                    job_title: row.get(4)?,
                    company_name: row.get(5)?,
                    original_resume_json: row.get(6)?,
                    content: row.get(7)?,
                    generated_at: row.get(8)?,
                    created_at: row.get(9)?,
                    updated_at: row.get(10)?,
                })
            },
        )
        .await
    }

    pub async fn list_all_cover_letters(
        pool: &DbPool,
        user_id: &str,
    ) -> DbResult<Vec<GeneratedCoverLetter>> {
        query_rows(
            pool,
            "
            SELECT
                id, user_id, job_id, resume_id, job_title, company_name,
                original_resume_json, content, generated_at,
                created_at, updated_at
            FROM generated_cover_letters
            WHERE user_id = ?1
            ORDER BY created_at DESC
            ",
            (user_id.to_string(),),
            |row| {
                Ok(GeneratedCoverLetter {
                    id: row.get(0)?,
                    user_id: row.get(1)?,
                    job_id: row.get(2)?,
                    resume_id: row.get(3)?,
                    job_title: row.get(4)?,
                    company_name: row.get(5)?,
                    original_resume_json: row.get(6)?,
                    content: row.get(7)?,
                    generated_at: row.get(8)?,
                    created_at: row.get(9)?,
                    updated_at: row.get(10)?,
                })
            },
        )
        .await
    }

    pub async fn delete_cover_letter(
        pool: &DbPool,
        id: &str,
    ) -> DbResult<()> {
        execute_with_params(
            pool,
            "DELETE FROM generated_cover_letters WHERE id = ?1",
            (id.to_string(),),
        )
        .await?;
        Ok(())
    }
}
