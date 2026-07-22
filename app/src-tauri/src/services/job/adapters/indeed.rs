use async_trait::async_trait;
use crate::db::error::DbResult;
use crate::services::job::{JobSourceAdapter, DiscoveredJob, JobSearchQuery};
use super::fetch_duckduckgo_jobs;

pub struct IndeedAdapter;

#[async_trait]
impl JobSourceAdapter for IndeedAdapter {
    fn name(&self) -> &'static str { "Indeed" }
    
    async fn search(&self, query: &JobSearchQuery) -> DbResult<Vec<DiscoveredJob>> {
        fetch_duckduckgo_jobs("site:indeed.com/viewjob OR site:indeed.com/rc/clk OR site:indeed.com/jobs", query).await
    }
}
