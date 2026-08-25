pub mod types;
pub mod utils;
pub mod db;
pub mod commands;
pub mod services;

use futures_util::StreamExt;
use reqwest::Client;
use std::sync::Arc;
use std::thread;
use std::time::Duration;
use sysinfo::System;
use tauri::Emitter;
use tauri::Manager;

use crate::commands::*;
use crate::types::*;
use crate::utils::*;
use crate::db::{init_db, MigrationRunner, get_migrations, DbPool};

// ==========================================
// UPDATED CAREERFORGES MODEL LIFECYCLE
// ==========================================

fn preferred_model(installed: &[String]) -> Option<String> {
    // ⚡ AGGRESSIVE PRIORITIZATION: Put the fastest parsing engine first
    let priorities = [
        "llama3.2:1b",
        "gemma3:4b", 
        "qwen3:8b",
        "deepseek-r1:8b", 
        "qwen3.5:latest", 
    ];
    
    for preferred in priorities {
        if installed.iter().any(|name| name == preferred) {
            return Some(preferred.to_string());
        }
    }

    // Fallback safely to anything installed, or the 1B default string
    installed.first().cloned()
}

fn model_catalog_blueprint() -> Vec<(&'static str, &'static str, f32, &'static str, &'static str, &'static str, &'static str)> {
    // Exact structural map of the PowerShell script selection array
    vec![
        ("llama3.2:1b", "1.3 GB", 2.0, "Fastest", "Good", "Fastest low-RAM option", "low"),
        ("gemma3:4b", "3.0 GB", 4.0, "Fast", "Good+", "Lightweight and fast assistant", "low"),
        ("deepseek-r1:8b", "5.0 GB", 8.0, "Slow-Medium", "Exceptional", "Strong chain-of-thought reasoning", "mid"),
        ("qwen3:8b", "5.2 GB", 8.0, "Medium", "Strong", "Recommended for CareerForges", "mid"),
        ("qwen3.5:latest", "6.6 GB", 12.0, "Medium", "Excellent", "Better reasoning capability", "high"),
        ("gemma3:12b", "8.0 GB", 16.0, "Medium", "Very Strong", "Higher quality responses", "high"),
        ("qwen3:14b", "10.0 GB", 24.0, "Slow", "Best Local", "Maximum local execution quality", "high"),
    ]
}

fn performance_tier(ram_gb: u64) -> String {
    if ram_gb <= 8 {
        "Low RAM".to_string()
    } else if ram_gb <= 16 {
        "Mid Range".to_string()
    } else {
        "High End".to_string()
    }
}

fn recommended_by_hardware(ram_gb: u64, installed: &[String]) -> Option<String> {
    // Hardware targets matching the footprints of your new models
    let candidates = if ram_gb <= 8 {
        vec!["gemma3:4b", "llama3.2:1b"]
    } else if ram_gb <= 16 {
        vec!["llama3.2:1b", "qwen3:8b", "deepseek-r1:8b", "gemma3:4b"]
    } else {
        vec!["llama3.2:1b", "deepseek-r1:8b", "gemma3:4b", "qwen3:14b", "qwen3.5:latest", "gemma3:12b", "qwen3:8b"]
    };

    for c in &candidates {
        if installed.iter().any(|m| m == c) {
            return Some(c.to_string());
        }
    }
    Some(candidates[0].to_string())
}

fn estimate_model(name: &str) -> (String, String, String) {
    let lowered = name.to_lowercase();
    
    // DeepSeek R1 reasoning parameters
    if lowered.contains("deepseek") {
        return (
            "Exceptional (Reasoning)".to_string(),
            "Moderate".to_string(),
            "Medium".to_string(),
        );
    }
    // High-parameter targets
    if lowered.contains("14b") || lowered.contains("12b") || lowered.contains("3.5") {
        return (
            "Very High".to_string(),
            "Slow".to_string(),
            "Low".to_string(),
        );
    }
    // Standard flagship tiers (8B)
    if lowered.contains("8b") || lowered.contains("qwen3") {
        return (
            "Strong".to_string(),
            "Medium".to_string(),
            "High".to_string(),
        );
    }
    // Ultra-lightweight alternatives
    if lowered.contains("llama") && lowered.contains("1b") {
        return (
            "Good".to_string(),
            "Very Fast".to_string(),
            "Excellent".to_string(),
        );
    }
    
    (
        "Balanced".to_string(),
        "Medium".to_string(),
        "Medium".to_string(),
    )
}

