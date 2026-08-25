# Real Persistence Testing & Validation Guide

Complete checklist for validating the persistence system end-to-end.

## Pre-Testing Checklist

### Environment Setup
- [ ] Rust backend compiles without errors
- [ ] TypeScript frontend compiles without errors
- [ ] Tauri dev server runs: `cargo tauri dev`
- [ ] Database file exists: `~/.config/careerforges/careerforges.db`
- [ ] Console logs visible (F12 dev tools)

### Database Verification
```bash
# Check database exists and has tables
sqlite3 ~/.config/careerforges/careerforges.db ".tables"
# Should show: _migrations, app_state, ai_agents, settings, ...

# Check app_state table
sqlite3 ~/.config/careerforges/careerforges.db "SELECT * FROM app_state;"
# Should show default records
```

## Test Suite 1: Initial Launch

**Goal:** Verify first-time setup flow

**Steps:**
1. Delete database: `rm ~/.config/careerforges/careerforges.db`
2. Launch app: `cargo tauri dev`
3. Observe splash screen (should appear)
4. Observe routing to `/onboarding` (should be automatic)

**Validation:**
```typescript
// In browser console
const { db } = await import('@/lib/db')

// Check database initialized
await db.ping()                                    // Should return true
await db.getAppStateBool('onboarding_completed') // Should return false
```

**Expected Results:**
- ✅ Splash screen shows briefly
- ✅ Automatic redirect to `/onboarding`
- ✅ Onboarding form displays
- ✅ Database initialized with defaults

---

## Test Suite 2: Onboarding Completion

**Goal:** Verify onboarding flow and persistence

**Steps:**
1. In onboarding, select an AI provider (e.g., Ollama)
2. Select a model (e.g., qwen2.5:3b)
3. Click "Complete Onboarding" button
4. Observe redirect to `/dashboard`

**Validation:**
```typescript
// In browser console
const { db, useAppStateStore } = await import('@/lib/db')

// Check onboarding state
await db.getAppStateBool('onboarding_completed') // Should return true
await db.getAppStateString('selected_provider')  // Should return 'ollama'
await db.getAppStateString('selected_model')     // Should return 'qwen2.5:3b'

// Check Zustand store
useAppStateStore.getState().onboardingCompleted  // Should be true
useAppStateStore.getState().selectedProvider     // Should be 'ollama'
useAppStateStore.getState().selectedModel        // Should be 'qwen2.5:3b'

// Check localStorage
JSON.parse(localStorage.getItem('app-state-store')) // Should have persisted data
```

**SQL Query to Verify:**
```sql
sqlite3 ~/.config/careerforges/careerforges.db
SELECT key, value FROM app_state 
  WHERE key IN ('onboarding_completed', 'selected_provider', 'selected_model');
```

**Expected Results:**
- ✅ onboarding_completed = 'true'
- ✅ selected_provider = selected value
- ✅ selected_model = selected value
- ✅ All values in localStorage
- ✅ All values in SQLite database

---

## Test Suite 3: App Restart (Persistence)

**Goal:** Verify persistence across app restarts

**Steps:**
1. Close app (after completing onboarding)
2. Wait 2 seconds
3. Relaunch app: `cargo tauri dev`
4. Observe startup flow

**Validation:**
```typescript
// In browser console (after app reloads)
const { db, useStartup, useAppStateStore } = await import('@/lib/db')

// Check startup context
const startup = useStartup()
console.log('Should skip onboarding:', startup.shouldSkipOnboarding)  // true
console.log('Is initialized:', startup.isInitialized)                 // true

// Check stored values
await db.getAppStateBool('onboarding_completed') // Should return true
await db.getAppStateString('selected_provider')  // Should return previous value

// Check stores are hydrated
const state = useAppStateStore.getState()
console.log('Stored provider:', state.selectedProvider)  // Should match
```

**Expected Results:**
- ✅ Splash screen appears briefly
- ✅ NO onboarding redirect (skipped)
- ✅ Direct redirect to `/dashboard`
- ✅ All settings remembered
- ✅ Selected model is active

---

## Test Suite 4: Settings Persistence

**Goal:** Verify settings are saved and restored

