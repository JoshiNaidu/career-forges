/**
 * Database module index
 * Exports all database models, services, stores, and hooks
 */

export * from './models';
export { db } from './service';
export {
  useAppStateStore,
  useAIAgentStore,
  useSettingsStore,
} from './stores';
export {
  useAppState,
  useOnboarding,
  useAIProviders,
  useAIAgents,
  useDefaultAIAgent,
  useAIAgentsByProvider,
  useSettings,
  useTheme,
  useInterviewSettings,
} from './hooks';
export {
  initializeApp,
  shouldSkipOnboarding,
  getCurrentOnboardingStep,
  completeOnboarding,
  resetAppState,
  getAppReadiness,
  type InitializationStatus,
} from './initialization';
export {
  StartupProvider,
  useStartup,
  StartupSplash,
  RouteGuard,
  StartupErrorBoundary,
  type StartupContextType,
} from './startup-provider';
export { dbInvoke, appStateInvoke, aiAgentInvoke, settingsInvoke, dbHealthInvoke } from './invoke';