fn detect_mode(user_text: &str) -> String {
    let lower = user_text.to_lowercase();
    if ["sad", "anxious", "struggling", "depressed", "overwhelmed"]
        .iter()
        .any(|k| lower.contains(k))
    {
        return "emotional".to_string();
    }
    if ["bug", "error", "code", "typescript", "rust", "react", "api"]
        .iter()
        .any(|k| lower.contains(k))
    {
        return "coding".to_string();
    }
    if ["job", "resume", "interview", "career", "ats", "apply"]
        .iter()
        .any(|k| lower.contains(k))
    {
        return "career".to_string();
    }
    "casual".to_string()
}

fn mode_system_prompt(mode: &str) -> String {
    match mode {
        "general" => "You are a helpful, friendly AI assistant. You provide clear, concise, and useful information. You can help with anything from coding to career advice, but you are not an interviewer unless specifically asked to roleplay. Never continue the conversation on your own.".to_string(),
        "career" => "You are a practical career coach. Give direct, actionable advice. Keep answers concise unless asked for detail. Never continue the conversation on your own.".to_string(),
        "coding" => "You are a senior coding assistant. Be precise, brief, and solution-first. Prefer concrete steps and short code examples only when needed. Never continue the conversation on your own.".to_string(),
        "emotional" => "You are a calm, supportive companion. Be warm, grounded, and concise. Validate feelings without being dramatic. Offer one or two practical next steps. Never continue the conversation on your own.".to_string(),
        "interview_practice" => "You are an interview coach running a mock interview. Ask one question at a time. Wait for the candidate answer before continuing. In practice mode you may give brief hints only after the candidate answers.".to_string(),
        "interview_realistic" => "You are a professional interviewer. Ask one question at a time, do not give answers or hints, and challenge vague responses with follow-up questions. Keep realism high.".to_string(),
        "interview_technical" => "You are a strict technical interviewer. Ask focused technical questions based on stack and seniority. Never reveal ideal solutions before candidate answers.".to_string(),
        "interview_hr" => "You are an HR interviewer. Ask concise behavioral and communication questions one at a time. Do not coach during the interview.".to_string(),
        "interview_behavioral" => "You are a behavioral interviewer. Ask STAR-style questions one by one. After each answer, ask a deeper follow-up when needed.".to_string(),
        "interview_rapid_fire" => "You are running a rapid-fire interview round. Ask short, direct questions one at a time and wait for each answer.".to_string(),
        _ => "You are a friendly assistant. Respond naturally and briefly for simple questions. No over-explaining. No fake section headers. Never continue the conversation on your own.".to_string(),
    }
}

fn generation_options_for(model: &str, mode: &str) -> OllamaGenerationOptions {
    let lowered = model.to_lowercase();
    if lowered.contains("qwen") {
        return OllamaGenerationOptions {
            temperature: if mode == "coding" { 0.45 } else { 0.7 },
            top_p: 0.9,
            repeat_penalty: 1.15,
            num_predict: 450,
        };
    }
    if lowered.contains("phi") {
        return OllamaGenerationOptions {
            temperature: 0.45,
            top_p: 0.85,
            repeat_penalty: 1.1,
            num_predict: 350,
        };
    }
    if lowered.contains("mistral") {
        return OllamaGenerationOptions {
            temperature: 0.8,
            top_p: 0.92,
            repeat_penalty: 1.12,
            num_predict: 500,
        };
    }
    OllamaGenerationOptions {
        temperature: 0.6,
        top_p: 0.9,
        repeat_penalty: 1.1,
        num_predict: 380,
    }
}