**Steps:**
1. Navigate to Settings page
2. Change theme: Dark → Light
3. Toggle "Auto-save sessions": Off → On
4. Close app
5. Relaunch app

**Validation:**
```typescript
// After reopening
const { useSettings, useTheme } = await import('@/lib/db')

// Check settings
const { theme } = useTheme()
console.log('Theme:', theme)  // Should be 'light'

const settings = useSettings()
console.log('Auto-save:', settings.autoSaveSessions)  // Should be true

// Check localStorage
JSON.parse(localStorage.getItem('settings-store'))

// Check database
sqlite3 ~/.config/careerforges/careerforges.db
SELECT key, value FROM settings WHERE key IN ('theme', 'auto_save_sessions');
```

**Expected Results:**
- ✅ Theme setting persists
- ✅ Auto-save setting persists
- ✅ All settings in localStorage
- ✅ All settings in database
- ✅ Settings apply on app load

---

## Test Suite 5: AI Agent Management

**Goal:** Verify AI agent persistence and selection

**Steps:**
1. Manually add AI agent via script
2. Set it as default
3. Close and relaunch app
4. Verify it's still default

**Manual Testing:**
```typescript
// In browser console
const { db } = await import('@/lib/db')

// Create agent
const agent = await db.createAIAgent(
  'ollama',
  'mistral:7b',
  'Mistral 7B',
  true
)
console.log('Created:', agent.id)

// Set as default
const updated = await db.setDefaultAIAgent(agent.id)
console.log('Is default:', updated.is_default)

// List installed
const installed = await db.listInstalledAIAgents()
console.log('Installed count:', installed.length)

// Get default
const defaultAgent = await db.getDefaultAIAgent()
console.log('Default agent:', defaultAgent?.display_name)
```

**Close and Relaunch:**
```typescript
// After relaunch, check in console
const { db } = await import('@/lib/db')
const defaultAgent = await db.getDefaultAIAgent()
console.log('Default persisted:', defaultAgent?.display_name)  // Should match
```

**Expected Results:**
- ✅ Agent created successfully
- ✅ Default selection persists
- ✅ Agent survives app restart
- ✅ Default agent retrieved on launch

---

## Test Suite 6: Error Handling

**Goal:** Verify graceful error handling

**Steps:**

### Test 6a: Database Connection Failure
```typescript
// Simulate by removing database file while app is running
// In another terminal:
rm ~/.config/careerforges/careerforges.db

// In app
const { db } = await import('@/lib/db')
try {
  await db.getAppState('any_key')
} catch (error) {
  console.error('Error handled:', error.message)
}
```

**Expected:** App doesn't crash, shows error message

### Test 6b: Invalid Data
```typescript
const { db } = await import('@/lib/db')

// Try invalid key
try {
  await db.getAppStateBool('nonexistent_key')
} catch (error) {
  console.error('Error handled:', error.message)
}
```

**Expected:** Returns sensible default or null

### Test 6c: Network Issues
```typescript
// Simulate slow/failing command
const { appStateInvoke } = await import('@/lib/db')

// Should retry and either succeed or fail gracefully
try {
  await appStateInvoke.get('test_key')
} catch (error) {
  console.error('Retry exhausted:', error.message)
}
```

**Expected:** Retries automatically, then fails gracefully

---

## Test Suite 7: Reset Onboarding Flow

**Goal:** Verify onboarding can be reset

**Steps:**
1. App is in dashboard state
2. Reset onboarding via dev command
3. Verify onboarding shows on next load

**Manual Reset:**
```typescript
// In browser console
const { resetAppState } = await import('@/lib/db')
await resetAppState()
console.log('State reset')

// Refresh page
window.location.reload()
```

**Expected Results:**
- ✅ Onboarding flag reset to false
- ✅ Page reloads
- ✅ Onboarding route shown
- ✅ All settings reset to defaults

---

## Test Suite 8: localStorage Fallback

**Goal:** Verify app works with localStorage as fallback

**Steps:**
1. Delete database: `rm ~/.config/careerforges/careerforges.db`
2. Launch app and complete onboarding
3. Close browser dev tools
4. Force clear database: `rm ~/.config/careerforges/careerforges.db`
5. Relaunch app (localStorage should provide fallback)

