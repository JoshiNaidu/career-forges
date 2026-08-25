/**
 * React hooks for app state, AI agents, and settings
 * These wrap the Zustand stores for convenient component usage
 */

import { useEffect, useCallback } from 'react';
import {
  useAppStateStore,
  useAIAgentStore,
  useSettingsStore,
} from './stores';

// ============ App State Hooks ============

export function useAppState() {
  const store = useAppStateStore();

  useEffect(() => {
    store.hydrate();
  }, [store]);

  return {
    onboardingCompleted: store.onboardingCompleted,
    onboardingStep: store.onboardingStep,
    selectedProvider: store.selectedProvider,
    selectedModel: store.selectedModel,
    ollamaDetected: store.ollamaDetected,
    claudeCliDetected: store.claudeCliDetected,

    completeOnboarding: () => store.setOnboardingCompleted(true),
    skipOnboarding: () => store.setOnboardingCompleted(false),
    goToStep: store.setOnboardingStep,
    selectProvider: store.setSelectedProvider,
    selectModel: store.setSelectedModel,
    markOllamaDetected: () => store.setOllamaDetected(true),
    markClaudeDetected: () => store.setClaudeCliDetected(true),
  };
}

export function useOnboarding() {
  const store = useAppStateStore();

  return {
    isCompleted: store.onboardingCompleted,
    currentStep: store.onboardingStep,
    complete: () => store.setOnboardingCompleted(true),
    goToStep: store.setOnboardingStep,
  };
}

export function useAIProviders() {
  const store = useAppStateStore();

  return {
    selectedProvider: store.selectedProvider,
    setProvider: store.setSelectedProvider,
    ollamaDetected: store.ollamaDetected,
    claudeDetected: store.claudeCliDetected,
    detectOllama: () => store.setOllamaDetected(true),
    detectClaude: () => store.setClaudeCliDetected(true),
  };
}

// ============ AI Agent Hooks ============

export function useAIAgents() {
  const store = useAIAgentStore();

  useEffect(() => {
    store.loadAgents();
  }, [store]);

  return {
    agents: store.agents,
    defaultAgent: store.defaultAgent,
    selectedProvider: store.selectedProvider,

    loadAgents: store.loadAgents,
    loadByProvider: store.loadAgentsByProvider,
    loadDefaultAgent: store.loadDefaultAgent,
    addAgent: store.addAgent,
    removeAgent: store.removeAgent,
    updateAgent: store.updateAgent,
    setDefault: store.setDefaultAgent,
  };
}

export function useDefaultAIAgent() {
  const store = useAIAgentStore();

  useEffect(() => {
    store.loadDefaultAgent();
  }, [store]);

  return store.defaultAgent;
}

export function useAIAgentsByProvider(provider: string) {
  const store = useAIAgentStore();

  useEffect(() => {
    store.loadAgentsByProvider(provider);
  }, [provider, store]);

  return store.agents;
}

// ============ Settings Hooks ============

export function useSettings() {
  const store = useSettingsStore();

  useEffect(() => {
    store.hydrate();
  }, [store]);

  return {
    theme: store.theme,
    defaultInterviewMode: store.defaultInterviewMode,
    autoSaveSessions: store.autoSaveSessions,
    sessionTimeoutMinutes: store.sessionTimeoutMinutes,
    enableAnalytics: store.enableAnalytics,
    checkForUpdates: store.checkForUpdates,
    resumeParserEnabled: store.resumeParserEnabled,
    aiResponseStreaming: store.aiResponseStreaming,

    setTheme: store.setTheme,
    setDefaultInterviewMode: store.setDefaultInterviewMode,
    setAutoSaveSessions: store.setAutoSaveSessions,
    setSessionTimeoutMinutes: store.setSessionTimeoutMinutes,
    setEnableAnalytics: store.setEnableAnalytics,
    setCheckForUpdates: store.setCheckForUpdates,
    setResumeParserEnabled: store.setResumeParserEnabled,
    setAiResponseStreaming: store.setAiResponseStreaming,
    resetToDefaults: store.resetToDefaults,
  };
}

export function useTheme() {
  const store = useSettingsStore();

  useEffect(() => {
    store.hydrate();
  }, [store]);

  return {
    theme: store.theme,
    setTheme: store.setTheme,
  };
}

export function useInterviewSettings() {
  const store = useSettingsStore();

  useEffect(() => {
    store.hydrate();
  }, [store]);

  return {
    defaultMode: store.defaultInterviewMode,
    setDefaultMode: store.setDefaultInterviewMode,
  };
}
