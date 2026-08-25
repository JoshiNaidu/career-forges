# CRUD Operations & Examples

Complete reference for CRUD operations on app state, AI agents, and settings.

## App State Operations

### Set App State

```rust
// Save onboarding as complete
AppStateRepository::set(
    &pool,
    "onboarding_completed",
    "true",
    Some("boolean")
)?;

// Save selected model
AppStateRepository::set(
    &pool,
    "selected_model",
    "mistral:7b",
    Some("string")
)?;
```

### Get App State

```rust
// Get as boolean
let completed = AppStateRepository::get_bool(&pool, "onboarding_completed")?;

// Get as string
let model = AppStateRepository::get_string(&pool, "selected_model")?;

// Get with all details
let state = AppStateRepository::get(&pool, "selected_provider")?;
if let Some(state) = state {
    println!("Value: {}", state.value);
    println!("Type: {:?}", state.data_type);
    println!("Updated: {}", state.updated_at);
}
```

### List All App State

```rust
let all_state = AppStateRepository::list_installed(&pool)?;
for state in all_state {
    println!("{} = {}", state.key, state.value);
}
```

### Delete App State

```rust
AppStateRepository::delete(&pool, "onboarding_step")?;
```

## AI Agent Operations

### Create AI Agent

```rust
// Ollama model
let agent = AIAgentRepository::create(
    &pool,
    "ollama",
    "qwen2.5:3b",
    "Qwen 2.5 (3B)",
    true  // is_installed
)?;

// Claude model
let agent = AIAgentRepository::create(
    &pool,
    "claude",
    "claude-3-opus",
    "Claude 3 Opus",
    false  // not installed yet
)?;
```

### Get AI Agent

```rust
// Get by ID
let agent = AIAgentRepository::get_by_id(&pool, &agent_id)?;

// Get default
let default_agent = AIAgentRepository::get_default(&pool)?;
match default_agent {
    Some(agent) => println!("Default: {}", agent.display_name),
    None => println!("No default agent set"),
}
```

### List AI Agents

```rust
// By provider
let ollama_agents = AIAgentRepository::list_by_provider(&pool, "ollama")?;
for agent in ollama_agents {
    println!("{} - v{}", agent.display_name, agent.version.unwrap_or("unknown".into()));
}

// Only installed
let installed = AIAgentRepository::list_installed(&pool)?;
println!("Installed agents: {}", installed.len());
```

### Set Default Agent

```rust
// Set as default (clears other defaults for same provider)
let updated = AIAgentRepository::set_default(&pool, &agent_id)?;
println!("Default set to: {}", updated.display_name);
```

### Update Agent Installation Status

```rust
// Mark as installed
AIAgentRepository::update_installation_status(&pool, &agent_id, true)?;

// Mark as uninstalled (soft delete not applied)
AIAgentRepository::update_installation_status(&pool, &agent_id, false)?;
```

### Update Agent Availability

```rust
// Agent is available/running
AIAgentRepository::update_availability(&pool, &agent_id, true)?;

// Agent is not available
AIAgentRepository::update_availability(&pool, &agent_id, false)?;
```

### Delete Agent

```rust
// Soft delete
AIAgentRepository::delete(&pool, &agent_id)?;
```

## Settings Operations

### Set Setting

```rust
// String setting
SettingRepository::set(&pool, "theme", "dark")?;

// Boolean as string
SettingRepository::set(&pool, "auto_save_sessions", "true")?;

// Number as string
SettingRepository::set(&pool, "session_timeout_minutes", "30")?;
```

### Get Setting

```rust
// Get as boolean
let auto_save = SettingRepository::get_bool(&pool, "auto_save_sessions")?;

// Get as string
let theme = SettingRepository::get_string(&pool, "theme")?;

// Get as number
let timeout = SettingRepository::get_number(&pool, "session_timeout_minutes")?;

// Get with all details
let setting = SettingRepository::get(&pool, "theme")?;
if let Some(setting) = setting {
    println!("Theme: {}", setting.value);
    println!("Description: {:?}", setting.description);
}
```

