use crate::db::error::{DbError, DbResult};
use crate::db::{JobRepository, DbPool, ResumeRepository};
use super::{JobSourceAdapter, JobSearchQuery};
use super::adapters::{LinkedIn, Indeed, Greenhouse};
use super::matching::JobMatchingEngine;
use std::sync::Arc;

pub struct JobDiscoveryEngine {
    adapters: Vec<Box<dyn JobSourceAdapter>>,
    pool: Arc<DbPool>,
}

impl JobDiscoveryEngine {
    pub fn new(pool: Arc<DbPool>) -> Self {
        Self {
            adapters: vec![
                Box::new(LinkedIn),
                Box::new(Indeed),
                Box::new(Greenhouse),
            ],
            pool,
        }
    }

    pub async fn fetch_and_match(&self, user_id: &str, query: &JobSearchQuery) -> DbResult<usize> {
        let mut all_discovered = Vec::new();
        let mut adapter_errors = Vec::new();
        
        // 1. Fetch from all sources
        for adapter in &self.adapters {
            match adapter.search(query).await {
                Ok(jobs) => {
                    log::info!("{} returned {} discovered jobs", adapter.name(), jobs.len());
                    all_discovered.extend(jobs);
                }
                Err(error) => {
                    log::warn!("{} job search failed: {}", adapter.name(), error);
                    adapter_errors.push(format!("{}: {}", adapter.name(), error));
                }
            }
        }

        if all_discovered.is_empty() && !adapter_errors.is_empty() {
            return Err(DbError::QueryError(format!(
                "All job sources failed. {}",
                adapter_errors.join("; ")
            )));
        }

        // 2. Get master resume for matching
        let default_resume = ResumeRepository::get_default(&self.pool, user_id).await?;
        let parsed_resume = if let Some(resume) = default_resume {
            if let Some(json) = resume.master_resume_json.as_deref() {
                 let master: serde_json::Value = serde_json::from_str(json).unwrap_or_default();
                 serde_json::from_value(master["profile"].clone()).ok()
            } else {
                None
            }
        } else {
            None
        };

        // 3. Process each job (Matching & Deduplication & Storage)
        let mut new_jobs_count = 0;
        for discovered in all_discovered {
            // Requirement 4: Use URL deduplication as the source of truth.
            // Check for duplicates
            if let Ok(Some(_)) = JobRepository::get_by_url(&self.pool, &discovered.source_url).await {
                continue; // Skip already existing URL
            }

            // Requirement 1 & 7: Do NOT reject jobs because metadata (posted_date, company, etc.) is missing.
            // We use resume matching as the primary quality filter.

            let match_result = if let Some(resume) = &parsed_resume {
                Some(JobMatchingEngine::calculate_match(&discovered, resume))
            } else {
                None
            };

            // Store in DB
            JobRepository::create(
                &self.pool,
                user_id,
                &discovered.title,
                Some(discovered.company),
                Some(discovered.source_url.clone()),
                discovered.description,
                discovered.location,
                Some(discovered.source),
                Some(discovered.source_url),
                match_result.as_ref().map(|m| m.match_score),
                match_result.as_ref().map(|m| m.matched_skills.join(",")),
                match_result.as_ref().map(|m| m.missing_skills.join(",")),
                match_result.as_ref().map(|m| m.experience_match),
                match_result.as_ref().map(|m| m.title_match),
                discovered.posted_date.clone(),
                Some("recommended".to_string()),
            ).await?;

            new_jobs_count += 1;
        }

        Ok(new_jobs_count)
    }
}
