/**
 * App Startup Hydration Provider
 * Handles database initialization and state restoration on app launch
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { initializeApp, getAppReadiness } from './initialization';
import { useAppStateStore, useAIAgentStore, useSettingsStore } from './stores';
import type { InitializationStatus } from './initialization';

export interface StartupContextType {
  isInitialized: boolean;
  isLoading: boolean;
  initializationStatus: InitializationStatus | null;
  error: Error | null;
  shouldSkipOnboarding: boolean;
}

const StartupContext = createContext<StartupContextType | undefined>(undefined);

/**
 * Provider component for app startup hydration
 * Wrap your app with this to enable automatic startup flow
 */
export function StartupProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [initializationStatus, setInitializationStatus] = useState<InitializationStatus | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [shouldSkipOnboarding, setShouldSkipOnboarding] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const performInitialization = async () => {
      try {
        setIsLoading(true);
        console.log('[Startup] Beginning app initialization...');

        // Initialize all stores from database
        const status = await initializeApp();
        
        if (!isMounted) return;

        console.log('[Startup] Initialization complete:', status);
        setInitializationStatus(status);

        // Check readiness
        const readiness = getAppReadiness();
        console.log('[Startup] App readiness:', readiness);

        // Determine routing
        if (status.onboardingRequired) {
          console.log('[Startup] Onboarding required, routing to /onboarding');
          setShouldSkipOnboarding(false);
          navigate('/onboarding', { replace: true });
        } else if (!readiness.hasDefaultAgent) {
          console.log('[Startup] No default agent, routing to /select-agent');
          navigate('/select-agent', { replace: true });
        } else {
          console.log('[Startup] App ready, routing to /dashboard');
          setShouldSkipOnboarding(true);
          navigate('/dashboard', { replace: true });
        }

        setIsInitialized(true);
      } catch (err) {
        if (!isMounted) return;

        console.error('[Startup] Initialization error:', err);
        setError(err instanceof Error ? err : new Error(String(err)));

        // Fallback: attempt to navigate to onboarding
        try {
          navigate('/onboarding', { replace: true });
        } catch {
          console.error('[Startup] Failed to navigate to onboarding');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    performInitialization();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const value: StartupContextType = {
    isInitialized,
    isLoading,
    initializationStatus,
    error,
    shouldSkipOnboarding,
  };

  return (
    <StartupContext.Provider value={value}>
      {children}
    </StartupContext.Provider>
  );
}

/**
 * Hook to access startup context
 */
export function useStartup(): StartupContextType {
  const context = useContext(StartupContext);
  if (!context) {
    throw new Error('useStartup must be used within StartupProvider');
  }
  return context;
}

/**
 * Splash screen component for initial loading
 */
export function StartupSplash() {
  const { isLoading, error } = useStartup();

  if (!isLoading && !error) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        {/* Logo or Brand */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">CareerForges</h1>
          <p className="text-slate-400">Initializing...</p>
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="animate-spin">
            <div className="h-8 w-8 border-4 border-slate-600 border-t-orange-500 rounded-full"></div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="text-red-400 text-center max-w-sm">
            <p className="font-semibold">Failed to initialize</p>
            <p className="text-sm text-red-300 mt-1">{error.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Route guard component
 * Prevents access to protected routes until app is ready
 */
export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { isInitialized, isLoading } = useStartup();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="animate-spin">
          <div className="h-8 w-8 border-4 border-slate-600 border-t-orange-500 rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <p className="text-slate-400">Initializing app...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Error boundary for startup
 */
export class StartupErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Startup Error Boundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-50">
          <div className="text-center">
            <h1 className="text-xl font-bold text-white mb-2">Startup Error</h1>
            <p className="text-red-400 max-w-sm">
              {this.state.error?.message || 'An unexpected error occurred during startup'}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
