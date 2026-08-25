# ✅ FULL INTEGRATION GUIDE - Persistence System

Complete step-by-step guide to integrate the persistence system into CareerForges.

## PHASE 1: Backend Setup ✅ COMPLETE

### What's Already Done
- ✅ Tauri IPC command handlers implemented (27 commands)
- ✅ Commands registered in tauri::Builder
- ✅ All Rust repositories connected
- ✅ Error handling and logging throughout

### Rust Files Modified
- `app/src-tauri/src/lib.rs` - Added commands module + registration
- `app/src-tauri/src/commands/mod.rs` - NEW command module
- `app/src-tauri/src/commands/app_state_commands.rs` - 17 commands
- `app/src-tauri/src/commands/ai_agent_commands.rs` - 9 commands
- `app/src-tauri/src/commands/settings_commands.rs` - 11 commands

## PHASE 2: Frontend Invoke Layer ✅ COMPLETE

### What's Already Done
- ✅ TypeScript invoke wrappers created
- ✅ Retry logic implemented
- ✅ Error handling throughout
- ✅ Service layer updated to use invoke

### Frontend Files Modified
- `app/src/lib/db/invoke.ts` - NEW invoke wrapper layer
- `app/src/lib/db/service.ts` - Updated to use invoke wrappers
- `app/src/lib/db/startup-provider.tsx` - NEW startup provider
- `app/src/lib/db/index.ts` - Updated exports

## PHASE 3: Startup Hydration - IMPLEMENTATION READY

### What to Do Next

**Step 1: Update Main App Entry Point**

Edit `app/src/main.tsx`:

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { StartupErrorBoundary } from '@/lib/db'

// Main entry
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StartupErrorBoundary>
      <App />
    </StartupErrorBoundary>
  </React.StrictMode>,
)
```

**Step 2: Update Root App Component**

Edit `app/src/App.tsx` or your router file to add the StartupProvider:

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { StartupProvider, StartupSplash, RouteGuard } from '@/lib/db'

// Your components
import OnboardingPage from '@/pages/onboarding'
import DashboardPage from '@/pages/dashboard'

export default function App() {
  return (
    <BrowserRouter>
      <StartupProvider>
        {/* Splash screen while loading */}
        <StartupSplash />

        {/* Route guard for protected routes */}
        <RouteGuard>
          <Routes>
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/select-agent" element={<SelectAgentPage />} />
            {/* ... other routes */}
          </Routes>
        </RouteGuard>
      </StartupProvider>
    </BrowserRouter>
  )
}
```

**Step 3: Update Onboarding Component**

Edit `app/src/pages/onboarding/index.tsx`:

```typescript
import { useOnboarding, useAIAgents, completeOnboarding } from '@/lib/db'
import { useNavigate } from 'react-router-dom'

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { isCompleted, currentStep, goToStep } = useOnboarding()
  const { agents, setDefault } = useAIAgents()
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)

  if (isCompleted) {
    return <Navigate to="/dashboard" replace />
  }

  const handleComplete = async () => {
    if (selectedAgent) {
      const agent = agents.find(a => a.id === selectedAgent)
      if (agent) {
        await completeOnboarding({
          provider: agent.provider,
          model: agent.name,
        })
        navigate('/dashboard', { replace: true })
      }
    }
  }

  return (
    <div>
      <h1>Welcome to CareerForges</h1>
      <p>Step: {currentStep}</p>

      <select onChange={e => setSelectedAgent(e.target.value)}>
        <option value="">Select AI Model</option>
        {agents.map(a => (
          <option key={a.id} value={a.id}>
            {a.display_name}
          </option>
        ))}
      </select>

      <button onClick={() => goToStep('next-step')}>
        Next
      </button>

      <button onClick={handleComplete}>
        Complete Setup
      </button>
    </div>
  )
}
```

**Step 4: Update Dashboard Component**

Edit `app/src/pages/dashboard/index.tsx`:

```typescript
import { useSettings, useTheme, useAIAgents } from '@/lib/db'

export default function DashboardPage() {
  const { theme } = useTheme()
  const { defaultAgent } = useAIAgents()

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <h1>Dashboard</h1>
      {defaultAgent && (
        <p>Using: {defaultAgent.display_name}</p>
      )}
      {/* ... rest of dashboard */}
    </div>
  )
}
```

**Step 5: Update Settings Page**

Edit `app/src/pages/settings/index.tsx`:

```typescript
import { useSettings, useTheme } from '@/lib/db'

export default function SettingsPage() {
  const settings = useSettings()
  const { theme, setTheme } = useTheme()

  return (
    <div>
      <h1>Settings</h1>

      <div>
        <label>Theme:</label>
        <select 
          value={theme} 
          onChange={e => setTheme(e.target.value as 'dark' | 'light')}
        >
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
      </div>

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
  )
}
```

