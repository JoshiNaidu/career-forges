use serde::{Deserialize, Serialize};
use async_trait::async_trait;
use crate::db::error::DbResult;
use chrono::{DateTime, NaiveDate, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscoveredJob {
    pub title: String,
    pub company: String,
    pub location: Option<String>,
    pub source: String,
    pub source_url: String,
    pub description: Option<String>,
    pub salary_min: Option<f64>,
    pub salary_max: Option<f64>,
    pub job_type: Option<String>,
    pub posted_date: Option<String>,
}

#[async_trait]
pub trait JobSourceAdapter: Send + Sync {
    fn name(&self) -> &'static str;
    async fn search(&self, query: &JobSearchQuery) -> DbResult<Vec<DiscoveredJob>>;
}

#[derive(Debug, Clone)]
pub struct JobSearchQuery {
    pub title: Option<String>,
    pub location: Option<String>,
    pub skills: Vec<String>,
    pub experience_years: Option<f32>,
    pub remote: bool,
}

const _JOB_FRESHNESS_HOURS: i64 = 24;

pub fn is_recent_job(job: &DiscoveredJob) -> bool {
    // Requirement 7: Do NOT reject jobs because posted_date is missing.
    let Some(posted_date_str) = &job.posted_date else {
        return true;
    };

    parse_posted_date_utc(posted_date_str)
        .map(|posted_at| {
            let age = Utc::now().signed_duration_since(posted_at);
            // Relaxed check: accept anything from the past month or undated
            age.num_seconds() >= 0 && age <= chrono::Duration::days(30)
        })
        .unwrap_or(true) // Accept if date parsing fails
}

pub fn parse_posted_date_utc(value: &str) -> Option<DateTime<Utc>> {
    let trimmed = value.trim();

    if trimmed.is_empty() {
        return None;
    }

    if let Ok(parsed) = DateTime::parse_from_rfc3339(trimmed) {
        return Some(parsed.with_timezone(&Utc));
    }

    if let Ok(date) = NaiveDate::parse_from_str(trimmed, "%Y-%m-%d") {
        return date.and_hms_opt(0, 0, 0).map(|dt| dt.and_utc());
    }

    for format in ["%B %d, %Y", "%b %d, %Y"] {
        if let Ok(date) = NaiveDate::parse_from_str(trimmed, format) {
            return date.and_hms_opt(0, 0, 0).map(|dt| dt.and_utc());
        }
    }

    None
}

pub mod adapters;
pub mod matching;
pub mod engine;
pub mod scheduler;

pub use engine::JobDiscoveryEngine;
pub use scheduler::JobScheduler;
