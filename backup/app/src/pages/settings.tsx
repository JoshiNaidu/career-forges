import { useState, useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { db } from "../lib/db/service";
import { 
  Clock, 
  RefreshCw, 
  Zap, 
  Settings2, 
  Bell, 
  ShieldCheck, 
  Cpu,
  Calendar,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { checkForUpdatesDebug, type UpdaterDebugStatus } from "../lib/updater";

interface SchedulerStatus {
  enabled: boolean;
  frequency_mins: number;
  last_run: string | null;
  next_run: string | null;
  last_count: number;
}

export default function SettingsPage() {
  const [status, setStatus] = useState<UpdaterDebugStatus | null>(null);
  const [running, setRunning] = useState(false);
  
  // Scheduler state
  const [scheduler, setScheduler] = useState<SchedulerStatus | null>(null);
  const [loadingScheduler, setLoadingScheduler] = useState(true);
  const [manuallyRunning, setManuallyRunning] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const initialStatus = await db.getSchedulerStatus();
        setScheduler(initialStatus);
      } catch (err) {
        console.error("Failed to load scheduler status", err);
      } finally {
        setLoadingScheduler(false);
      }
    }

    init();

    // Listen for background updates
    const unlisten = listen<SchedulerStatus>("scheduler-status-update", (event) => {
      setScheduler(event.payload);
    });

    return () => {
      unlisten.then(fn => fn());
    };
  }, []);

  const handleToggleScheduler = async (enabled: boolean) => {
    try {
      await db.toggleScheduler(enabled);
      setScheduler(prev => prev ? { ...prev, enabled } : null);
    } catch (err) {
      console.error("Toggle failed", err);
    }
  };

  const handleFrequencyChange = async (mins: number) => {
    try {
      await db.updateSchedulerFrequency(mins);
      setScheduler(prev => prev ? { ...prev, frequency_mins: mins } : null);
    } catch (err) {
      console.error("Frequency update failed", err);
    }
  };

  const handleRunNow = async () => {
    try {
      setManuallyRunning(true);
      await db.runSchedulerNow();
      // Status will be updated via event or we can fetch manually
      const updated = await db.getSchedulerStatus();
      setScheduler(updated);
    } catch (err) {
      console.error("Manual run failed", err);
    } finally {
      setManuallyRunning(false);
    }
  };

  async function runDebugCheck() {
    setRunning(true);
    const result = await checkForUpdatesDebug();
    setStatus(result);
    setRunning(false);
  }

  function resetThrottleAndCheck() {
    localStorage.removeItem("lastUpdateCheck");
    runDebugCheck();
  }

  const frequencies = [
    { label: "10 Minutes", value: 10 },
    { label: "30 Minutes", value: 30 },
    { label: "1 Hour", value: 60 },
    { label: "6 Hours", value: 360 },
    { label: "12 Hours", value: 720 },
    { label: "24 Hours", value: 1440 },
  ];

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Settings</h1>
        <p className="mt-2 text-[var(--muted)]">Manage your local AI assistant preferences and background tasks.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Job Discovery Scheduler */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/20 text-orange-500">
              <RefreshCw size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Job Discovery Scheduler</h2>
              <p className="text-sm text-[var(--muted)]">Automate job fetching and matching in the background.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">Background Scheduling</p>
                <p className="text-xs text-[var(--muted)]">Continue searching for jobs while the app is open.</p>
              </div>
              <button 
                onClick={() => handleToggleScheduler(!scheduler?.enabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  scheduler?.enabled ? 'bg-orange-500' : 'bg-white/10'
                }`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  scheduler?.enabled ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-[var(--muted)]">Check Frequency</label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {frequencies.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => handleFrequencyChange(f.value)}
                    className={`rounded-xl border px-4 py-2.5 text-xs font-medium transition ${
                      scheduler?.frequency_mins === f.value
                        ? 'border-orange-500/50 bg-orange-500/10 text-orange-500'
                        : 'border-white/5 bg-white/5 text-[var(--muted)] hover:bg-white/10'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-white/5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--muted)] font-bold">Last Run</p>
                  <p className="text-sm font-medium">
                    {scheduler?.last_run ? new Date(scheduler.last_run).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }) : 'Never'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--muted)] font-bold">Next Run</p>
                  <p className="text-sm font-medium">
                    {scheduler?.next_run ? new Date(scheduler.next_run).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--muted)] font-bold">New Jobs Found</p>
                  <p className="text-sm font-medium text-green-400">{scheduler?.last_count || 0}</p>
                </div>
                <div className="flex items-end justify-end">
                  <button 
                    onClick={handleRunNow}
                    disabled={manuallyRunning || !scheduler?.enabled}
                    className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-xs font-bold transition hover:bg-white/10 disabled:opacity-50"
                  >
                    {manuallyRunning ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} className="text-orange-400" />}
                    Run Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* System & Diagnostics */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-500">
              <Cpu size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold">System & Updates</h2>
              <p className="text-sm text-[var(--muted)]">Diagnostic tools and update management.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Software Update</p>
                <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-[10px] font-bold text-blue-500">v0.1.7</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={runDebugCheck}
                  disabled={running}
                  className="flex-1 rounded-xl bg-white py-2.5 text-xs font-bold text-black transition hover:opacity-90 disabled:opacity-60"
                >
                  {running ? "Checking..." : "Check for Updates"}
                </button>
                <button
                  type="button"
                  onClick={resetThrottleAndCheck}
                  disabled={running}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-bold transition hover:bg-white/5 disabled:opacity-60"
                >
                  Reset Throttle
                </button>
              </div>
            </div>

            {status && (
              <div className="rounded-xl bg-black/40 p-4 text-xs space-y-2 border border-white/5">
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Checked At:</span>
                  <span>{status.checkedAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Update Available:</span>
                  <span className={status.available ? "text-green-400" : "text-blue-400"}>
                    {status.available ? "Yes" : "No"}
                  </span>
                </div>
                {status.error && (
                  <div className="mt-2 text-red-400 flex gap-2">
                    <AlertCircle size={14} />
                    <span className="font-mono">{status.error}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}