### List All Settings

```rust
let all_settings = SettingRepository::list_installed(&pool)?;
for setting in all_settings {
    println!("{}: {} ({})", setting.key, setting.value, setting.data_type.unwrap_or("unknown".into()));
}
```

### Delete Setting

```rust
SettingRepository::delete(&pool, "theme")?;
```

### Reset to Defaults

```rust
SettingRepository::reset_to_defaults(&pool)?;
```

## React/TypeScript Examples

### Check Onboarding Status

```typescript
import { shouldSkipOnboarding, getCurrentOnboardingStep } from '@/lib/db';

// On app load
async function loadApp() {
  const skip = await shouldSkipOnboarding();
  const step = await getCurrentOnboardingStep();
  
  console.log('Skip onboarding:', skip);
  console.log('Current step:', step);
}
```

### Select Provider and Model

```typescript
import { useAppState } from '@/lib/db';

function SelectAIModel() {
  const { selectedProvider, selectedModel, selectProvider, selectModel } = useAppState();

  return (
    <div>
      <select value={selectedProvider} onChange={e => selectProvider(e.target.value)}>
        <option value="ollama">Ollama (Local)</option>
        <option value="claude">Claude (CLI)</option>
        <option value="openai">OpenAI</option>
      </select>

      <select value={selectedModel} onChange={e => selectModel(e.target.value)}>
        <option value="qwen2.5:3b">Qwen 2.5 (3B)</option>
        <option value="mistral:7b">Mistral (7B)</option>
        <option value="llama:13b">Llama 2 (13B)</option>
      </select>
    </div>
  );
}
```

### Complete Onboarding with Configuration

```typescript
import { completeOnboarding } from '@/lib/db';

async function finishSetup(selectedAgentId: string) {
  try {
    await completeOnboarding({
      provider: 'ollama',
      model: 'qwen2.5:3b',
      ollamaDetected: true,
      claudeDetected: false,
    });
    
    console.log('✅ Onboarding complete!');
    navigate('/dashboard');
  } catch (error) {
    console.error('❌ Failed to complete onboarding:', error);
  }
}
```

### Detect and Register AI Providers

```typescript
import { db } from '@/lib/db';

async function detectProviders() {
  try {
    // Check for Ollama
    const ollamaRunning = await checkOllamaHealth();
    if (ollamaRunning) {
      await db.setAppState('ollama_detected', 'true', 'boolean');
      console.log('✅ Ollama detected');
    }

    // Check for Claude CLI
    const claudeInstalled = await checkClaudeCliInstalled();
    if (claudeInstalled) {
      await db.setAppState('claude_cli_detected', 'true', 'boolean');
      console.log('✅ Claude CLI detected');
    }
  } catch (error) {
    console.error('Error detecting providers:', error);
  }
}
```

### Sync AI Agents from Ollama

```typescript
import { db } from '@/lib/db';

async function syncOllamaModels() {
  try {
    // Get list of models from Ollama
    const models = await getOllamaModels();

    // Sync to database
    for (const model of models) {
      // Check if already exists
      const existing = await db.listAIAgentsByProvider('ollama');
      const alreadyExists = existing.some(a => a.model_id === model.name);

      if (!alreadyExists) {
        await db.createAIAgent(
          'ollama',
          model.name,
          model.name, // display name
          true  // is_installed
        );
      }
    }

    console.log(`✅ Synced ${models.length} models from Ollama`);
  } catch (error) {
    console.error('Failed to sync Ollama models:', error);
  }
}
```

### Settings Panel