fn ensure_ollama_installed(steps: &mut Vec<SetupStep>) -> bool {
    let version_check = run_cmd("ollama", &["--version"]);
    if version_check.ok {
        steps.push(SetupStep {
            name: "ollama_check".to_string(),
            status: "ok".to_string(),
            detail: if version_check.stdout.is_empty() {
                "Ollama is installed.".to_string()
            } else {
                format!("Detected: {}", version_check.stdout)
            },
        });
        return true;
    }

    steps.push(SetupStep {
        name: "ollama_check".to_string(),
        status: "missing".to_string(),
        detail: "Ollama is not installed. Attempting installation.".to_string(),
    });

    let install_result = if cfg!(target_os = "windows") {
        if command_exists("winget") {
            run_cmd(
                "winget",
                &[
                    "install",
                    "--id",
                    "Ollama.Ollama",
                    "-e",
                    "--accept-package-agreements",
                    "--accept-source-agreements",
                ],
            )
        } else if command_exists("choco") {
            run_cmd("choco", &["install", "ollama", "-y"])
        } else {
            CmdResult {
                ok: false,
                stdout: String::new(),
                stderr: "No supported package manager found. Install winget or choco.".to_string(),
            }
        }
    } else if cfg!(target_os = "macos") {
        if command_exists("brew") {
            run_cmd("brew", &["install", "--cask", "ollama"])
        } else {
            CmdResult {
                ok: false,
                stdout: String::new(),
                stderr: "Homebrew not found. Install Homebrew first.".to_string(),
            }
        }
    } else if cfg!(target_os = "linux") {
        if command_exists("curl") {
            run_cmd("sh", &["-c", "curl -fsSL https://ollama.com/install.sh | sh"])
        } else {
            CmdResult {
                ok: false,
                stdout: String::new(),
                stderr: "curl not found. Install curl first.".to_string(),
            }
        }
    } else {
        CmdResult {
            ok: false,
            stdout: String::new(),
            stderr: "Unsupported operating system.".to_string(),
        }
    };

    if install_result.ok {
        steps.push(SetupStep {
            name: "ollama_install".to_string(),
            status: "ok".to_string(),
            detail: "Ollama installation command completed.".to_string(),
        });
    } else {
        steps.push(SetupStep {
            name: "ollama_install".to_string(),
            status: "failed".to_string(),
            detail: if install_result.stderr.is_empty() {
                "Ollama installation failed.".to_string()
            } else {
                install_result.stderr
            },
        });
    }

    run_cmd("ollama", &["--version"]).ok
}

fn ensure_ollama_running(steps: &mut Vec<SetupStep>) -> bool {
    let health = run_cmd("ollama", &["list"]);
    if health.ok {
        steps.push(SetupStep {
            name: "ollama_running".to_string(),
            status: "ok".to_string(),
            detail: "Ollama service is responding.".to_string(),
        });
        return true;
    }

    steps.push(SetupStep {
        name: "ollama_running".to_string(),
        status: "warning".to_string(),
        detail: "Ollama service may not be running yet. Trying to proceed.".to_string(),
    });

    false
}

