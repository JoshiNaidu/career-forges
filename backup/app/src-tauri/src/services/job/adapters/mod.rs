pub mod linkedin;
pub mod indeed;
pub mod greenhouse;

pub use linkedin::LinkedInAdapter as LinkedIn;
pub use indeed::IndeedAdapter as Indeed;
pub use greenhouse::GreenhouseAdapter as Greenhouse;

use crate::services::job::{DiscoveredJob, JobSearchQuery};
use crate::db::error::{DbError, DbResult};
use reqwest::Client;
use regex::Regex;
use std::time::Duration;

pub async fn fetch_duckduckgo_jobs(site_filter: &str, query: &JobSearchQuery) -> DbResult<Vec<DiscoveredJob>> {
    let client = Client::builder()
        .timeout(Duration::from_secs(20))
        .build()
        .map_err(|e| DbError::QueryError(format!("Failed to build job search client: {}", e)))?;

    let mut search_parts = vec![site_filter.to_string()];
    
    if let Some(title) = &query.title {
        if !title.trim().is_empty() {
            search_parts.push(format!("\"{}\"", title.trim()));
        }
    } else if let Some(skill) = query.skills.iter().find(|skill| !skill.trim().is_empty()) {
        search_parts.push(format!("\"{} developer\"", skill.trim()));
    }
    
    if let Some(loc) = &query.location {
        if !loc.trim().is_empty() {
            search_parts.push(format!("\"{}\"", loc.trim()));
        }
    }
    
    if query.remote {
        search_parts.push("remote".to_string());
    }

    let search_term = search_parts.join(" ");
    let mut url = reqwest::Url::parse("https://html.duckduckgo.com/html/").unwrap();
    url.query_pairs_mut().append_pair("q", &search_term);
    url.query_pairs_mut().append_pair("df", "w"); // Past week for latest results

    log::info!("Job search query: {}", search_term);
    
    let response = client.get(url)
        .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
        .send()
        .await
        .map_err(|e| DbError::QueryError(format!("DuckDuckGo request failed: {}", e)))?;

    if !response.status().is_success() {
        return Err(DbError::QueryError(format!(
            "DuckDuckGo returned HTTP {}",
            response.status()
        )));
    }
        
    let html = response.text().await.map_err(|e| DbError::QueryError(format!("Failed to get DuckDuckGo response text: {}", e)))?;
    
    // Simple regex-based parsing of DDG HTML
    // Looking for results: <a class="result__a" rel="noopener" href="...">Title</a>
    let result_re = Regex::new(r#"class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]+?)</a>"#).unwrap();
    
    let mut jobs = Vec::new();
    
    for cap in result_re.captures_iter(&html) {
        let raw_url = cap[1].to_string();
        let title = clean_result_title(&cap[2]);
        // DuckDuckGo uses a redirect URL in the 'uddg' parameter
        let source_url = extract_source_url(&raw_url);

        if title.is_empty() || source_url.is_empty() {
            continue;
        }
        
        // Extract site name for better display
        let site_name = if source_url.contains("linkedin.com") {
            "LinkedIn"
        } else if source_url.contains("indeed.com") {
            "Indeed"
        } else if source_url.contains("greenhouse.io") || source_url.contains("lever.co") {
            "Greenhouse/Lever"
        } else {
            "Job Board"
        };

        match fetch_job_page_metadata(&client, &source_url, site_name, &title, query).await {
            Ok(Some(job)) => jobs.push(job),
            Ok(None) => {
                log::info!("Page metadata extraction returned None for {}, using search result data instead.", source_url);
                jobs.push(DiscoveredJob {
                    title: title.clone(),
                    company: "Unknown Company".to_string(),
                    location: query.location.clone(),
                    source: site_name.to_string(),
                    source_url: source_url.clone(),
                    description: Some("Job found via search. Click link for full details.".to_string()),
                    salary_min: None,
                    salary_max: None,
                    job_type: None,
                    posted_date: Some(chrono::Utc::now().to_rfc3339()),
                });
            }
            Err(error) => {
                log::warn!("Failed to fetch job page metadata for {}: {}. Using search result data.", source_url, error);
                jobs.push(DiscoveredJob {
                    title: title.clone(),
                    company: "Unknown Company".to_string(),
                    location: query.location.clone(),
                    source: site_name.to_string(),
                    source_url: source_url.clone(),
                    description: Some("Job found via search. Click link for full details.".to_string()),
                    salary_min: None,
                    salary_max: None,
                    job_type: None,
                    posted_date: Some(chrono::Utc::now().to_rfc3339()),
                });
            }
        }
        
        if jobs.len() >= 20 { break; }
    }
    
    Ok(jobs)
}

async fn fetch_job_page_metadata(
    client: &Client,
    source_url: &str,
    source_name: &str,
    fallback_title: &str,
    query: &JobSearchQuery,
) -> DbResult<Option<DiscoveredJob>> {
    let response = client.get(source_url)
        .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")
        .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
        .send()
        .await
        .map_err(|e| DbError::QueryError(format!("Job page request failed: {}", e)))?;

    if !response.status().is_success() {
        return Ok(None);
    }

    let final_url = response.url().to_string();
    let html = response.text().await.map_err(|e| DbError::QueryError(format!("Failed to read job page: {}", e)))?;

    let metadata = extract_job_metadata(&html);
    let title = metadata.title
        .or_else(|| extract_html_title(&html))
        .unwrap_or_else(|| fallback_title.to_string());
    let company = metadata.company;
    let posted_date = metadata.posted_date.and_then(|value| normalize_posted_date(&value));
    let apply_url = metadata.apply_url.unwrap_or(final_url);

    // Requirement 1 & 2: Lax metadata requirements. 
    // Only title and source_url (apply_url) are absolutely required.
    // We do NOT reject jobs if company or posted_date is missing.
    Ok(Some(DiscoveredJob {
        title,
        company: company.unwrap_or_else(|| "Unknown Company".to_string()),
        location: metadata.location.or_else(|| query.location.clone()),
        source: source_name.to_string(),
        source_url: apply_url,
        description: metadata.description,
        salary_min: None,
        salary_max: None,
        job_type: metadata.job_type,
        posted_date,
    }))
}

#[derive(Default)]
struct JobPageMetadata {
    title: Option<String>,
    company: Option<String>,
    location: Option<String>,
    description: Option<String>,
    job_type: Option<String>,
    posted_date: Option<String>,
    apply_url: Option<String>,
}

fn extract_job_metadata(html: &str) -> JobPageMetadata {
    let mut metadata = extract_json_ld_job_metadata(html).unwrap_or_default();

    if metadata.title.is_none() {
        metadata.title = extract_meta_content(html, &["og:title", "twitter:title"]);
    }

    if metadata.description.is_none() {
        metadata.description = extract_meta_content(html, &["description", "og:description", "twitter:description"]);
    }

    if metadata.posted_date.is_none() {
        metadata.posted_date = extract_meta_content(html, &["datePosted", "article:published_time"])
            .or_else(|| extract_relative_posted_date(html));
    }

    metadata
}

fn extract_json_ld_job_metadata(html: &str) -> Option<JobPageMetadata> {
    let script_re = Regex::new(r#"(?is)<script[^>]+type=["']application/ld\+json["'][^>]*>(.*?)</script>"#).unwrap();

    for cap in script_re.captures_iter(html) {
        let json = decode_html_entities(cap[1].trim());
        if let Ok(value) = serde_json::from_str::<serde_json::Value>(&json) {
            if let Some(job) = find_job_posting(&value) {
                return Some(metadata_from_job_posting(job));
            }
        }
    }

    None
}

fn find_job_posting(value: &serde_json::Value) -> Option<&serde_json::Value> {
    if is_job_posting(value) {
        return Some(value);
    }

    if let Some(items) = value.as_array() {
        return items.iter().find_map(find_job_posting);
    }

    if let Some(graph) = value.get("@graph") {
        return find_job_posting(graph);
    }

    None
}

fn is_job_posting(value: &serde_json::Value) -> bool {
    let Some(job_type) = value.get("@type") else {
        return false;
    };

    if let Some(type_name) = job_type.as_str() {
        return type_name.eq_ignore_ascii_case("JobPosting");
    }

    job_type.as_array()
        .map(|items| items.iter().any(|item| item.as_str().map(|s| s.eq_ignore_ascii_case("JobPosting")).unwrap_or(false)))
        .unwrap_or(false)
}

fn metadata_from_job_posting(job: &serde_json::Value) -> JobPageMetadata {
    JobPageMetadata {
        title: json_string(job.get("title")),
        company: job.get("hiringOrganization")
            .and_then(|org| json_string(org.get("name")).or_else(|| org.as_str().map(|s| s.to_string()))),
        location: extract_json_location(job.get("jobLocation")),
        description: json_string(job.get("description")).map(|description| clean_html_text(&description)),
        job_type: json_string(job.get("employmentType")),
        posted_date: json_string(job.get("datePosted")),
        apply_url: json_string(job.get("url")),
    }
}

fn extract_json_location(value: Option<&serde_json::Value>) -> Option<String> {
    let value = value?;

    if let Some(items) = value.as_array() {
        return items.iter().find_map(|item| extract_json_location(Some(item)));
    }

    let address = value.get("address").unwrap_or(value);
    let parts = [
        json_string(address.get("addressLocality")),
        json_string(address.get("addressRegion")),
        json_string(address.get("addressCountry")).or_else(|| address.get("addressCountry").and_then(|country| json_string(country.get("name")))),
    ];

    let location = parts.into_iter()
        .flatten()
        .filter(|part| !part.trim().is_empty())
        .collect::<Vec<_>>()
        .join(", ");

    if location.is_empty() {
        json_string(value.get("name"))
    } else {
        Some(location)
    }
}

fn json_string(value: Option<&serde_json::Value>) -> Option<String> {
    value.and_then(|value| value.as_str())
        .map(decode_html_entities)
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
}

fn normalize_posted_date(value: &str) -> Option<String> {
    if let Some(date) = crate::services::job::parse_posted_date_utc(value) {
        return Some(date.to_rfc3339());
    }

    parse_relative_posted_date(value).map(|date| date.to_rfc3339())
}

fn extract_relative_posted_date(html: &str) -> Option<String> {
    parse_relative_posted_date(&clean_html_text(html)).map(|date| date.to_rfc3339())
}

fn parse_relative_posted_date(value: &str) -> Option<chrono::DateTime<chrono::Utc>> {
    let relative_re = Regex::new(r#"(?i)\b(?:posted|listed)?\s*(\d+)\s*(minute|minutes|hour|hours|day|days)\s*ago\b"#).unwrap();
    let cap = relative_re.captures(value)?;
    let amount: i64 = cap[1].parse().ok()?;
    let unit = cap[2].to_lowercase();
    let now = chrono::Utc::now();

    if unit.starts_with("minute") {
        Some(now - chrono::Duration::minutes(amount))
    } else if unit.starts_with("hour") {
        Some(now - chrono::Duration::hours(amount))
    } else if unit.starts_with("day") {
        Some(now - chrono::Duration::days(amount))
    } else {
        None
    }
}

fn extract_meta_content(html: &str, keys: &[&str]) -> Option<String> {
    for key in keys {
        let escaped = regex::escape(key);
        let attr_before_content = Regex::new(&format!(
            r#"(?is)<meta[^>]+(?:property|name|itemprop)=["']{}["'][^>]+content=["']([^"']+)["'][^>]*>"#,
            escaped
        )).unwrap();
        let content_before_attr = Regex::new(&format!(
            r#"(?is)<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name|itemprop)=["']{}["'][^>]*>"#,
            escaped
        )).unwrap();

        if let Some(cap) = attr_before_content.captures(html).or_else(|| content_before_attr.captures(html)) {
            let value = decode_html_entities(&cap[1]).trim().to_string();
            if !value.is_empty() {
                return Some(value);
            }
        }
    }

    None
}

fn extract_html_title(html: &str) -> Option<String> {
    let title_re = Regex::new(r#"(?is)<title[^>]*>(.*?)</title>"#).unwrap();
    title_re.captures(html)
        .map(|cap| clean_html_text(&cap[1]))
        .filter(|title| !title.is_empty())
}

fn clean_html_text(value: &str) -> String {
    let tag_re = Regex::new(r"(?is)<[^>]+>").unwrap();
    decode_html_entities(&tag_re.replace_all(value, " "))
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}

fn clean_result_title(title_html: &str) -> String {
    let tag_re = Regex::new(r"<[^>]+>").unwrap();
    decode_html_entities(&tag_re.replace_all(title_html, ""))
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}

fn extract_source_url(raw_url: &str) -> String {
    let normalized = decode_html_entities(raw_url);
    let parse_target = if normalized.starts_with("//") {
        format!("https:{}", normalized)
    } else if normalized.starts_with('/') {
        format!("https://duckduckgo.com{}", normalized)
    } else {
        normalized.clone()
    };

    if let Ok(parsed) = reqwest::Url::parse(&parse_target) {
        if let Some((_, value)) = parsed.query_pairs().find(|(key, _)| key == "uddg") {
            return value.into_owned();
        }
    }

    normalized
}

fn decode_html_entities(value: &str) -> String {
    value
        .replace("&amp;", "&")
        .replace("&quot;", "\"")
        .replace("&#x27;", "'")
        .replace("&#39;", "'")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
}
