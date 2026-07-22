import { useState, useCallback, useEffect } from "react";
import {
  initialUpdaterState,
  checkForUpdates,
  downloadAndInstallUpdate,
  restartApp,
  type UpdaterState,
  type UpdateStage,
} from "@/lib/updater";
import {
  Download,
  CheckCircle2,
  Loader2,
  AlertCircle,
  RotateCw,
  ShieldCheck,
  Package,
  RefreshCw,
} from "lucide-react";

const STAGE_LABELS: Record<UpdateStage, string> = {
  idle: "Check for Updates",
  checking: "Checking for updates...",
  available: "Update Available",
  downloading: "Downloading update...",
  verifying: "Verifying integrity...",
  installing: "Installing update...",
  ready_to_restart: "Ready to restart",
  restarting: "Restarting...",
  up_to_date: "Up to date!",
  error: "Update failed",
};

const STAGE_ICONS: Record<UpdateStage, React.ReactNode> = {
  idle: <Download size={18} />,
  checking: <Loader2 size={18} className="animate-spin" />,
  available: <Package size={18} />,
  downloading: <Loader2 size={18} className="animate-spin" />,
  verifying: <ShieldCheck size={18} />,
  installing: <Loader2 size={18} className="animate-spin" />,
  ready_to_restart: <CheckCircle2 size={18} className="text-green-400" />,
  restarting: <RotateCw size={18} className="animate-spin" />,
  up_to_date: <CheckCircle2 size={18} className="text-green-400" />,
  error: <AlertCircle size={18} className="text-red-400" />,
};

export default function UpdateBanner() {
  const [state, setState] = useState<UpdaterState>(initialUpdaterState);
  const [dismissed, setDismissed] = useState(false);

  const handleCheck = useCallback(async () => {
    setState({ ...initialUpdaterState, stage: "checking" });
    const result = await checkForUpdates();
    setState(result);
  }, []);

  const handleDownload = useCallback(async () => {
    const result = await downloadAndInstallUpdate((progress) => {
      setState(progress);
    });
    setState(result);
  }, []);

  const handleRestart = useCallback(async () => {
    setState((prev) => ({ ...prev, stage: "restarting" }));
    await restartApp();
  }, []);

  // Auto-check on mount
  useEffect(() => {
    const lastCheck = localStorage.getItem("lastUpdateCheck");
    const now = Date.now();
    const twelveHours = 12 * 60 * 60 * 1000;
    if (!lastCheck || now - parseInt(lastCheck) > twelveHours) {
      handleCheck();
    }
  }, [handleCheck]);

  if (dismissed || state.stage === "idle" || state.stage === "up_to_date") {
    if (state.stage === "up_to_date" && !dismissed) {
      // Auto-dismiss up-to-date after 3 seconds
      setTimeout(() => setDismissed(true), 3000);
    }
    return null;
  }

  const showProgress = ["downloading", "verifying", "installing", "restarting"].includes(state.stage);
  const showDownloadButton = state.stage === "available";
  const showRestartButton = state.stage === "ready_to_restart";
  const showRetryButton = state.stage === "error";

  return (
    <div
      className={`fixed bottom-6 right-6 z-40 w-96 overflow-hidden rounded-2xl border shadow-2xl transition-all duration-300 ${
        state.stage === "error"
          ? "border-red-500/30 bg-red-500/[0.08]"
          : state.stage === "ready_to_restart"
          ? "border-green-500/30 bg-green-500/[0.08]"
          : "border-orange-500/30 bg-orange-500/[0.08] backdrop-blur-md"
      }`}
    >
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              {STAGE_ICONS[state.stage]}
            </div>
            <div>
              <p className="text-sm font-bold">{STAGE_LABELS[state.stage]}</p>
              {state.version && (
                <p className="text-xs text-[var(--muted)]">v{state.version}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-xs text-[var(--muted)] hover:text-white transition"
          >
            Dismiss
          </button>
        </div>

        {/* Progress Bar */}
        {showProgress && (
          <div className="space-y-2">
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-orange-500 transition-all duration-500"
                style={{ width: `${state.progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-[var(--muted)]">
              <span>
                {state.stage === "downloading" && `${state.progress}%`}
                {state.stage === "verifying" && "Checking signature..."}
                {state.stage === "installing" && "Applying update..."}
                {state.stage === "restarting" && "Please wait..."}
              </span>
              {state.downloadedBytes && state.totalBytes ? (
                <span>
                  {(state.downloadedBytes / 1024 / 1024).toFixed(1)} / {(state.totalBytes / 1024 / 1024).toFixed(1)} MB
                </span>
              ) : null}
            </div>
          </div>
        )}

        {/* Error message */}
        {state.stage === "error" && state.error && (
          <p className="rounded-lg bg-black/30 p-3 text-xs font-mono text-red-400">{state.error}</p>
        )}

        {/* Release notes */}
        {state.notes && (state.stage === "available" || state.stage === "ready_to_restart") && (
          <div className="rounded-lg bg-black/20 p-3">
            <p className="text-xs text-[var(--muted)] leading-relaxed line-clamp-3">{state.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          {showDownloadButton && (
            <button
              onClick={handleDownload}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-sm font-bold text-black transition hover:opacity-90"
            >
              <Download size={16} />
              Download & Install
            </button>
          )}
          {showRestartButton && (
            <button
              onClick={handleRestart}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-500 py-2.5 text-sm font-bold text-white transition hover:bg-green-600"
            >
              <RotateCw size={16} />
              Restart Now
            </button>
          )}
          {showRetryButton && (
            <button
              onClick={handleCheck}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/10 py-2.5 text-sm font-bold transition hover:bg-white/20"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