## Integration Checklist

### Backend (Tauri/Rust)
- [x] Command handlers created
- [x] Commands registered in invoke_handler
- [x] Error logging implemented
- [x] Retry logic ready

### Frontend Setup
- [ ] Update `app/src/main.tsx` to add StartupErrorBoundary
- [ ] Update `app/src/App.tsx` to add StartupProvider
- [ ] Update `app/src/pages/onboarding/` to use hooks
- [ ] Update `app/src/pages/dashboard/` to use settings
- [ ] Update `app/src/pages/settings/` to manage preferences

### Routes
- [ ] `/onboarding` - Shows onboarding flow
- [ ] `/select-agent` - AI agent selection
- [ ] `/dashboard` - Main app (skips onboarding if completed)
- [ ] `/settings` - Settings management

## Testing Integration

### Manual Test 1: First Launch
1. Delete database file: `~/.config/careerforges/careerforges.db`
2. Launch app
3. Verify splash screen appears
4. Verify onboarding shows
5. Complete onboarding
6. Verify dashboard shows
7. Check that settings were saved

### Manual Test 2: App Restart
1. Close app
2. Relaunch app
3. Verify splash screen appears
4. Verify dashboard shows directly (no onboarding)
5. Verify selected model is remembered
6. Verify theme setting is remembered

### Manual Test 3: Onboarding Reset (Dev)
1. Open browser console
2. Run: `await (await import('@/lib/db')).resetAppState()`
3. Refresh app
4. Verify onboarding appears

## Common Integration Issues

### Issue: "Cannot read property 'appState' of undefined"
**Solution:** Make sure StartupProvider wraps your Routes component
```typescript
<BrowserRouter>
  <StartupProvider>
    {/* Routes here */}
  </StartupProvider>
</BrowserRouter>
```

### Issue: Infinite loading screen
**Solution:** Check browser console for errors, ensure database is initialized
```typescript
// In browser console
const { db } = await import('@/lib/db')
await db.ping()  // Should return true
```

### Issue: Settings not persisting
**Solution:** Verify Zustand persist middleware is enabled
```typescript
// Check localStorage
localStorage.getItem('app-state-store')
localStorage.getItem('settings-store')
```

### Issue: OnboardingRequired keeps showing
**Solution:** Clear both localStorage and database
```typescript
// In browser console
localStorage.clear()

// Then in Rust terminal
rm ~/.config/careerforges/careerforges.db
```

## File Structure After Integration

```
app/src/
├── main.tsx                    ← ADD StartupErrorBoundary
├── App.tsx                     ← ADD StartupProvider + StartupSplash
├── lib/db/
│   ├── invoke.ts              ✅ NEW
│   ├── startup-provider.tsx   ✅ NEW
│   ├── service.ts             ✅ UPDATED
│   ├── stores.ts              ✅ EXISTING
│   ├── hooks.ts               ✅ EXISTING
│   ├── models.ts              ✅ EXISTING
│   ├── initialization.ts      ✅ EXISTING
│   └── index.ts               ✅ UPDATED
├── pages/
│   ├── onboarding/
│   │   └── index.tsx          ← UPDATE with hooks
│   ├── dashboard/
│   │   └── index.tsx          ← UPDATE with theme + settings
│   └── settings/
│       └── index.tsx          ← UPDATE with settings form
└── ...

app/src-tauri/src/
├── lib.rs                      ✅ UPDATED
├── commands/
│   ├── mod.rs                 ✅ NEW
│   ├── app_state_commands.rs  ✅ NEW
│   ├── ai_agent_commands.rs   ✅ NEW
│   └── settings_commands.rs   ✅ NEW
└── ...
```

## Next Steps After Integration

1. **Build and Test:**
   ```bash
   cargo tauri build
   ```

2. **Debug Issues:**
   - Check app logs: `tail -f ~/.config/careerforges/error.log`
   - Check console: F12 in dev, Application tab for localStorage
   - Check database: Open `~/.config/careerforges/careerforges.db` with SQLite browser

3. **Validate Persistence:**
   - Complete onboarding
   - Close and relaunch app
   - Verify no onboarding shown
   - Check settings remain

4. **Deploy:**
   - Once validated locally, build production binary
   - Test on clean machine

## Rollback Plan

If issues occur:

1. **Database Reset:**
   ```bash
   rm ~/.config/careerforges/careerforges.db
   ```

2. **Clear All State:**
   ```typescript
   // Browser console
   localStorage.clear()
   ```

3. **Restart Fresh:**
   - App will reinitialize from scratch
   - Onboarding will show
   - All defaults restored

---

**Integration is ready! Follow the 5 steps above to complete setup.** 🚀

Estimated time: 30-60 minutes for full integration + testing
