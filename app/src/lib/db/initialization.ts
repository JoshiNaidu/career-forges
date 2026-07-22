/**
 * App initialization and hydration logic
 * Runs on app startup to restore persisted state
 */

import { db } from './service';
import {
  useAppStateStore,
  useAIAgentStore,
  useSettingsStore,
} from './stores';

export interface InitializationStatus {
  appStateLoaded: boolean;
  aiAgentsLoaded: boolean;
  settingsLoaded: boolean;
  onboardingRequired: boolean;
  error: string | null;
}

/**
 * Initialize all stores from database
 * Call this once on app startup
 */
export async function initializeApp(): Promise<InitializationStatus> {
  const status: InitializationStatus = {
    appStateLoaded: false,
    aiAgentsLoaded: false,
    settingsLoaded: false,
    onboardingRequired: false,
    error: null,
  };

  try {
    // Initialize app state
    try {
      await useAppStateStore.getState().hydrate();
      status.appStateLoaded = true;

      const onboardingCompleted = useAppStateStore.getState().onboardingCompleted;
      status.onboardingRequired = !onboardingCompleted;
    } catch (error) {
      console.error('Failed to initialize app state:', error);
      status.error = `App state initialization failed: ${error}`;
    }

    // Initialize AI agents
    try {
      await useAIAgentStore.getState().loadDefaultAgent();
      await useAIAgentStore.getState().loadAgents();
      status.aiAgentsLoaded = true;
    } catch (error) {
      console.error('Failed to initialize AI agents:', error);
      status.error = `AI agents initialization failed: ${error}`;
    }

    // Initialize settings
    try {
      await useSettingsStore.getState().hydrate();
      status.settingsLoaded = true;

      // Apply theme if loaded
      const theme = useSettingsStore.getState().theme;
      applyTheme(theme);
    } catch (error) {
      console.error('Failed to initialize settings:', error);
      status.error = `Settings initialization failed: ${error}`;
    }

    return status;
  } catch (error) {
    console.error('Critical error during app initialization:', error);
    return {
      ...status,
      error: `Critical initialization error: ${error}`,
    };
  }
}

/**
 * Apply theme to the app
 */
function applyTheme(theme: 'dark' | 'light') {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }
  }
}

/**
 * Check if onboarding should be skipped
 */
export async function shouldSkipOnboarding(): Promise<boolean> {
  try {
    const completed = await db.getAppStateBool('onboarding_completed');
    return completed;
  } catch {
    return false;
  }
}

/**
 * Get the current onboarding step
 */
export async function getCurrentOnboardingStep(): Promise<string> {
  try {
    const step = await db.getAppStateString('onboarding_step');
    return step || 'welcome';
  } catch {
    return 'welcome';
  }
}

/**
 * Mark onboarding as complete and store the selected configuration
 */
export async function completeOnboarding(config: {
  provider: string;
  model: string;
  ollamaDetected?: boolean;
  claudeDetected?: boolean;
}): Promise<void> {
  try {
    const appState = useAppStateStore.getState();

    // Save all configuration
    await Promise.all([
      appState.setOnboardingCompleted(true),
      appState.setOnboardingStep('completed'),
      appState.setSelectedProvider(config.provider),
      appState.setSelectedModel(config.model),
      config.ollamaDetected ? appState.setOllamaDetected(true) : null,
      config.claudeDetected ? appState.setClaudeCliDetected(true) : null,
    ]);

    // Log activity
    await db.logActivity(
      'onboarding_completed',
      'app_state',
      'onboarding',
      undefined,
      JSON.stringify(config)
    );
  } catch (error) {
    console.error('Failed to complete onboarding:', error);
    throw error;
  }
}

/**
 * Reset app to initial state (development/testing only)
 */
export async function resetAppState(): Promise<void> {
  try {
    const appState = useAppStateStore.getState();
    const settings = useSettingsStore.getState();

    // Reset app state
    await Promise.all([
      appState.setOnboardingCompleted(false),
      appState.setOnboardingStep('welcome'),
      appState.setSelectedProvider('ollama'),
      appState.setSelectedModel('qwen2.5:3b'),
      appState.setOllamaDetected(false),
      appState.setClaudeCliDetected(false),
    ]);

    // Reset settings
    await settings.resetToDefaults();

    // Clear local storage
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('app-state-store');
      localStorage.removeItem('settings-store');
    }

    console.log('App state reset to initial state');
  } catch (error) {
    console.error('Failed to reset app state:', error);
    throw error;
  }
}

/**
 * Get app readiness status
 */
export function getAppReadiness(): {
  ready: boolean;
  onboardingComplete: boolean;
  hasDefaultAgent: boolean;
} {
  const appState = useAppStateStore.getState();
  const aiAgent = useAIAgentStore.getState();

  return {
    ready: appState.onboardingCompleted && aiAgent.defaultAgent !== null,
    onboardingComplete: appState.onboardingCompleted,
    hasDefaultAgent: aiAgent.defaultAgent !== null,
  };
}
