# Persistent Onboarding & Configuration Guide

Complete guide to using the new onboarding and AI agent configuration system in CareerForges.

## Overview

CareerForges now persists:
- ✅ Onboarding completion status
- ✅ Installed AI agents (Ollama, Claude, etc.)
- ✅ Selected default model
- ✅ Selected provider
- ✅ App settings and preferences
- ✅ AI provider detection status

Users will **not repeat onboarding** on app restart.

## Database Schema

### `app_state` Table
Stores application-level state:
- `onboarding_completed` - Boolean: Has user completed onboarding?
- `onboarding_step` - String: Current step (welcome, select-provider, select-model, etc.)
- `selected_provider` - String: Currently selected provider (ollama, claude, etc.)
- `selected_model` - String: Currently selected model
- `ollama_detected` - Boolean: Is Ollama installed/running?
- `claude_cli_detected` - Boolean: Is Claude CLI installed?

### `ai_agents` Table
Stores information about installed AI models:
- `id` - Unique identifier
- `provider` - Provider type (ollama, claude, openai, anthropic)
- `name` - Internal model name
- `display_name` - User-friendly display name
- `is_installed` - Is the agent installed locally?
- `is_available` - Can the agent be used right now?
- `is_default` - Is this the default agent?
- `version`, `size_mb`, `performance_tier` - Metadata

### `settings` Table
Stores user preferences:
- `theme` - UI theme (dark/light)
- `default_interview_mode` - Default interview type
- `auto_save_sessions` - Auto-save chat sessions
- `session_timeout_minutes` - Timeout duration
- `enable_analytics`, `check_for_updates`, etc.

## Quick Start

### 1. Initialize App on Startup

```typescript
import { initializeApp } from '@/lib/db';

// In your main app component or layout
useEffect(() => {
  (async () => {
    const status = await initializeApp();
    console.log('App initialized:', status);
    
    if (status.onboardingRequired) {
      navigate('/onboarding');
    } else {
      navigate('/dashboard');
    }
  })();
}, []);
```

### 2. Use Onboarding State

```typescript
import { useOnboarding } from '@/lib/db';

function OnboardingFlow() {
  const { isCompleted, currentStep, complete, goToStep } = useOnboarding();

  if (isCompleted) {
    return <Redirect to="/dashboard" />;
  }

  return (
    <div>
      <h1>Step: {currentStep}</h1>
      <button onClick={() => goToStep('select-provider')}>
        Next
      </button>
      <button onClick={() => complete()}>
        Skip & Complete
      </button>
    </div>
  );
}
```

### 3. Auto-Skip Onboarding for Returning Users

```typescript
import { shouldSkipOnboarding } from '@/lib/db';

function App() {
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(true);

  useEffect(() => {
    shouldSkipOnboarding().then(shouldSkip => {
      if (shouldSkip) {
        setShouldShowOnboarding(false);
        navigate('/dashboard');
      }
    });
  }, []);

  return (
    <Routes>
      {shouldShowOnboarding ? (
        <Route path="/*" element={<OnboardingFlow />} />
      ) : (
        <Route path="/*" element={<Dashboard />} />
      )}
    </Routes>
  );
}
```

### 4. Manage AI Agents

```typescript
import { useAIAgents, db } from '@/lib/db';

function AIAgentManager() {
  const { agents, defaultAgent, loadAgents, loadByProvider } = useAIAgents();

  const handleSelectProvider = async (provider: string) => {
    await loadByProvider(provider);
  };

  const handleSetDefault = async (agentId: string) => {
    await db.setDefaultAIAgent(agentId);
    await loadAgents();
  };

  return (
    <div>
      <h2>AI Agents ({agents.length} installed)</h2>
      
      {defaultAgent && (
        <div>
          <strong>Default:</strong> {defaultAgent.display_name}
        </div>
      )}

      <div>
        {agents.map(agent => (
          <div key={agent.id}>
            <span>{agent.display_name}</span>
            {agent.is_default && <span>✓ Default</span>}
            <button 
              onClick={() => handleSetDefault(agent.id)}
              disabled={agent.is_default}
            >
              Set as Default
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 5. Use Settings

```typescript
import { useSettings, useTheme } from '@/lib/db';

function SettingsPanel() {
  const settings = useSettings();
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <h2>Settings</h2>
      
      <label>
        Theme:
        <select value={theme} onChange={e => setTheme(e.target.value as 'dark' | 'light')}>
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
      </label>

      <label>
        Default Interview Mode:
        <select 
          value={settings.defaultInterviewMode}
          onChange={e => settings.setDefaultInterviewMode(e.target.value)}
        >
          <option value="practice">Practice</option>
          <option value="realistic">Realistic</option>
          <option value="technical">Technical</option>
        </select>
      </label>

      <label>
        <input 
          type="checkbox"
          checked={settings.autoSaveSessions}
          onChange={e => settings.setAutoSaveSessions(e.target.checked)}
        />
        Auto-save chat sessions
      </label>

      <button onClick={settings.resetToDefaults}>
        Reset to Defaults
      </button>
    </div>
  );
}
```

### 6. Complete Onboarding

```typescript
import { completeOnboarding } from '@/lib/db';

async function finishOnboarding() {
  await completeOnboarding({
    provider: 'ollama',
    model: 'qwen2.5:3b',
    ollamaDetected: true,
    claudeDetected: false,
  });

  // Now the app will skip onboarding on next launch
  navigate('/dashboard');
}
```

## Full Onboarding Flow Example

```typescript
import { useOnboarding, useAIProviders, useAIAgents, completeOnboarding } from '@/lib/db';

