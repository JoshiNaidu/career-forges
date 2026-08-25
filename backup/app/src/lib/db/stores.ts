/**
 * Zustand stores for persistent app state, AI agents, and settings
 * These integrate with the SQLite database for persistence
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db } from './service';
import type { AppState, AIAgent, Setting, AppStateKey, SettingKey } from './models';

// ============ App State Store ============

interface AppStateStore {
  onboardingCompleted: boolean;
  onboardingStep: string;
  selectedProvider: string;
  selectedModel: string;
  ollamaDetected: boolean;
  claudeCliDetected: boolean;
  
  setOnboardingCompleted: (completed: boolean) => Promise<void>;
  setOnboardingStep: (step: string) => Promise<void>;
  setSelectedProvider: (provider: string) => Promise<void>;
  setSelectedModel: (model: string) => Promise<void>;
  setOllamaDetected: (detected: boolean) => Promise<void>;
  setClaudeCliDetected: (detected: boolean) => Promise<void>;
  
  hydrate: () => Promise<void>;
}

export const useAppStateStore = create<AppStateStore>()(
  persist(
    (set, get) => ({
      onboardingCompleted: false,
      onboardingStep: 'welcome',
      selectedProvider: 'ollama',
      selectedModel: 'qwen2.5:3b',
      ollamaDetected: false,
      claudeCliDetected: false,

      setOnboardingCompleted: async (completed: boolean) => {
        try {
          await db.setAppState('onboarding_completed', completed.toString(), 'boolean');
          set({ onboardingCompleted: completed });
        } catch (error) {
          console.error('Failed to set onboarding completed:', error);
        }
      },

      setOnboardingStep: async (step: string) => {
        try {
          await db.setAppState('onboarding_step', step, 'string');
          set({ onboardingStep: step });
        } catch (error) {
          console.error('Failed to set onboarding step:', error);
        }
      },

      setSelectedProvider: async (provider: string) => {
        try {
          await db.setAppState('selected_provider', provider, 'string');
          set({ selectedProvider: provider });
        } catch (error) {
          console.error('Failed to set selected provider:', error);
        }
      },

      setSelectedModel: async (model: string) => {
        try {
          await db.setAppState('selected_model', model, 'string');
          set({ selectedModel: model });
        } catch (error) {
          console.error('Failed to set selected model:', error);
        }
      },

      setOllamaDetected: async (detected: boolean) => {
        try {
          await db.setAppState('ollama_detected', detected.toString(), 'boolean');
          set({ ollamaDetected: detected });
        } catch (error) {
          console.error('Failed to set ollama detected:', error);
        }
      },

      setClaudeCliDetected: async (detected: boolean) => {
        try {
          await db.setAppState('claude_cli_detected', detected.toString(), 'boolean');
          set({ claudeCliDetected: detected });
        } catch (error) {
          console.error('Failed to set claude cli detected:', error);
        }
      },

      hydrate: async () => {
        try {
          const [
            onboarding,
            step,
            provider,
            model,
            ollama,
            claude,
          ] = await Promise.all([
            db.getAppStateBool('onboarding_completed'),
            db.getAppStateString('onboarding_step'),
            db.getAppStateString('selected_provider'),
            db.getAppStateString('selected_model'),
            db.getAppStateBool('ollama_detected'),
            db.getAppStateBool('claude_cli_detected'),
          ]);

          set({
            onboardingCompleted: onboarding,
            onboardingStep: step || 'welcome',
            selectedProvider: provider || 'ollama',
            selectedModel: model || 'qwen2.5:3b',
            ollamaDetected: ollama,
            claudeCliDetected: claude,
          });
        } catch (error) {
          console.error('Failed to hydrate app state:', error);
        }
      },
    }),
    {
      name: 'app-state-store',
    }
  )
);

// ============ AI Agent Store ============

interface AIAgentStore {
  agents: AIAgent[];
  defaultAgent: AIAgent | null;
  selectedProvider: string;

  addAgent: (agent: AIAgent) => void;
  removeAgent: (id: string) => void;
  updateAgent: (id: string, updates: Partial<AIAgent>) => void;
  setDefaultAgent: (agent: AIAgent) => void;
  setSelectedProvider: (provider: string) => void;

  loadAgents: () => Promise<void>;
  loadAgentsByProvider: (provider: string) => Promise<void>;
  loadDefaultAgent: () => Promise<void>;
}

export const useAIAgentStore = create<AIAgentStore>((set, get) => ({
  agents: [],
  defaultAgent: null,
  selectedProvider: 'ollama',

  addAgent: (agent: AIAgent) => {
    set((state) => ({
      agents: [agent, ...state.agents],
    }));
  },

  removeAgent: (id: string) => {
    set((state) => ({
      agents: state.agents.filter((a) => a.id !== id),
    }));
  },

  updateAgent: (id: string, updates: Partial<AIAgent>) => {
    set((state) => ({
      agents: state.agents.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      ),
    }));
  },

  setDefaultAgent: (agent: AIAgent) => {
    set({ defaultAgent: agent });
  },

  setSelectedProvider: (provider: string) => {
    set({ selectedProvider: provider });
  },

  loadAgents: async () => {
    try {
      const agents = await db.listInstalledAIAgents();
      set({ agents });
    } catch (error) {
      console.error('Failed to load AI agents:', error);
    }
  },

  loadAgentsByProvider: async (provider: string) => {
    try {
      const agents = await db.listAIAgentsByProvider(provider);
      set({ agents, selectedProvider: provider });
    } catch (error) {
      console.error('Failed to load agents by provider:', error);
    }
  },

  loadDefaultAgent: async () => {
    try {
      const agent = await db.getDefaultAIAgent();
      if (agent) {
        set({ defaultAgent: agent });
      }
    } catch (error) {
      console.error('Failed to load default agent:', error);
    }
  },
}));

// ============ Settings Store ============

interface SettingsStore {
  theme: 'dark' | 'light';
  defaultInterviewMode: string;
  autoSaveSessions: boolean;
  sessionTimeoutMinutes: number;
  enableAnalytics: boolean;
  checkForUpdates: boolean;
  resumeParserEnabled: boolean;
  aiResponseStreaming: boolean;

  setTheme: (theme: 'dark' | 'light') => Promise<void>;
  setDefaultInterviewMode: (mode: string) => Promise<void>;
  setAutoSaveSessions: (enabled: boolean) => Promise<void>;
  setSessionTimeoutMinutes: (minutes: number) => Promise<void>;
  setEnableAnalytics: (enabled: boolean) => Promise<void>;
  setCheckForUpdates: (enabled: boolean) => Promise<void>;
  setResumeParserEnabled: (enabled: boolean) => Promise<void>;
  setAiResponseStreaming: (enabled: boolean) => Promise<void>;

  hydrate: () => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      defaultInterviewMode: 'practice',
      autoSaveSessions: true,
      sessionTimeoutMinutes: 30,
      enableAnalytics: false,
      checkForUpdates: true,
      resumeParserEnabled: true,
      aiResponseStreaming: true,

      setTheme: async (theme: 'dark' | 'light') => {
        try {
          await db.setSetting('theme', theme);
          set({ theme });
        } catch (error) {
          console.error('Failed to set theme:', error);
        }
      },

      setDefaultInterviewMode: async (mode: string) => {
        try {
          await db.setSetting('default_interview_mode', mode);
          set({ defaultInterviewMode: mode });
        } catch (error) {
          console.error('Failed to set default interview mode:', error);
        }
      },

      setAutoSaveSessions: async (enabled: boolean) => {
        try {
          await db.setSetting('auto_save_sessions', enabled.toString());
          set({ autoSaveSessions: enabled });
        } catch (error) {
          console.error('Failed to set auto save sessions:', error);
        }
      },

      setSessionTimeoutMinutes: async (minutes: number) => {
        try {
          await db.setSetting('session_timeout_minutes', minutes.toString());
          set({ sessionTimeoutMinutes: minutes });
        } catch (error) {
          console.error('Failed to set session timeout:', error);
        }
      },

      setEnableAnalytics: async (enabled: boolean) => {
        try {
          await db.setSetting('enable_analytics', enabled.toString());
          set({ enableAnalytics: enabled });
        } catch (error) {
          console.error('Failed to set enable analytics:', error);
        }
      },

      setCheckForUpdates: async (enabled: boolean) => {
        try {
          await db.setSetting('check_for_updates', enabled.toString());
          set({ checkForUpdates: enabled });
        } catch (error) {
          console.error('Failed to set check for updates:', error);
        }
      },

      setResumeParserEnabled: async (enabled: boolean) => {
        try {
          await db.setSetting('resume_parser_enabled', enabled.toString());
          set({ resumeParserEnabled: enabled });
        } catch (error) {
          console.error('Failed to set resume parser enabled:', error);
        }
      },

      setAiResponseStreaming: async (enabled: boolean) => {
        try {
          await db.setSetting('ai_response_streaming', enabled.toString());
          set({ aiResponseStreaming: enabled });
        } catch (error) {
          console.error('Failed to set AI response streaming:', error);
        }
      },

      hydrate: async () => {
        try {
          const [
            theme,
            defaultMode,
            autoSave,
            timeout,
            analytics,
            updates,
            parser,
            streaming,
          ] = await Promise.all([
            db.getSettingString('theme'),
            db.getSettingString('default_interview_mode'),
            db.getSettingBool('auto_save_sessions'),
            db.getSettingNumber('session_timeout_minutes'),
            db.getSettingBool('enable_analytics'),
            db.getSettingBool('check_for_updates'),
            db.getSettingBool('resume_parser_enabled'),
            db.getSettingBool('ai_response_streaming'),
          ]);

          set({
            theme: (theme as 'dark' | 'light') || 'dark',
            defaultInterviewMode: defaultMode || 'practice',
            autoSaveSessions: autoSave,
            sessionTimeoutMinutes: timeout || 30,
            enableAnalytics: analytics,
            checkForUpdates: updates,
            resumeParserEnabled: parser,
            aiResponseStreaming: streaming,
          });
        } catch (error) {
          console.error('Failed to hydrate settings:', error);
        }
      },

      resetToDefaults: async () => {
        try {
          await db.resetSettingsToDefaults();
          set({
            theme: 'dark',
            defaultInterviewMode: 'practice',
            autoSaveSessions: true,
            sessionTimeoutMinutes: 30,
            enableAnalytics: false,
            checkForUpdates: true,
            resumeParserEnabled: true,
            aiResponseStreaming: true,
          });
        } catch (error) {
          console.error('Failed to reset settings:', error);
        }
      },
    }),
    {
      name: 'settings-store',
    }
  )
);
