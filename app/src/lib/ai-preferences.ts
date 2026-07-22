import { invoke } from "@tauri-apps/api/core";

export type AgentOption = {
  id: string;
  name: string;
  model: string;
  speed: string;
  quality: string;
  privacy: string;
  bestFor: string;
  free: boolean;
  cpuFriendliness: string;
  recommended?: boolean;
};

export type SetupDiagnostics = {
  os: string;
  arch: string;
  ramGb: number;
  performanceTier: string;
  ollamaInstalled: boolean;
  ollamaRunning: boolean;
  installedModels: string[];
  recommendedModel?: string | null;
};

export type ModelCatalogItem = {
  name: string;
  sizeLabel: string;
  estimatedRamGb: number;
  speed: string;
  quality: string;
  bestUseCase: string;
  free: boolean;
  installed: boolean;
  recommended: boolean;
  tag: string;
};

type ModelCatalogResponse = {
  success: boolean;
  models: ModelCatalogItem[];
  recommendedModel?: string | null;
  error?: string | null;
};

type OllamaModelInfo = {
  name: string;
  quality: string;
  speed: string;
  cpuFriendliness: string;
  recommended: boolean;
};

type OllamaModelsResponse = {
  success: boolean;
  models: OllamaModelInfo[];
  recommendedModel?: string | null;
  error?: string | null;
};

const FALLBACK_AGENTS: AgentOption[] = [
  {
    id: "qwen2_5_3b",
    name: "Qwen 2.5 3B",
    model: "qwen2.5:3b",
    speed: "Fast",
    quality: "Strong",
    privacy: "100% Local",
    bestFor: "Balanced daily assistant",
    free: true,
    cpuFriendliness: "High",
    recommended: true,
  },
  {
    id: "phi3_mini",
    name: "Phi-3 Mini",
    model: "phi3:mini",
    speed: "Fast",
    quality: "Good+",
    privacy: "100% Local",
    bestFor: "Structured responses",
    free: true,
    cpuFriendliness: "High",
  },
  {
    id: "mistral_7b",
    name: "Mistral 7B",
    model: "mistral:7b",
    speed: "Medium",
    quality: "Very Strong",
    privacy: "100% Local",
    bestFor: "Creative and nuanced writing",
    free: true,
    cpuFriendliness: "Medium",
  },
];

function prettyName(model: string): string {
  return model
    .replace(":", " ")
    .split(/[\/\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function getAvailableAgents(): Promise<AgentOption[]> {
  try {
    const result = await invoke<OllamaModelsResponse>("list_ollama_models");
    if (!result.success || !result.models.length) {
      return FALLBACK_AGENTS;
    }

    return result.models.map((item) => ({
      id: item.name.replace(/[^a-z0-9]+/gi, "_").toLowerCase(),
      name: prettyName(item.name),
      model: item.name,
      speed: item.speed,
      quality: item.quality,
      privacy: "100% Local",
      bestFor: item.recommended ? "Best default for your machine" : "General purpose local AI",
      free: true,
      cpuFriendliness: item.cpuFriendliness,
      recommended: item.recommended,
    }));
  } catch {
    return FALLBACK_AGENTS;
  }
}

export async function getSetupDiagnostics(): Promise<SetupDiagnostics | null> {
  try {
    return await invoke<SetupDiagnostics>("get_setup_diagnostics");
  } catch {
    return null;
  }
}

export async function getModelCatalog(): Promise<ModelCatalogItem[]> {
  try {
    const result = await invoke<ModelCatalogResponse>("list_model_catalog");
    if (!result.success) return [];
    return result.models;
  } catch {
    return [];
  }
}

export async function getCurrentModel() {
  try {
    return await invoke<string>("db_get_selected_model");
  } catch {
    return FALLBACK_AGENTS[0].model;
  }
}

export async function getCurrentProvider() {
  try {
    return await invoke<string>("db_get_selected_provider");
  } catch {
    return "ollama";
  }
}

export async function setAgentByModel(
  model: string,
  name?: string,
) {
  await invoke("db_set_selected_provider", {
    provider: "ollama",
  });

  await invoke("db_set_selected_model", {
    model,
  });

  localStorage.setItem(
    "ai_agent_name",
    name || prettyName(model),
  );

  window.dispatchEvent(
    new Event("ai-preferences-updated"),
  );
}