use crate::db::connection::{execute_with_params, query_row, query_rows, DbPool};
use crate::db::error::DbResult;

use chrono::Utc;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Job {
    pub id: String,
    pub user_id: String,
    pub title: String,
    pub company: Option<String>,
    pub url: Option<String>,
    pub description: Option<String>,
    pub requirements: Option<String>,
    pub salary_min: Option<f64>,
    pub salary_max: Option<f64>,
    pub location: Option<String>,
    pub job_type: Option<String>,
    pub posted_date: Option<String>,
    pub status: String,
    pub match_score: Option<f64>,
    pub notes: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub source: Option<String>,
    pub source_url: Option<String>,
    pub matched_skills: Option<String>,
    pub missing_skills: Option<String>,
    pub experience_match: Option<bool>,
    pub title_match: Option<bool>,
    pub discovered_at: Option<String>,
}

pub struct JobRepository;

impl JobRepository {
    /*
        CREATE
    */
    pub async fn create(
        pool: &DbPool,
        user_id: &str,
        title: &str,
        company: Option<String>,
        url: Option<String>,
        description: Option<String>,
        location: Option<String>,
        source: Option<String>,
        source_url: Option<String>,
        match_score: Option<f64>,
        matched_skills: Option<String>,
        missing_skills: Option<String>,
        experience_match: Option<bool>,
        title_match: Option<bool>,
        posted_date: Option<String>,
        status: Option<String>,
    ) -> DbResult<Job> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339();
        let status_val = status.clone().unwrap_or_else(|| "recommended".to_string());

        // Step 1: Insert core fields (staying under 16 params)
        execute_with_params(
            pool,
            "
            INSERT INTO jobs (
                id,
                user_id,
                title,
                status,
                created_at,
                updated_at
            )
            VALUES (?1, ?2, ?3, ?4, ?5, ?6)
            ",
            (
                id.clone(),
                user_id.to_string(),
                title.to_string(),
                status_val.clone(),
                now.clone(),
                now.clone(),
            ),
        )
        .await?;

        // Step 2: Update extended fields
        execute_with_params(
            pool,
            "
            UPDATE jobs SET
                company = ?1,
                url = ?2,
                description = ?3,
                location = ?4,
                source = ?5,
                source_url = ?6,
                match_score = ?7,
                matched_skills = ?8,
                missing_skills = ?9,
                experience_match = ?10,
                title_match = ?11,
                posted_date = ?12,
                discovered_at = ?13
            WHERE id = ?14
            ",
            (
                company.clone(),
                url.clone(),
                description.clone(),
                location.clone(),
                source.clone(),
                source_url.clone(),
                match_score,
                matched_skills.clone(),
                missing_skills.clone(),
                experience_match,
                title_match,
                posted_date.clone(),
                Some(now.clone()),
                id.clone(),
            ),
        )
        .await?;

