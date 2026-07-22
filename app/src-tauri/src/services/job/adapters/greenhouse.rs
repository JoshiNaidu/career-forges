use async_trait::async_trait;
use crate::db::error::DbResult;
use crate::services::job::{JobSourceAdapter, DiscoveredJob, JobSearchQuery};
use super::fetch_duckduckgo_jobs;

pub struct GreenhouseAdapter;

#[async_trait]
impl JobSourceAdapter for GreenhouseAdapter {
    fn name(&self) -> &'static str { "Greenhouse" }
    
    async fn search(&self, query: &JobSearchQuery) -> DbResult<Vec<DiscoveredJob>> {
        fetch_duckduckgo_jobs("site:boards.greenhouse.io OR site:jobs.lever.co OR site:ashbyhq.com", query).await
    }
}