fn ensure_model_ready(model_name: &str, steps: &mut Vec<SetupStep>) -> bool {
    let list = run_cmd("ollama", &["list"]);
    if list.ok && list.stdout.to_lowercase().contains(&model_name.to_lowercase()) {
        steps.push(SetupStep {
            name: "model_check".to_string(),
            status: "ok".to_string(),
            detail: format!("Model '{}' is already available.", model_name),
        });
        return true;
    }

    steps.push(SetupStep {
        name: "model_pull".to_string(),
        status: "running".to_string(),
        detail: format!("Pulling model '{}'. This can take a few minutes.", model_name),
    });

    let pull = run_cmd("ollama", &["pull", model_name]);
    if pull.ok {
        steps.push(SetupStep {
            name: "model_pull".to_string(),
            status: "ok".to_string(),
            detail: format!("Model '{}' downloaded successfully.", model_name),
        });
        true
    } else {
        steps.push(SetupStep {
            name: "model_pull".to_string(),
            status: "failed".to_string(),
            detail: if pull.stderr.is_empty() {
                format!("Failed to pull model '{}'.", model_name)
            } else {
                pull.stderr
            },
        });
        false
    }
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn debug_updater_info() -> String {
    format!(
        "Updater configured - Check logs for more details. Version: {}",
        env!("CARGO_PKG_VERSION")
    )
}

#[tauri::command]
async fn run_ollama_setup() -> OllamaSetupReport {
    let mut steps = Vec::new();
    let model_name = "llama3.2:1b".to_string();

    steps.push(SetupStep {
        name: "environment".to_string(),
        status: "ok".to_string(),
        detail: format!("Detected {} ({})", detect_os(), detect_arch()),
    });

    let ollama_installed = ensure_ollama_installed(&mut steps);
    let ollama_running = if ollama_installed {
        ensure_ollama_running(&mut steps)
    } else {
        false
    };
    let model_ready = if ollama_installed {
        ensure_model_ready(&model_name, &mut steps)
    } else {
        false
    };

    let success = ollama_installed && model_ready;

    OllamaSetupReport {
        success,
        os: detect_os(),
        arch: detect_arch(),
        ollama_installed,
        ollama_running,
        model_ready,
        model_name,
        steps,
    }
}

#[tauri::command]
async fn get_setup_diagnostics() -> SetupDiagnostics {
    let mut sys = System::new_all();
    sys.refresh_memory();

    let ram_gb = (sys.total_memory() / 1024 / 1024).max(1);
    let ollama_installed = run_cmd("ollama", &["--version"]).ok;
    let list = run_cmd("ollama", &["list"]);
    let ollama_running = list.ok;
    let installed_models = if list.ok {
        list.stdout
            .lines()
            .skip(1)
            .filter_map(|line| line.split_whitespace().next())
            .map(|s| s.to_string())
            .collect::<Vec<_>>()
    } else {
        Vec::new()
    };

    let recommended_model = recommended_by_hardware(ram_gb, &installed_models)
        .or_else(|| preferred_model(&installed_models));

    SetupDiagnostics {
        os: detect_os(),
        arch: detect_arch(),
        ram_gb,
        performance_tier: performance_tier(ram_gb),
        ollama_installed,
        ollama_running,
        installed_models,
        recommended_model,
    }
}

#[tauri::command]
async fn list_model_catalog() -> ModelCatalogResponse {
    let diagnostics = get_setup_diagnostics().await;
    let installed = diagnostics.installed_models.clone();
    let recommended = recommended_by_hardware(diagnostics.ram_gb, &installed);

    let models = model_catalog_blueprint()
        .into_iter()
        .map(|(name, size_label, est_ram, speed, quality, use_case, tier)| {
            let tier_tag = match tier {
                "low" => "Low RAM",
                "mid" => "Recommended for your PC",
                _ => "Best Quality",
            };
            ModelCatalogItem {
                name: name.to_string(),
                size_label: size_label.to_string(),
                estimated_ram_gb: est_ram,
                speed: speed.to_string(),
                quality: quality.to_string(),
                best_use_case: use_case.to_string(),
                free: true,
                installed: installed.iter().any(|m| m == name),
                recommended: recommended.as_ref().is_some_and(|m| m == name),
                tag: tier_tag.to_string(),
            }
        })
        .collect::<Vec<_>>();

    ModelCatalogResponse {
        success: true,
        models,
        recommended_model: recommended,
        error: None,
    }
}

#[tauri::command]
async fn install_model(window: tauri::Window, model: String) -> ModelInstallResult {
    let client = Client::new();
    let req = OllamaPullRequest {
        name: model.clone(),
        stream: true,
    };
    let response = client
        .post("http://localhost:11434/api/pull")
        .json(&req)
        .send()
        .await;

    let Ok(http_response) = response else {
        return ModelInstallResult {
            success: false,
            model,
            error: Some("Could not connect to Ollama pull API.".to_string()),
        };
    };

    let mut stream = http_response.bytes_stream();
    let mut buf = String::new();

    while let Some(item) = stream.next().await {
        let Ok(bytes) = item else {
            return ModelInstallResult {
                success: false,
                model,
                error: Some("Model download stream interrupted.".to_string()),
            };
        };
        buf.push_str(&String::from_utf8_lossy(&bytes));

        while let Some(pos) = buf.find('\n') {
            let line = buf[..pos].trim().to_string();
            buf = buf[pos + 1..].to_string();
            if line.is_empty() {
                continue;
            }
            let parsed = serde_json::from_str::<OllamaPullStreamChunk>(&line);
            let Ok(chunk) = parsed else {
                continue;
            };

            if let Some(err) = chunk.error {
                return ModelInstallResult {
                    success: false,
                    model,
                    error: Some(err),
                };
            }

            let percent = match (chunk.completed, chunk.total) {
                (Some(c), Some(t)) if t > 0 => Some((c as f32 / t as f32) * 100.0),
                _ => None,
            };
            let _ = window.emit(
                "model-install-progress",
                ModelInstallProgressPayload {
                    model: model.clone(),
                    status: chunk.status.unwrap_or_else(|| "downloading".to_string()),
                    completed: chunk.completed,
                    total: chunk.total,
                    percent,
                },
            );
        }
    }

    ModelInstallResult {
        success: true,
        model,
        error: None,
    }
}

#[tauri::command]
async fn uninstall_model(model: String) -> ModelInstallResult {
    let rm = run_cmd("ollama", &["rm", &model]);
    if rm.ok {
        return ModelInstallResult {
            success: true,
            model,
            error: None,
        };
    }
    ModelInstallResult {
        success: false,
        model,
        error: Some(if rm.stderr.is_empty() {
            "Failed to uninstall model.".to_string()
        } else {
            rm.stderr
        }),
    }
}

#[tauri::command]
async fn list_ollama_models() -> OllamaModelsResponse {
    let client = Client::new();
    let response = client.get("http://localhost:11434/api/tags").send().await;
    let Ok(raw) = response else {
        return OllamaModelsResponse {
            success: false,
            models: Vec::new(),
            recommended_model: None,
            error: Some("Ollama is not reachable. Start Ollama first.".to_string()),
        };
    };

    let parsed = raw.json::<OllamaTagsResponse>().await;
    let Ok(tags) = parsed else {
        return OllamaModelsResponse {
            success: false,
            models: Vec::new(),
            recommended_model: None,
            error: Some("Failed to read installed model list from Ollama.".to_string()),
        };
    };

    let installed_names: Vec<String> = tags.models.iter().map(|m| m.name.clone()).collect();
    let recommended = preferred_model(&installed_names);

    let models = installed_names
        .iter()
        .map(|name| {
            let (quality, speed, cpu_friendliness) = estimate_model(name);
            OllamaModelInfo {
                name: name.clone(),
                quality,
                speed,
                cpu_friendliness,
                recommended: recommended.as_ref().is_some_and(|r| r == name),
            }
        })
        .collect::<Vec<_>>();

    OllamaModelsResponse {
        success: true,
        models,
        recommended_model: recommended,
        error: None,
    }
}

#[tauri::command]
async fn chat_with_ollama(
    window: tauri::Window,
    messages: Vec<ChatInputMessage>,
    model: Option<String>,
    mode: Option<String>,
) -> ChatReply {
    if messages.is_empty() {
        return ChatReply {
            success: false,
            model: model.unwrap_or_else(|| "unknown".to_string()),
            response: String::new(),
            error: Some("No messages provided.".to_string()),
        };
    }

    let client = Client::new();
    let tags_res = client.get("http://localhost:11434/api/tags").send().await;
    let Ok(tags_http) = tags_res else {
        return ChatReply {
            success: false,
            model: model.unwrap_or_else(|| "unknown".to_string()),
            response: String::new(),
            error: Some("Ollama is not available. Please make sure it is running.".to_string()),
        };
    };
    let tags: OllamaTagsResponse = match tags_http.json().await {
        Ok(v) => v,
        Err(_) => OllamaTagsResponse { models: Vec::new() },
    };
    let installed_names: Vec<String> = tags.models.iter().map(|m| m.name.clone()).collect();

    let latest_user_text = messages
        .iter()
        .rev()
        .find(|m| m.role == "user")
        .map(|m| m.content.clone())
        .unwrap_or_default();
    let detected_mode = mode.unwrap_or_else(|| detect_mode(&latest_user_text));
    let selected_model = model
        .filter(|m| installed_names.iter().any(|name| name == m))
        .or_else(|| preferred_model(&installed_names))
        .unwrap_or_else(|| "llama3.2:1b".to_string());

    let mut request_messages = vec![OllamaChatMessage {
        role: "system".to_string(),
        content: mode_system_prompt(&detected_mode),
    }];

    request_messages.extend(
        messages
            .into_iter()
            .rev()
            .take(10)
            .collect::<Vec<_>>()
            .into_iter()
            .rev()
            .map(|m| OllamaChatMessage {
                role: m.role,
                content: m.content,
            }),
    );

    let req_body = OllamaChatRequest {
        model: selected_model.clone(),
        stream: true,
        messages: request_messages,
        options: generation_options_for(&selected_model, &detected_mode),
    };

    let response = client
        .post("http://localhost:11434/api/chat")
        .json(&req_body)
        .send()
        .await;

    let Ok(http_response) = response else {
        return ChatReply {
            success: false,
            model: selected_model,
            response: String::new(),
            error: Some("Failed to call Ollama chat API.".to_string()),
        };
    };

    let mut stream = http_response.bytes_stream();
    let mut buf = String::new();
    let mut final_text = String::new();

    while let Some(item) = stream.next().await {
        let Ok(bytes) = item else {
            return ChatReply {
                success: false,
                model: selected_model,
                response: final_text,
                error: Some("Streaming response interrupted.".to_string()),
            };
        };
        buf.push_str(&String::from_utf8_lossy(&bytes));

        while let Some(pos) = buf.find('\n') {
            let line = buf[..pos].trim().to_string();
            buf = buf[pos + 1..].to_string();
            if line.is_empty() {
                continue;
            }

            let chunk = serde_json::from_str::<OllamaChatStreamChunk>(&line);
            let Ok(parsed) = chunk else {
                continue;
            };

            if let Some(err) = parsed.error {
                return ChatReply {
                    success: false,
                    model: selected_model,
                    response: final_text,
                    error: Some(err),
                };
            }

            if let Some(message) = parsed.message {
                if !message.content.is_empty() {
                    final_text.push_str(&message.content);
                    let _ = window.emit(
                        "ollama-chat-chunk",
                        StreamChunkPayload {
                            chunk: message.content,
                            mode: detected_mode.clone(),
                        },
                    );
                }
            }

            if parsed.done.unwrap_or(false) {
                break;
            }
        }
    }

    ChatReply {
        success: true,
        model: selected_model,
        response: final_text.trim().to_string(),
        error: None,
    }
}

#[tauri::command]
async fn get_cpu_usage() -> f32 {
    let mut system = System::new();
    system.refresh_cpu_all();
    thread::sleep(Duration::from_millis(250));
    system.refresh_cpu_all();
    system.global_cpu_usage()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize logger
    env_logger::Builder::from_default_env()
        .format_timestamp_millis()
        .init();

    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            // Initialize database
            let app_data_dir = app
                .path()
                .app_data_dir()
                .map_err(|e| {
                    Box::new(e) as Box<dyn std::error::Error>
                })?;

            let db_path = app_data_dir.join("careerforges.db");

            let pool = tauri::async_runtime::block_on(async {
                log::info!("Initializing database at {:?}", db_path);
                let pool = init_db(&db_path).await.map_err(|e| {
                    Box::new(e) as Box<dyn std::error::Error>
                })?;
                log::info!("Database initialized successfully");

                /*
                    RUN MIGRATIONS
                */
                let migrations = get_migrations();
                let result = MigrationRunner::run_migrations(&pool, migrations).await;

                if let Err(e) = result {
                    log::warn!(
                        "Migrations failed: {}. Attempting database reset for fresh schema.",
                        e
                    );
                    // Hard reset for early development as requested by user
                    MigrationRunner::reset_database(&pool).await.map_err(|e| Box::new(e) as Box<dyn std::error::Error>)?;
                    MigrationRunner::run_migrations(&pool, get_migrations()).await.map_err(|e| Box::new(e) as Box<dyn std::error::Error>)?;
                }

                // Ensure local user exists after migrations
                log::info!("Ensuring local user exists...");
                let user_result = crate::db::UserRepository::get_by_email(&pool, "localuser@careerforges.local").await;
                if let Ok(None) = user_result {
                    let _ = crate::db::UserRepository::create(
                        &pool,
                        "localuser@careerforges.local",
                        Some("Local User".to_string()),
                    )
                    .await;
                }

                log::info!("Migrations completed successfully");

                /*
                    SQLITE TEST
                */
                let conn = db::get_connection(&pool).await.map_err(|e| {
                    Box::new(e) as Box<dyn std::error::Error>
                })?;

                conn.interact(|conn| {
                    conn.execute(
                        "
                    INSERT OR IGNORE INTO app_state (
                        key,
                        value,
                        created_at,
                        updated_at
                    )
                    VALUES (
                        'db_test',
                        'working',
                        datetime('now'),
                        datetime('now')
                    )
                    ",
                        [],
                    )
                })
                .await.map_err(|e| {
                    Box::new(e) as Box<dyn std::error::Error>
                })?.map_err(|e| {
                    Box::new(e) as Box<dyn std::error::Error>
                })?;

                println!("====================");
                println!("DB PATH: {:?}", db_path);
                println!("====================");
                println!("SQLITE TEST INSERT SUCCESS");

                Ok::<DbPool, Box<dyn std::error::Error>>(pool)
            })?;

            app.manage(pool.clone());

            // Initialize Job Scheduler in background
            let scheduler_pool = Arc::new(pool.clone());
            let scheduler_app = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let scheduler = crate::services::job::JobScheduler::new(scheduler_pool, scheduler_app);
                scheduler.start().await;
            });

            Ok(())
        })