**Validation:**
```typescript
const { useAppStateStore } = await import('@/lib/db')

// Check if hydration happened from localStorage
const state = useAppStateStore.getState()
console.log('Provider loaded:', state.selectedProvider)  // Should exist
```

**Expected Results:**
- ✅ App still shows dashboard (localStorage cache)
- ✅ Settings are available immediately
- ✅ Database is rebuilt from migrations
- ✅ No data loss from localStorage

---

## Debug Logging

Enable debug logging to trace initialization:

```typescript
// In browser console, add before app startup
localStorage.setItem('debug', 'careerforges:*')

// Check logs
console.log('Debug logs enabled')

// Or programmatically
import { enableDebugLogging } from '@/lib/db'
enableDebugLogging()
```

**Expected Log Output:**
```
[Startup] Beginning app initialization...
[AppState] Hydrating from database
[AIAgent] Loading default agent
[Settings] Loading all settings
[Startup] Initialization complete: { ... }
[Startup] App ready, routing to /dashboard
```

---

## Performance Metrics

Track performance during startup:

```typescript
// In browser console
performance.mark('app-start')

// After app is ready
const startup = useStartup()
console.log('Is initialized:', startup.isInitialized)

performance.mark('app-ready')
const measure = performance.measure('app-startup', 'app-start', 'app-ready')
console.log('Startup time:', measure.duration, 'ms')  // Should be < 2000ms
```

**Target Performance:**
- Splash screen: < 500ms
- Total startup: < 2000ms
- First interactive: < 1500ms

---

## Cleanup After Testing

```bash
# Clear all test data
rm ~/.config/careerforges/careerforges.db
rm ~/.config/careerforges/careerforges.db-shm
rm ~/.config/careerforges/careerforges.db-wal

# Clear localStorage (in app)
# Or programmatically:
localStorage.clear()
```

---

## Validation Checklist

- [ ] First launch shows onboarding
- [ ] Onboarding completion persists
- [ ] App restart skips onboarding
- [ ] Settings persist across restarts
- [ ] Theme preference applies on load
- [ ] Auto-save setting works
- [ ] AI agents persist
- [ ] Default agent remembered
- [ ] Error handling doesn't crash app
- [ ] Reset onboarding works
- [ ] localStorage fallback works
- [ ] Startup time < 2 seconds
- [ ] No console errors
- [ ] Database file created correctly
- [ ] All tables initialized
- [ ] Default data inserted

---

## Troubleshooting Failed Tests

### Symptom: Onboarding always shows
**Diagnosis:**
```typescript
const { db } = await import('@/lib/db')
const completed = await db.getAppStateBool('onboarding_completed')
console.log('Completed:', completed)  // Should be true
```

**Fix:**
- Clear database: `rm ~/.config/careerforges/careerforges.db`
- Verify command handlers registered
- Check Rust logs: `RUST_LOG=debug cargo tauri dev`

### Symptom: Settings don't persist
**Diagnosis:**
```typescript
// Check localStorage
console.log(localStorage.getItem('settings-store'))

// Check database
sqlite3 ~/.config/careerforges/careerforges.db "SELECT * FROM settings;"
```

**Fix:**
- Verify Zustand persist middleware is enabled
- Check command handler for errors
- Clear localStorage: `localStorage.clear()`

### Symptom: Slow startup
**Diagnosis:**
```typescript
// Profile startup
performance.mark('init-start')
await initializeApp()
performance.mark('init-end')
const measure = performance.measure('init', 'init-start', 'init-end')
console.log('Init time:', measure.duration, 'ms')
```

**Fix:**
- Reduce number of queries in startup
- Use Promise.all for parallel queries
- Profile with Chrome DevTools

### Symptom: Database errors in logs
**Diagnosis:**
```bash
# Check database integrity
sqlite3 ~/.config/careerforges/careerforges.db "PRAGMA integrity_check;"

# Check for locked database
fuser ~/.config/careerforges/careerforges.db
```

**Fix:**
- Delete database: `rm ~/.config/careerforges/careerforges.db*`
- Restart app
- Check for multiple instances running

---

**Complete validation suite ready! 🧪 Run through all tests to ensure production readiness.**