        Ok(Job {
            id,
            user_id: user_id.to_string(),
            title: title.to_string(),
            company,
            url,
            description,
            requirements: None,
            salary_min: None,
            salary_max: None,
            location,
            job_type: None,
            posted_date,
            status: status_val,
            match_score,
            notes: None,
            created_at: now.clone(),
            updated_at: now.clone(),
            source,
            source_url,
            matched_skills,
            missing_skills,
            experience_match,
            title_match,
            discovered_at: Some(now),
        })
    }

    /*
        GET BY URL
    */
    pub async fn get_by_url(
        pool: &DbPool,
        url: &str,
    ) -> DbResult<Option<Job>> {
        query_row(
            pool,
            "
            SELECT
                id, user_id, title, company, url, description, requirements,
                salary_min, salary_max, location, job_type, posted_date,
                status, match_score, notes, created_at, updated_at,
                source, source_url, matched_skills, missing_skills,
                experience_match, title_match, discovered_at
            FROM jobs
            WHERE (url = ?1 OR source_url = ?1) AND deleted_at IS NULL
            ",
            (url.to_string(),),
            |row| {
                Ok(Job {
                    id: row.get(0)?,
                    user_id: row.get(1)?,
                    title: row.get(2)?,
                    company: row.get(3)?,
                    url: row.get(4)?,
                    description: row.get(5)?,
                    requirements: row.get(6)?,
                    salary_min: row.get(7)?,
                    salary_max: row.get(8)?,
                    location: row.get(9)?,
                    job_type: row.get(10)?,
                    posted_date: row.get(11)?,
                    status: row.get(12)?,
                    match_score: row.get(13)?,
                    notes: row.get(14)?,
                    created_at: row.get(15)?,
                    updated_at: row.get(16)?,
                    source: row.get(17)?,
                    source_url: row.get(18)?,
                    matched_skills: row.get(19)?,
                    missing_skills: row.get(20)?,
                    experience_match: row.get(21)?,
                    title_match: row.get(22)?,
                    discovered_at: row.get(23)?,
                })
            },
        )
        .await
    }

    /*
        GET BY ID
    */
    pub async fn get_by_id(
        pool: &DbPool,
        id: &str,
    ) -> DbResult<Option<Job>> {
        query_row(
            pool,
            "
            SELECT
                id,
                user_id,
                title,
                company,
                url,
                description,
                requirements,
                salary_min,
                salary_max,
                location,
                job_type,
                posted_date,
                status,
                match_score,
                notes,
                created_at,
                updated_at,
                source,
                source_url,
                matched_skills,
                missing_skills,
                experience_match,
                title_match,
                discovered_at
            FROM jobs
            WHERE id = ?1 AND deleted_at IS NULL
            ",
            (id.to_string(),),
            |row| {
                Ok(Job {
                    id: row.get(0)?,
                    user_id: row.get(1)?,
                    title: row.get(2)?,
                    company: row.get(3)?,
                    url: row.get(4)?,
                    description: row.get(5)?,
                    requirements: row.get(6)?,
                    salary_min: row.get(7)?,
                    salary_max: row.get(8)?,
                    location: row.get(9)?,
                    job_type: row.get(10)?,
                    posted_date: row.get(11)?,
                    status: row.get(12)?,
                    match_score: row.get(13)?,
                    notes: row.get(14)?,
                    created_at: row.get(15)?,
                    updated_at: row.get(16)?,
                    source: row.get(17)?,
                    source_url: row.get(18)?,
                    matched_skills: row.get(19)?,
                    missing_skills: row.get(20)?,
                    experience_match: row.get(21)?,
                    title_match: row.get(22)?,
                    discovered_at: row.get(23)?,
                })
            },
        )
        .await
    }

    /*
        LIST BY USER
    */
    pub async fn list_by_user(
        pool: &DbPool,
        user_id: &str,
    ) -> DbResult<Vec<Job>> {
        query_rows(
            pool,
            "
            SELECT
                id,
                user_id,
                title,
                company,
                url,
                description,
                requirements,
                salary_min,
                salary_max,
                location,
                job_type,
                posted_date,
                status,
                match_score,
                notes,
                created_at,
                updated_at,
                source,
                source_url,
                matched_skills,
                missing_skills,
                experience_match,
                title_match,
                discovered_at
            FROM jobs
            WHERE user_id = ?1 AND deleted_at IS NULL
            ORDER BY created_at DESC
            ",
            (user_id.to_string(),),
            |row| {
                Ok(Job {
                    id: row.get(0)?,
                    user_id: row.get(1)?,
                    title: row.get(2)?,
                    company: row.get(3)?,
                    url: row.get(4)?,
                    description: row.get(5)?,
                    requirements: row.get(6)?,
                    salary_min: row.get(7)?,
                    salary_max: row.get(8)?,
                    location: row.get(9)?,
                    job_type: row.get(10)?,
                    posted_date: row.get(11)?,
                    status: row.get(12)?,
                    match_score: row.get(13)?,
                    notes: row.get(14)?,
                    created_at: row.get(15)?,
                    updated_at: row.get(16)?,
                    source: row.get(17)?,
                    source_url: row.get(18)?,
                    matched_skills: row.get(19)?,
                    missing_skills: row.get(20)?,
                    experience_match: row.get(21)?,
                    title_match: row.get(22)?,
                    discovered_at: row.get(23)?,
                })
            },
        )
        .await
    }

    /*
        UPDATE STATUS
    */
    pub async fn update_status(
        pool: &DbPool,
        id: &str,
        status: &str,
    ) -> DbResult<()> {
        let now = Utc::now().to_rfc3339();

        execute_with_params(
            pool,
            "UPDATE jobs SET status = ?1, updated_at = ?2 WHERE id = ?3",
            (status.to_string(), now, id.to_string()),
        )
        .await?;

        Ok(())
    }

    /*
        DELETE
    */
    pub async fn delete(
        pool: &DbPool,
        id: &str,
    ) -> DbResult<()> {
        let now = Utc::now().to_rfc3339();

        execute_with_params(
            pool,
            "UPDATE jobs SET deleted_at = ?1 WHERE id = ?2",
            (now, id.to_string()),
        )
        .await?;

        Ok(())
    }
}