```typescript
import { useSettings } from '@/lib/db';

function SettingsPage() {
  const {
    theme,
    autoSaveSessions,
    sessionTimeoutMinutes,
    enableAnalytics,
    setTheme,
    setAutoSaveSessions,
    setSessionTimeoutMinutes,
    setEnableAnalytics,
  } = useSettings();

  return (
    <div>
      <h1>Settings</h1>

      <section>
        <h2>Appearance</h2>
        <label>
          Theme:
          <select value={theme} onChange={e => setTheme(e.target.value as any)}>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </label>
      </section>

      <section>
        <h2>Sessions</h2>
        <label>
          <input
            type="checkbox"
            checked={autoSaveSessions}
            onChange={e => setAutoSaveSessions(e.target.checked)}
          />
          Auto-save chat sessions
        </label>

        <label>
          Session timeout (minutes):
          <input
            type="number"
            value={sessionTimeoutMinutes}
            onChange={e => setSessionTimeoutMinutes(parseInt(e.target.value))}
            min="5"
            max="120"
          />
        </label>
      </section>

      <section>
        <h2>Privacy</h2>
        <label>
          <input
            type="checkbox"
            checked={enableAnalytics}
            onChange={e => setEnableAnalytics(e.target.checked)}
          />
          Enable usage analytics (helps us improve)
        </label>
      </section>
    </div>
  );
}
```

### Load App with Status Check

```typescript
import { initializeApp, getAppReadiness } from '@/lib/db';

export default function App() {
  useEffect(() => {
    (async () => {
      // Initialize all stores
      const status = await initializeApp();
      
      console.log('Initialization status:', status);

      // Check readiness
      const readiness = getAppReadiness();
      console.log('App ready:', readiness.ready);
      console.log('Onboarding complete:', readiness.onboardingComplete);
      console.log('Has default agent:', readiness.hasDefaultAgent);

      // Route based on readiness
      if (status.onboardingRequired) {
        navigate('/onboarding');
      } else if (!readiness.hasDefaultAgent) {
        navigate('/select-agent');
      } else {
        navigate('/dashboard');
      }
    })();
  }, []);

  return <Routes>{/* ... */}</Routes>;
}
```

## Transaction Examples

### Atomic Onboarding Completion

```rust
use crate::db::connection::transaction;

transaction(&pool, |conn| {
    // Set all onboarding state in one transaction
    AppStateRepository::set(&pool, "onboarding_completed", "true", Some("boolean"))?;
    AppStateRepository::set(&pool, "selected_provider", "ollama", Some("string"))?;
    AppStateRepository::set(&pool, "selected_model", "qwen2.5:3b", Some("string"))?;

    // Log the activity
    db::logActivity(/* ... */)?;

    Ok(())
})?;
```

### Bulk Agent Sync

```rust
transaction(&pool, |conn| {
    for model in models {
        AIAgentRepository::create(
            &pool,
            "ollama",
            &model.name,
            &model.display_name,
            true
        )?;
    }
    Ok(())
})?;
```

## Error Handling

### Rust

```rust
match AppStateRepository::get_bool(&pool, "onboarding_completed") {
    Ok(completed) => {
        if completed {
            println!("Onboarding already done");
        }
    }
    Err(DbError::NotFound) => {
        println!("State not found, initializing...");
    }
    Err(e) => {
        eprintln!("Database error: {}", e);
    }
}
```

### TypeScript

```typescript
try {
  const state = await db.getAppState('onboarding_completed');
  if (!state) {
    console.log('State not initialized');
    return;
  }
} catch (error) {
  console.error('Failed to get app state:', error);
  // Fallback behavior
}
```

## Performance Tips

1. **Batch operations together:**
   ```typescript
   await Promise.all([
     db.setAppState('key1', 'value1'),
     db.setAppState('key2', 'value2'),
     db.setAppState('key3', 'value3'),
   ]);
   ```

2. **Use Zustand selectors to avoid re-renders:**
   ```typescript
   const theme = useSettingsStore(state => state.theme);
   ```

3. **Cache read-only lookups:**
   ```typescript
   const agents = useAIAgents();
   // Reuse agents array, don't re-fetch
   ```

4. **Hydrate once on app start:**
   ```typescript
   // Do this once:
   useEffect(() => {
     initializeApp();
   }, []);
   ```

---

**All CRUD operations ready to use! 🚀**
