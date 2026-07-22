# Quick Start: Persistent State & Onboarding

TL;DR guide for developers integrating persistent onboarding and AI configuration.

## 30-Second Setup

```typescript
// 1. App root (e.g., main.tsx or App.tsx)
import { initializeApp } from '@/lib/db';

useEffect(() => {
  initializeApp().then(status => {
    if (status.onboardingRequired) {
      navigate('/onboarding');
    } else {
      navigate('/dashboard');
    }
  });
}, []);
```

Done! Onboarding will now persist.

## Component Examples

### Auto-Skip Onboarding

```typescript
import { useOnboarding } from '@/lib/db';

function OnboardingWrapper() {
  const { isCompleted } = useOnboarding();
  
  if (isCompleted) return null;
  return <OnboardingFlow />;
}
```

### AI Agent Selection

```typescript
import { useAIAgents } from '@/lib/db';

function SelectModel() {
  const { agents, setDefault } = useAIAgents();
  
  return (
    <select onChange={e => setDefault(e.target.value)}>
      {agents.map(a => (
        <option key={a.id} value={a.id}>{a.display_name}</option>
      ))}
    </select>
  );
}
```

### Settings Panel

```typescript
import { useTheme, useSettings } from '@/lib/db';

function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { autoSaveSessions, setAutoSaveSessions } = useSettings();
  
  return (
    <>
      <select value={theme} onChange={e => setTheme(e.target.value as any)}>
        <option value="dark">Dark</option>
        <option value="light">Light</option>
      </select>
      
      <input 
        type="checkbox"
        checked={autoSaveSessions}
        onChange={e => setAutoSaveSessions(e.target.checked)}
      />
    </>
  );
}
```

### Complete Onboarding

```typescript
import { completeOnboarding } from '@/lib/db';

async function handleOnboardingComplete(agentId: string) {
  await completeOnboarding({
    provider: 'ollama',
    model: 'qwen2.5:3b',
    ollamaDetected: true,
  });
  navigate('/dashboard');
}
```

## Available Hooks

| Hook | Use Case |
|------|----------|
| `useOnboarding()` | Track onboarding steps & completion |
| `useAppState()` | Full app state (onboarding + provider detection) |
| `useAIProviders()` | Provider detection & selection |
| `useAIAgents()` | List & manage AI agents |
| `useDefaultAIAgent()` | Get current default agent |
| `useSettings()` | User preferences & app config |
| `useTheme()` | Theme-only hook |

## Service Methods

```typescript
import { db } from '@/lib/db';

// App State
await db.getAppState('onboarding_completed');
await db.setAppState('onboarding_step', 'select-model');
await db.listAppState();

// AI Agents
await db.createAIAgent('ollama', 'qwen2.5:3b', 'Qwen 2.5');
await db.listInstalledAIAgents();
await db.getDefaultAIAgent();
await db.setDefaultAIAgent(agentId);

// Settings
await db.getSetting('theme');
await db.setSetting('theme', 'dark');
await db.listSettings();
```

## State Flow

```
App Load
  → initializeApp() loads stores from DB
  → Check if onboarding complete
  → If not, show /onboarding
  → User configures AI & completes setup
  → completeOnboarding() saves everything
  → Next load skips onboarding automatically ✅
```

## Environment Checks

**For Development/Testing:**

```typescript
import { resetAppState } from '@/lib/db';

// Reset to initial state
await resetAppState();

// Manually check localStorage
localStorage.getItem('app-state-store');
localStorage.getItem('settings-store');
```

## What's Persisted?

| Item | Storage | Synced to DB |
|------|---------|------------|
| Onboarding completion | localStorage | Yes ✅ |
| Selected model/provider | localStorage | Yes ✅ |
| AI agent list | Memory | Yes ✅ |
| Settings (theme, etc.) | localStorage | Yes ✅ |
| Activity logs | DB only | Yes ✅ |

## Common Patterns

### Check if app is ready

```typescript
import { getAppReadiness } from '@/lib/db';

const { ready, onboardingComplete, hasDefaultAgent } = getAppReadiness();
```

### Detect AI providers during onboarding

```typescript
import { useAIProviders } from '@/lib/db';

const { detectOllama, detectClaude } = useAIProviders();

// During setup
if (await isOllamaRunning()) {
  detectOllama();
}
```

### Listen to settings changes

```typescript
import { useSettingsStore } from '@/lib/db';

// Zustand allows direct subscriptions
const unsubscribe = useSettingsStore.subscribe(
  state => state.theme,
  theme => console.log('Theme changed:', theme)
);
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Onboarding keeps showing | `await resetAppState()` in console |
| Theme not changing | Check `localStorage` exists |
| Agents not loading | Verify DB command handlers exist |
| State not persisting | Check Zustand middleware is enabled |

## Files You Need to Know

- **Main export:** `app/src/lib/db/index.ts`
- **Hooks:** `app/src/lib/db/hooks.ts`
- **Stores:** `app/src/lib/db/stores.ts`
- **Service:** `app/src/lib/db/service.ts`
- **Init:** `app/src/lib/db/initialization.ts`

## Next: Tauri Commands

⚠️ **Not yet implemented:**
- Rust `#[tauri::command]` handlers for database operations
- Once implemented, all React queries will work automatically

See: `docs/PERSISTENT_ONBOARDING.md` for full implementation guide.

---

**Everything's ready to integrate! Start using the hooks in your components.** 🚀
