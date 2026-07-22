use async_trait::async_trait;
use crate::db::error::DbResult;
use crate::services::job::{JobSourceAdapter, DiscoveredJob, JobSearchQuery};
use super::fetch_duckduckgo_jobs;

pub struct LinkedInAdapter;

#[async_trait]
impl JobSourceAdapter for LinkedInAdapter {
    fn name(&self) -> &'static str { "LinkedIn" }
    
    async fn search(&self, query: &JobSearchQuery) -> DbResult<Vec<DiscoveredJob>> {
        fetch_duckduckgo_jobs("site:linkedin.com/jobs/", query).await
    }
}