.invoke_handler(tauri::generate_handler![
    // Legacy commands
    greet,
    debug_updater_info,
    run_ollama_setup,
    get_setup_diagnostics,
    list_ollama_models,
    list_model_catalog,
    install_model,
    uninstall_model,
    chat_with_ollama,
    get_cpu_usage,
    
    // App State Commands
    db_get_app_state,
    db_set_app_state,
    db_get_app_state_bool,
    db_get_app_state_string,
    db_list_app_state,
    db_delete_app_state,
    db_is_onboarding_completed,
    db_complete_onboarding,
    db_reset_onboarding,
    db_get_onboarding_step,
    db_set_onboarding_step,
    db_get_selected_provider,
    db_set_selected_provider,
    db_get_selected_model,
    db_set_selected_model,
    db_set_ollama_detected,
    db_set_claude_detected,
    
    // AI Agent Commands
    db_create_ai_agent,
    db_get_ai_agent,
    db_list_ai_agents_by_provider,
    db_list_installed_ai_agents,
    db_get_default_ai_agent,
    db_set_default_ai_agent,
    db_update_ai_agent_install_status,
    db_update_ai_agent_availability,
    db_delete_ai_agent,
    db_list_all_ai_agents,

    // User Commands
    db_create_user,
    db_get_user,
    db_get_user_by_email,
    db_list_users,
    db_update_user,
    db_delete_user,

    // Session Commands
    db_create_session,
    db_get_session,
    db_list_user_sessions,
    db_update_session_title,
    db_delete_session,
    db_count_user_sessions,

    // Message Commands
    db_create_message,
    db_get_message,
    db_list_session_messages,
    db_list_recent_messages,
    db_delete_message,
    db_count_session_tokens,
    
    // Settings Commands
    db_get_setting,
    db_set_setting,
    db_get_setting_bool,
    db_get_setting_string,
    db_get_setting_number,
    db_list_settings,
    db_delete_setting,
    db_reset_settings_to_defaults,
    db_get_theme,
    db_set_theme,
    db_get_auto_save_sessions,
    db_set_auto_save_sessions,
    
    // Database Health
    db_ping,
    db_get_size,

    // Resume Commands
    db_create_resume,
    db_get_resume,
    db_list_resumes,
    db_set_default_resume,
    db_get_default_resume,
    db_update_resume_content,
    db_delete_resume,
    upload_resume,
    get_resume,
    delete_resume,
    view_resume,
    download_resume,
    parse_and_store_resume,

    // Job Commands
    db_create_job,
    db_get_job,
    db_list_jobs,
    db_update_job_status,
    db_delete_job,
    fetch_jobs,
    search_jobs,
    save_job,
    reject_job,
    delete_job,
    get_jobs,
    update_job_status,
    get_scheduler_status,
    toggle_scheduler,
    update_scheduler_frequency,
    run_scheduler_now,

    // Activity Log Commands
    db_create_activity_log,
    db_list_activity_logs,

    // ATS Commands
    generate_ats_resume,
    generate_cover_letter,
    db_list_generated_resumes,
    db_list_generated_cover_letters,
    db_list_all_generated_resumes,
    db_list_all_generated_cover_letters,
    db_delete_generated_resume,
    db_delete_generated_cover_letter,
    mark_job_as_applied,
    db_list_applications,
    db_get_application_by_job,

    // Interview Commands
    db_create_interview_session,
    db_get_interview_session,
    db_list_interview_sessions,
    db_update_interview_score,
    db_delete_interview_session,
])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
