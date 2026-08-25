use serde::{Deserialize, Serialize};

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SetupStep {
    pub name: String,
    pub status: String,
    pub detail: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OllamaSetupReport {
    pub success: bool,
    pub os: String,
    pub arch: String,
    pub ollama_installed: bool,
    pub ollama_running: bool,
    pub model_ready: bool,
    pub model_name: String,
    pub steps: Vec<SetupStep>,
}

#[derive(Clone)]
pub struct CmdResult {
    pub ok: bool,
    pub stdout: String,
    pub stderr: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ChatReply {
    pub success: bool,
    pub model: String,
    pub response: String,
    pub error: Option<String>,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ChatInputMessage {
    pub role: String,
    pub content: String,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct StreamChunkPayload {
    pub chunk: String,
    pub mode: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OllamaModelInfo {
    pub name: String,
    pub quality: String,
    pub speed: String,
    pub cpu_friendliness: String,
    pub recommended: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OllamaModelsResponse {
    pub success: bool,
    pub models: Vec<OllamaModelInfo>,
    pub recommended_model: Option<String>,
    pub error: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SetupDiagnostics {
    pub os: String,
    pub arch: String,
    pub ram_gb: u64,
    pub performance_tier: String,
    pub installed_models: Vec<String>,
    pub recommended_model: Option<String>,
    pub ollama_installed: bool,
    pub ollama_running: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelCatalogItem {
    pub name: String,
    pub size_label: String,
    pub estimated_ram_gb: f32,
    pub speed: String,
    pub quality: String,
    pub best_use_case: String,
    pub free: bool,
    pub installed: bool,
    pub recommended: bool,
    pub tag: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelCatalogResponse {
    pub success: bool,
    pub models: Vec<ModelCatalogItem>,
    pub recommended_model: Option<String>,
    pub error: Option<String>,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ModelInstallProgressPayload {
    pub model: String,
    pub status: String,
    pub completed: Option<u64>,
    pub total: Option<u64>,
    pub percent: Option<f32>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelInstallResult {
    pub success: bool,
    pub model: String,
    pub error: Option<String>,
}

#[derive(Deserialize)]
pub struct OllamaTagsResponse {
    pub models: Vec<OllamaTagModel>,
}

#[derive(Deserialize)]
pub struct OllamaTagModel {
    pub name: String,
}

#[derive(Deserialize)]
pub struct OllamaChatStreamChunk {
    pub message: Option<OllamaChatMessage>,
    pub done: Option<bool>,
    pub error: Option<String>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct OllamaChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Serialize)]
pub struct OllamaChatRequest {
    pub model: String,
    pub stream: bool,
    pub messages: Vec<OllamaChatMessage>,
    pub options: OllamaGenerationOptions,
}

#[derive(Serialize)]
pub struct OllamaGenerationOptions {
    pub temperature: f32,
    pub top_p: f32,
    pub repeat_penalty: f32,
    pub num_predict: i32,
}

#[derive(Serialize)]
pub struct OllamaPullRequest {
    pub name: String,
    pub stream: bool,
}

#[derive(Deserialize)]
pub struct OllamaPullStreamChunk {
    pub status: Option<String>,
    pub completed: Option<u64>,
    pub total: Option<u64>,
    pub error: Option<String>,
}