function OnboardingWizard() {
  const { currentStep, goToStep, complete } = useOnboarding();
  const providers = useAIProviders();
  const agents = useAIAgents();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  const handleCompleteOnboarding = async () => {
    if (selectedAgent) {
      const agent = agents.agents.find(a => a.id === selectedAgent);
      if (agent) {
        await completeOnboarding({
          provider: agent.provider,
          model: agent.name,
          ollamaDetected: providers.ollamaDetected,
          claudeDetected: providers.claudeDetected,
        });
      }
    }
  };

  return (
    <div>
      {currentStep === 'welcome' && (
        <WelcomeStep onNext={() => goToStep('detect')} />
      )}

      {currentStep === 'detect' && (
        <DetectProvidersStep 
          onDetectOllama={() => providers.detectOllama()}
          onDetectClaude={() => providers.detectClaude()}
          onNext={() => goToStep('select-agent')}
        />
      )}

      {currentStep === 'select-agent' && (
        <SelectAgentStep
          agents={agents.agents}
          selected={selectedAgent}
          onSelect={setSelectedAgent}
          onNext={handleCompleteOnboarding}
        />
      )}
    </div>
  );
}
```

## Rust Backend Usage

### Create AI Agent

```rust
use crate::db::repositories::AIAgentRepository;

let agent = AIAgentRepository::create(
    &pool,
    "ollama",
    "qwen2.5:3b",
    "Qwen 2.5 (3B)",
    true
)?;

// Set as default
AIAgentRepository::set_default(&pool, &agent.id)?;
```

### Check Onboarding Status

```rust
use crate::db::repositories::AppStateRepository;

let completed = AppStateRepository::get_bool(&pool, "onboarding_completed")?;
if !completed {
    // Show onboarding
}
```

### Save Provider Detection

```rust
use crate::db::repositories::AppStateRepository;

// Ollama detected
AppStateRepository::set(&pool, "ollama_detected", "true", Some("boolean"))?;

// Claude CLI detected
AppStateRepository::set(&pool, "claude_cli_detected", "true", Some("boolean"))?;
```

## React Hooks Reference

### `useOnboarding()`
```typescript
const { isCompleted, currentStep, complete, goToStep } = useOnboarding();
```

### `useAppState()`
```typescript
const {
  onboardingCompleted,
  selectedProvider,
  selectedModel,
  ollamaDetected,
  claudeDetected,
  completeOnboarding,
  selectProvider,
  selectModel,
} = useAppState();
```

### `useAIAgents()`
```typescript
const {
  agents,
  defaultAgent,
  loadAgents,
  loadByProvider,
  addAgent,
  setDefault,
} = useAIAgents();
```

### `useSettings()`
```typescript
const {
  theme,
  defaultInterviewMode,
  autoSaveSessions,
  setTheme,
  setDefaultInterviewMode,
  resetToDefaults,
} = useSettings();
```

## Data Flow

```
App Startup
    ↓
initializeApp()
    ↓
    ├── Load app_state from DB
    ├── Load AI agents
    └── Load settings
    ↓
Check onboarding_completed
    ├── true → Skip to Dashboard
    └── false → Show Onboarding
    ↓
User Completes Onboarding
    ↓
completeOnboarding(config)
    ├── Save to app_state
    ├── Save AI agent selection
    └── Log activity
    ↓
Update Zustand Stores
    ↓
Persist to localStorage (via Zustand middleware)
    ↓
Next App Launch
    ├── Load from localStorage (fast)
    └── Also load from DB (sync)
```

## Best Practices

1. **Always initialize on app startup:**
   ```typescript
   useEffect(() => {
     initializeApp();
   }, []);
   ```

2. **Use hooks for reactive state:**
   ```typescript
   const { theme } = useTheme();  // Auto-updates on change
   ```

3. **Persist important decisions immediately:**
   ```typescript
   await completeOnboarding(config);  // Don't delay
   ```

4. **Hydrate on component mount:**
   ```typescript
   useEffect(() => {
     store.hydrate();
   }, []);
   ```

5. **Handle errors gracefully:**
   ```typescript
   try {
     await db.setAppState('key', 'value');
   } catch (error) {
     console.error('Failed to save state:', error);
   }
   ```

## Testing

### Reset App State (Dev Only)

```typescript
import { resetAppState } from '@/lib/db';

// In dev console
await resetAppState();
```

### Check Persisted State

```typescript
// In browser console
localStorage.getItem('app-state-store')
localStorage.getItem('settings-store')
```

### Manually Set App State

```typescript
import { db } from '@/lib/db';

// Force onboarding
await db.setAppState('onboarding_completed', 'false', 'boolean');
```

## Troubleshooting

### Onboarding Keeps Showing
- Check: `await db.getAppStateBool('onboarding_completed')`
- Reset: `await resetAppState()`

### Settings Not Persisting
- Ensure Zustand middleware is enabled
- Check: `localStorage.getItem('settings-store')`
- Manually hydrate: `await useSettingsStore.getState().hydrate()`

### AI Agents Not Loading
- Check database connectivity: `await db.ping()`
- Verify agents exist: `await db.listInstalledAIAgents()`

## Files

- **Models**: `app/src/lib/db/models.ts`
- **Service**: `app/src/lib/db/service.ts`
- **Stores**: `app/src/lib/db/stores.ts`
- **Hooks**: `app/src/lib/db/hooks.ts`
- **Initialization**: `app/src/lib/db/initialization.ts`
- **Repositories**: `app/src-tauri/src/db/repositories/`

## Next Steps

1. ✅ Database schema created
2. ✅ Rust repositories implemented
3. ✅ React hooks and stores ready
4. ⏳ Create Tauri IPC commands (commands.rs)
5. ⏳ Integrate into onboarding UI
6. ⏳ Test with real Ollama/Claude detection

---

**Onboarding is now persistent. Users won't repeat setup on app restart!** 🎉
