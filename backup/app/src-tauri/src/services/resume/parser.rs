use serde::{Deserialize, Serialize};
use crate::db::error::{DbError, DbResult};
use crate::types::{OllamaChatRequest, OllamaChatMessage, OllamaGenerationOptions};
use reqwest::Client;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkExperience {
    pub title: Option<String>,
    pub company: Option<String>,
    pub location: Option<String>,
    pub duration: Option<String>,
    pub description: Option<String>,
    #[serde(default)]
    pub bullets: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Education {
    pub degree: Option<String>,
    pub institution: Option<String>,
    pub location: Option<String>,
    pub year: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub name: Option<String>,
    pub description: Option<String>,
    pub technologies: Vec<String>,
    pub link: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedResume {
    pub name: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub location: Option<String>,
    pub summary: Option<String>,
    #[serde(default)]
    pub skills: Vec<String>,
    #[serde(default)]
    pub experience: Vec<WorkExperience>,
    #[serde(default)]
    pub education: Vec<Education>,
    #[serde(default)]
    pub certifications: Vec<String>,
    #[serde(default)]
    pub projects: Vec<Project>,
    #[serde(default)]
    pub languages: Vec<String>,
}

use regex::Regex;

pub fn parse_resume_text_regex(text: &str) -> ParsedResume {
    let mut parsed = ParsedResume {
        name: None,
        email: None,
        phone: None,
        location: None,
        summary: None,
        skills: Vec::new(),
        experience: Vec::new(),
        education: Vec::new(),
        certifications: Vec::new(),
        projects: Vec::new(),
        languages: Vec::new(),
    };

    // 1. Extract Email
    let email_re = Regex::new(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}").unwrap();
    parsed.email = email_re.find(text).map(|m| m.as_str().to_string());

    // 2. Extract Phone
    let phone_re = Regex::new(r"(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}").unwrap();
    parsed.phone = phone_re.find(text).map(|m| m.as_str().to_string());

    // 3. Extract Name (Usually at the top)
    let lines: Vec<&str> = text.lines().filter(|l| !l.trim().is_empty()).collect();
    if !lines.is_empty() {
        parsed.name = Some(lines[0].trim().to_string());
    }

    // 4. Extract Skills (Look for "Skills" section)
    let skills_re = Regex::new(r"(?i)skills:?\s*([\s\S]+?)(?:\n\n|\n[A-Z][a-z]+|$)").unwrap();
    if let Some(caps) = skills_re.captures(text) {
        let skills_text = caps.get(1).map_or("", |m| m.as_str());
        parsed.skills = skills_text
            .split(&[',', '\n', '•', '|'][..])
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty() && s.len() < 50)
            .collect();
    }

    // 5. Extract Summary
    let summary_re = Regex::new(r"(?i)(?:summary|professional profile|about me):?\s*([\s\S]+?)(?:\n\n|\n[A-Z][a-z]+|$)").unwrap();
    if let Some(caps) = summary_re.captures(text) {
        parsed.summary = Some(caps.get(1).map_or("", |m| m.as_str().trim()).to_string());
    }

    // 6. Basic Experience Extraction
    let exp_re = Regex::new(r"(?i)(?:experience|work history|employment):?\s*([\s\S]+?)(?:\n\n|\n[A-Z][a-z]+|$)").unwrap();
    if let Some(caps) = exp_re.captures(text) {
        let exp_text = caps.get(1).map_or("", |m| m.as_str().trim());
        // Split by double newline or common separators
        for block in exp_text.split("\n\n") {
            if block.trim().is_empty() { continue; }
            let block_lines: Vec<&str> = block.lines().collect();
            if !block_lines.is_empty() {
                parsed.experience.push(WorkExperience {
                    title: Some(block_lines[0].trim().to_string()),
                    company: block_lines.get(1).map(|l| l.trim().to_string()),
                    location: None,
                    duration: None,
                    description: Some(block.to_string()),
                    bullets: block_lines.iter().skip(2)
                        .filter(|l| l.trim().starts_with('•') || l.trim().starts_with('-'))
                        .map(|l| l.trim().trim_start_matches(['•', '-', ' ']).trim().to_string())
                        .collect(),
                });
            }
        }
    }

    parsed
}

pub async fn parse_resume_text(text: &str, model: &str) -> DbResult<ParsedResume> {
    let client = Client::new();
    let url = "http://localhost:11434/api/chat";

    let system_prompt = r#"You are a professional resume parser. 
Extract information from the provided resume text into a valid JSON format.
Strictly follow this structure:
{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "phone number",
  "location": "City, Country",
  "summary": "Professional summary",
  "skills": ["Skill 1", "Skill 2"],
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "location": "Location",
      "duration": "Dates",
      "description": "Short description",
      "bullets": ["Achievement 1", "Achievement 2"]
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "institution": "University Name",
      "location": "Location",
      "year": "Year"
    }
  ],
  "certifications": ["Cert 1", "Cert 2"],
  "projects": [
    {
      "name": "Project Name",
      "description": "Description",
      "technologies": ["Tech 1"],
      "link": "URL"
    }
  ],
  "languages": ["Language 1"]
}
If any field is missing, use null or an empty array. Output ONLY the JSON object, no other text."#;

    let request = OllamaChatRequest {
        model: model.to_string(),
        stream: false,
        messages: vec![
            OllamaChatMessage {
                role: "system".to_string(),
                content: system_prompt.to_string(),
            },
            OllamaChatMessage {
                role: "user".to_string(),
                content: text.to_string(),
            },
        ],
        options: OllamaGenerationOptions {
            temperature: 0.1,
            top_p: 0.9,
            repeat_penalty: 1.1,
            num_predict: 2000,
        },
    };

    let response = client.post(url)
        .json(&request)
        .send()
        .await
        .map_err(|e| DbError::QueryError(format!("Failed to call Ollama: {}", e)))?;

    let result: serde_json::Value = response.json()
        .await
        .map_err(|e| DbError::QueryError(format!("Failed to parse Ollama response: {}", e)))?;

    let content = result["message"]["content"].as_str()
        .ok_or_else(|| DbError::QueryError("No content in Ollama response".into()))?;

    // Extract JSON from potential markdown blocks
    let json_str = if content.contains("```json") {
        content.split("```json").nth(1).unwrap().split("```").next().unwrap().trim()
    } else if content.contains("```") {
        content.split("```").nth(1).unwrap().split("```").next().unwrap().trim()
    } else {
        content.trim()
    };

    let parsed: ParsedResume = serde_json::from_str(json_str)
        .map_err(|e| DbError::QueryError(format!("Failed to parse resume JSON: {}. Content was: {}", e, json_str)))?;

    Ok(parsed)
}
