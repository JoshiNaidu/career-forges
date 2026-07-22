import { useState, useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { db } from "../lib/db/service";
import {
  Clock,
  RefreshCw,
  Zap,
  Bell,
  ShieldCheck,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Palette,
  HardDrive,
  BarChart3,
  Save,
} from "lucide-react";
import { checkForUpdatesDebug, type UpdaterDebugStatus } from "../lib/updater";
import TemplateSelector from "../components/resume/template-selector";
import type { TemplateId } from "../lib/resume-templates";
import type { StorageInfo, SettingKey } from "../lib/db/models";

interface SchedulerStatus {
  enabled: boolean;
  frequency_mins: number;
  last_run: string | null;
  next_run: string | null;
  last_count: number;
}

const NOTIFICATION_KEYS: { key: SettingKey; label: string; description: string }[] = [
  { key: "notify_new_jobs", label: "New Jobs Found", description: "When the scheduler discovers matching jobs" },
  { key: "notify_resume_ready", label: "ATS Resume Ready", description: "When a queued resume generation completes" },
  { key: "notify_interview_finished", label: "Interview Complete", description: "When a mock interview session ends" },
  { key: "notify_update_available", label: "Update Available", description: "When a new app version is available" },
  { key: "notify_task_completed", label: "Task Completed", description: "When any background task finishes" },
];

export default function SettingsPage() {
  const [status, setStatus] = useState<UpdaterDebugStatus | null>(null);
  const [running, setRunning] = useState(false);

  const [scheduler, setScheduler] = useState<SchedulerStatus | null>(null);
  const [loadingScheduler, setLoadingScheduler] = useState(true);
  const [manuallyRunning, setManuallyRunning] = useState(false);

  const [notifSettings, setNotifSettings] = useState<Record<string, boolean>>({});
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>("classic");
  const [savedToast, setSavedToast] = useState(false);

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

      try {
        const info = await db.getStorageInfo();
        setStorageInfo(info);
      } catch (err) {
        console.error("Failed to load storage info", err);
      }

      try {
        const notifMap: Record<string, boolean> = {};
        for (const n of NOTIFICATION_KEYS) {
          notifMap[n.key] = await db.getSettingBool(n.key);
        }
        setNotifSettings(notifMap);
      } catch (err) {
        console.error("Failed to load notification settings", err);
      }

      try {
        const tplSetting = await db.getSettingString("default_resume_template");
        if (tplSetting) setSelectedTemplate(tplSetting as TemplateId);
      } catch {
        // ignore
      }
    }

    init();

    const unlisten = listen<SchedulerStatus>("scheduler-status-update", (event) => {
      setScheduler(event.payload);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const handleToggleScheduler = async (enabled: boolean) => {
    try {
      await db.toggleScheduler(enabled);
      setScheduler((prev) => (prev ? { ...prev, enabled } : null));
    } catch (err) {
      console.error("Toggle failed", err);
    }
  };

  const handleFrequencyChange = async (mins: number) => {
    try {
      await db.updateSchedulerFrequency(mins);
      setScheduler((prev) => (prev ? { ...prev, frequency_mins: mins } : null));
    } catch (err) {
      console.error("Frequency update failed", err);
    }
  };

  const handleRunNow = async () => {
    try {
      setManuallyRunning(true);
      await db.runSchedulerNow();
      const updated = await db.getSchedulerStatus();
      setScheduler(updated);
    } catch (err) {
      console.error("Manual run failed", err);
    } finally {
      setManuallyRunning(false);
    }
  };

  const handleNotifToggle = async (key: SettingKey, enabled: boolean) => {
    try {
      await db.setSetting(key, String(enabled));
      setNotifSettings((prev) => ({ ...prev, [key]: enabled }));
    } catch (err) {
      console.error("Failed to update notification setting", err);
    }
  };

  const handleSaveTemplate = async () => {
    try {
      await db.setSetting("default_resume_template", selectedTemplate);
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2000);
    } catch (err) {
      console.error("Failed to save template", err);
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

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

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
                  scheduler?.enabled ? "bg-orange-500" : "bg-white/10"
                }`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  scheduler?.enabled ? "translate-x-5" : "translate-x-0"
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
                        ? "border-orange-500/50 bg-orange-500/10 text-orange-500"
                        : "border-white/5 bg-white/5 text-[var(--muted)] hover:bg-white/10"
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
                    {scheduler?.last_run ? new Date(scheduler.last_run).toLocaleString([], { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" }) : "Never"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--muted)] font-bold">Next Run</p>
                  <p className="text-sm font-medium">
                    {scheduler?.next_run ? new Date(scheduler.next_run).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Pending"}
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

        {/* Notifications */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/20 text-yellow-500">
              <Bell size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Notifications</h2>
              <p className="text-sm text-[var(--muted)]">Choose when CareerForges sends desktop notifications.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 space-y-4">
            {NOTIFICATION_KEYS.map(({ key, label, description }) => (
              <div key={key} className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium text-sm">{label}</p>
                  <p className="text-xs text-[var(--muted)]">{description}</p>
                </div>
                <button
                  onClick={() => handleNotifToggle(key, !notifSettings[key])}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    notifSettings[key] ? "bg-orange-500" : "bg-white/10"
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    notifSettings[key] ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Resume Templates */}
        <section className="space-y-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-500">
                <Palette size={20} />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Resume Templates</h2>
                <p className="text-sm text-[var(--muted)]">Choose the default template for generated resumes.</p>
              </div>
            </div>
            <button
              onClick={handleSaveTemplate}
              className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600"
            >
              {savedToast ? <CheckCircle2 size={16} /> : <Save size={16} />}
              {savedToast ? "Saved!" : "Save Template"}
            </button>
          </div>
          <TemplateSelector selected={selectedTemplate} onSelect={setSelectedTemplate} />
        </section>

        {/* Storage */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/20 text-green-500">
              <HardDrive size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Storage</h2>
              <p className="text-sm text-[var(--muted)]">Local file storage and database usage.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 space-y-4">
            {storageInfo ? (
              <>
                <StorageRow label="Resume Files" value={`${storageInfo.resumeCount} files • ${formatBytes(storageInfo.resumeSizeBytes)}`} />
                <StorageRow label="Downloads" value={`${storageInfo.downloadCount} files • ${formatBytes(storageInfo.downloadSizeBytes)}`} />
                <StorageRow label="Database Size" value={formatBytes(storageInfo.dbSizeBytes)} />
                <div className="border-t border-white/5 pt-4">
                  <p className="text-xs text-[var(--muted)] mb-2">Resume Storage Location</p>
                  <p className="font-mono text-xs bg-black/30 rounded-lg p-2 break-all">{storageInfo.resumesDir}</p>
                </div>
              </>
            ) : (
              <p className="text-sm text-[var(--muted)]">Loading storage info...</p>
            )}
          </div>
        </section>

        {/* Analytics */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-500">
              <BarChart3 size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Analytics</h2>
              <p className="text-sm text-[var(--muted)]">Track your job search progress and performance.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium text-sm">Anonymous Analytics</p>
                <p className="text-xs text-[var(--muted)]">Help improve CareerForges with usage data.</p>
              </div>
              <button
                onClick={() => handleNotifToggle("enable_analytics", !notifSettings["enable_analytics"])}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  notifSettings["enable_analytics"] ? "bg-orange-500" : "bg-white/10"
                }`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  notifSettings["enable_analytics"] ? "translate-x-5" : "translate-x-0"
                }`} />
              </button>
            </div>
            <div className="border-t border-white/5 pt-4 space-y-2">
              <p className="text-xs text-[var(--muted)]">Analytics data is stored locally and never sent to external servers.</p>
              <div className="flex items-center gap-2 text-xs text-green-400">
                <ShieldCheck size={14} />
                <span>100% local, privacy-first</span>
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

function StorageRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-[var(--muted)]">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
