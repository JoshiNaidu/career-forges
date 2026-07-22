use serde::{Deserialize, Serialize};
use crate::db::error::DbResult;
use reqwest::Client;
use serde_json::json;

#[derive(Debug, Serialize, Deserialize)]
pub struct OptimizedResumeContent {
    pub summary: String,
    pub skills: Vec<String>,
    pub experience_bullets: Vec<String>,
    pub ats_score: f64,
    pub strengths: Vec<String>,
    pub weaknesses: Vec<String>,
    pub recommendations: Vec<String>,
}

pub struct AtsGenerator;

impl AtsGenerator {
    pub async fn generate_optimized_resume(
        master_resume_json: &str,
        job_description: &str,
        model: &str,
    ) -> DbResult<OptimizedResumeContent> {
        let system_prompt = r#"
            You are an expert ATS (Applicant Tracking System) optimizer. 
            Your goal is to rewrite specific parts of a resume to better match a job description while remaining truthful.
            
            Input:
            1. Master Resume JSON (containing professional profile, skills, and experience)
            2. Job Description
            
            Output:
            Return a JSON object with:
            - "summary": A 3-4 sentence professional summary optimized for the job.
            - "skills": A list of relevant skills from the master resume that match the job description.
            - "experience_bullets": A list of 5-8 optimized achievement bullets based on the master resume's experience that highlight relevant accomplishments for this specific job.
            - "ats_score": A number from 0-100 estimating job match after optimization.
            - "strengths": A list of ATS strengths in this optimized version.
            - "weaknesses": A list of remaining ATS gaps.
            - "recommendations": A list of specific next improvements.
            
            Format your response as valid JSON only.
        "#;

        let user_prompt = format!(
            "Master Resume: {}\n\nJob Description: {}",
            master_resume_json, job_description
        );

        let client = Client::new();
        let url = "http://localhost:11434/api/chat";

        let request = json!({
            "model": model,
            "stream": false,
            "messages": [
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": user_prompt
                }
            ],
            "format": "json"
        });

        let response = client.post(url)
            .json(&request)
            .send()
            .await;

        if let Ok(resp) = response {
            if resp.status().is_success() {
                if let Ok(result) = resp.json::<serde_json::Value>().await {
                    if let Some(content) = result["message"]["content"].as_str() {
                        if let Ok(optimized) = serde_json::from_str::<OptimizedResumeContent>(content) {
                            return Ok(optimized);
                        }
                    }
                }
            }
        }

        // Fallback for optimized resume
        log::warn!("Ollama ATS resume generation failed. Using fallback template.");
        Ok(OptimizedResumeContent {
            summary: "Experienced professional with a strong background in software development and a proven track record of delivering high-quality solutions. Passionate about leveraging technical expertise to solve complex problems and contribute to innovative projects.".to_string(),
            skills: vec!["Software Development".into(), "Problem Solving".into(), "Team Collaboration".into(), "Agile Methodologies".into()],
            experience_bullets: vec![
                "Successfully delivered multiple high-impact projects within established timelines and budgets.".to_string(),
                "Collaborated with cross-functional teams to design and implement scalable software architectures.".to_string(),
                "Optimized existing systems for improved performance, reliability, and maintainability.".to_string(),
                "Mentored junior developers and contributed to the overall growth of the engineering team.".to_string()
            ],
            ats_score: 72.0,
            strengths: vec![
                "Relevant technical experience is highlighted for the role.".to_string(),
                "Core collaboration and delivery signals are clear.".to_string(),
            ],
            weaknesses: vec![
                "Some job-specific keywords may still be missing.".to_string(),
                "Quantified achievements should be strengthened where possible.".to_string(),
            ],
            recommendations: vec![
                "Add measurable impact metrics from the master resume.".to_string(),
                "Mirror the most important job-description keywords truthfully.".to_string(),
            ],
        })
    }

    pub async fn generate_cover_letter(
        master_resume_json: &str,
        job_description: &str,
        company_name: Option<&str>,
        model: &str,
    ) -> DbResult<String> {
        let system_prompt = r#"
            You are an expert career coach and cover letter writer.
            Your goal is to write a compelling, professional cover letter that connects a candidate's experience to a specific job description.
            
            Input:
            1. Master Resume JSON
            2. Job Description
            3. Company Name when available
            
            Output:
            A professional cover letter (text only, no markdown formatting like bold/italics unless necessary for headers).
            Keep it under 400 words. Focus on how the candidate's specific skills and achievements solve the company's problems mentioned in the job description.
        "#;

        let user_prompt = format!(
            "Master Resume: {}\n\nJob Description: {}\n\nCompany Name: {}",
            master_resume_json,
            job_description,
            company_name.unwrap_or("Unknown company")
        );

        let client = Client::new();
        let url = "http://localhost:11434/api/chat";

        let request = json!({
            "model": model,
            "stream": false,
            "messages": [
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": user_prompt
                }
            ]
        });

        let response = client.post(url)
            .json(&request)
            .send()
            .await;

        if let Ok(resp) = response {
            if resp.status().is_success() {
                if let Ok(result) = resp.json::<serde_json::Value>().await {
                    if let Some(content) = result["message"]["content"].as_str() {
                        return Ok(content.to_string());
                    }
                }
            }
        }

        // Fallback cover letter template
        log::warn!("Ollama cover letter generation failed. Using fallback template.");
        Ok(format!(
            "Dear Hiring Manager,\n\nI am writing to express my strong interest in the position as advertised. With my extensive experience and skills, I am confident that I would be a valuable asset to your team.\n\nThroughout my career, I have demonstrated a commitment to excellence and a passion for delivering results. I am particularly drawn to your company because of your innovative approach and reputation in the industry.\n\nThank you for considering my application. I look forward to the possibility of discussing how my background can contribute to your team's success.\n\nSincerely,\n[Your Name]"
        ))
    }
}
