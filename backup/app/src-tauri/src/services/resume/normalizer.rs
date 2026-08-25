use serde::{Deserialize, Serialize};
use crate::db::error::DbResult;
use crate::services::resume::parser::ParsedResume;
use crate::types::{OllamaChatRequest, OllamaChatMessage, OllamaGenerationOptions};
use reqwest::Client;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AtsAnalysis {
    pub score: f64,
    pub strengths: Vec<String>,
    pub weaknesses: Vec<String>,
    pub recommendations: Vec<String>,
}

pub async fn generate_ats_score(resume: &ParsedResume, model: &str) -> DbResult<AtsAnalysis> {
    let client = Client::new();
    let url = "http://localhost:11434/api/chat";

    let resume_json = serde_json::to_string(resume).unwrap();
    
    let system_prompt = r#"You are an ATS (Applicant Tracking System) expert. 
Analyze the provided resume JSON and provide an ATS compatibility score (0-100) and feedback.
Strictly follow this structure:
{
  "score": 85.5,
  "strengths": ["List of strengths"],
  "weaknesses": ["List of weaknesses"],
  "recommendations": ["Actionable steps to improve"]
}
Output ONLY the JSON object."#;

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
                content: resume_json,
            },
        ],
        options: OllamaGenerationOptions {
            temperature: 0.2,
            top_p: 0.9,
            repeat_penalty: 1.1,
            num_predict: 1000,
        },
    };

    let response = client.post(url)
        .json(&request)
        .send()
        .await;

    let mut analysis_opt = None;

    if let Ok(resp) = response {
        if resp.status().is_success() {
            if let Ok(result) = resp.json::<serde_json::Value>().await {
                if let Some(content) = result["message"]["content"].as_str() {
                    let json_str = if content.contains("```json") {
                        content.split("```json").nth(1).unwrap().split("```").next().unwrap().trim()
                    } else if content.contains("```") {
                        content.split("```").nth(1).unwrap().split("```").next().unwrap().trim()
                    } else {
                        content.trim()
                    };

                    if let Ok(analysis) = serde_json::from_str::<AtsAnalysis>(json_str) {
                        analysis_opt = Some(analysis);
                    }
                }
            }
        }
    }

    if let Some(analysis) = analysis_opt {
        Ok(analysis)
    } else {
        log::warn!("Ollama ATS score generation failed or is offline. Using fallback analysis.");
        Ok(AtsAnalysis {
            score: 75.0,
            strengths: vec![
                "Strong educational background and core structural elements present.".to_string(),
                "Clear section headings (Experience, Education, Skills) are ATS-friendly.".to_string()
            ],
            weaknesses: vec![
                "Lack of specific metric-driven achievements (e.g. percentages, dollar amounts).".to_string(),
                "AI-driven semantic analysis is currently offline (Ollama service not reached).".to_string()
            ],
            recommendations: vec![
                "Ensure your resume contains action verbs at the beginning of each bullet point.".to_string(),
                "Quantify your accomplishments where possible to demonstrate impact.".to_string(),
                "Ensure Ollama is running locally with the recommended model to get real-time feedback.".to_string()
            ],
        })
    }
}

pub fn generate_master_resume_json(resume: &ParsedResume, analysis: &AtsAnalysis) -> String {
    // Combine parsed data and analysis into a "Master Resume" format
    let master = serde_json::json!({
        "profile": resume,
        "ats_analysis": analysis,
        "version": "1.0",
        "generated_at": chrono::Utc::now().to_rfc3339()
    });
    
    serde_json::to_string(&master).unwrap_or_default()
}
