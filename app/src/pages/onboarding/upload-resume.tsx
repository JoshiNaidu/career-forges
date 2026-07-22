import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import ResumeViewer from "@/components/resume/ResumeViewer";
import type { Resume } from "@/lib/db/models";

type ParseStatus = "idle" | "parsing" | "done" | "error";

export default function UploadResumePage() {
  const navigate = useNavigate();

  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [parseStatus, setParseStatus] = useState<ParseStatus>("idle");
  const [resumeData, setResumeData] = useState<Resume | null>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);
    setParseStatus("idle");

    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = Array.from(new Uint8Array(arrayBuffer));

      setFileName(file.name);
      setUploading(false);
      setParsing(true);
      setParseStatus("parsing");

      const result = await invoke<Resume>("parse_and_store_resume", {
        fileName: file.name,
        fileBytes: bytes,
      });

      setResumeData(result);
      setParseStatus("done");
      setResumeUploaded(true);
    } catch (err) {
      console.error("[Resume] Parse failed", err);
      setError(String(err));
      setParseStatus("error");
    } finally {
      setUploading(false);
      setParsing(false);
    }
  };

  const handleContinue = async () => {
    if (!resumeUploaded) return;

    try {
      const selectedProvider = await invoke<string>("db_get_selected_provider").catch(() => "ollama");
      const selectedModel = await invoke<string>("db_get_selected_model").catch(() => "llama3.2:1b");

      await invoke("db_set_app_state", {
        key: "resume_uploaded",
        value: "true",
        dataType: "boolean",
      });

      await invoke("db_set_onboarding_step", { step: "completed" });

      await invoke("db_complete_onboarding", {
        provider: selectedProvider,
        model: selectedModel,
      });

      navigate("/app/dashboard", { replace: true });
      if (window?.location?.pathname !== "/app/dashboard") {
        window.location.href = "/app/dashboard";
      }
    } catch (err) {
      console.error("[Onboarding] Complete failed", err);
      setError(String(err));
    }
  };

  return (
    <section className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-3xl rounded-3xl border border-white/5 bg-[var(--surface)] p-10">

        <p className="text-sm uppercase tracking-[0.2em] text-orange-400">
          Resume Upload
        </p>

        <h1 className="mt-4 text-4xl font-bold tracking-tight">
          Upload Your Resume
        </h1>

        <p className="mt-4 leading-7 text-[var(--muted)]">
          Upload your resume and we'll extract your profile locally —
          no data leaves your machine.
        </p>

        <div className="mt-10 flex min-h-[260px] items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.03] transition hover:border-white/20">
          <div className="text-center px-6">

            {parseStatus === "idle" && !uploading && (
              <>
                <p className="text-lg font-medium">Drag & drop your resume</p>
                <p className="mt-2 text-sm text-[var(--muted)]">PDF or DOCX supported</p>
              </>
            )}

            {uploading && (
              <p className="text-sm text-[var(--muted)] animate-pulse">
                Reading file...
              </p>
            )}

            {parseStatus === "parsing" && (
              <div className="space-y-3">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                <p className="text-sm text-orange-400 animate-pulse">
                  Parsing resume locally...
                </p>
                <p className="text-xs text-[var(--muted)]">
                  Running fully offline on your machine
                </p>
              </div>
            )}

            {parseStatus === "done" && resumeData && (
              <div className="w-full text-left">
                <div className="mb-6 flex items-center gap-2 text-green-400">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/20">
                    <span className="text-sm">✓</span>
                  </div>
                  <span className="text-sm font-medium">Resume parsed successfully</span>
                </div>
                <ResumeViewer 
                  resume={resumeData} 
                  onDelete={() => {
                    setResumeData(null);
                    setParseStatus("idle");
                    setResumeUploaded(false);
                  }} 
                />
              </div>
            )}

            {parseStatus === "error" && (
              <div className="space-y-2">
                <p className="text-sm text-red-400">Failed to parse resume</p>
                <p className="text-xs text-[var(--muted)]">{error}</p>
              </div>
            )}

            {parseStatus !== "parsing" && !uploading && (
              <label className="mt-6 inline-flex cursor-pointer rounded-xl bg-[var(--accent)] px-5 py-3 text-white transition hover:opacity-90">
                {parseStatus === "done" ? "Upload Different Resume" : "Browse Files"}
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
            )}

          </div>
        </div>

        {error && parseStatus === "error" && (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="mt-10 flex justify-end">
          <button
            onClick={handleContinue}
            disabled={!resumeUploaded}
            className={[
              "rounded-xl px-5 py-3 font-medium transition",
              resumeUploaded
                ? "bg-white text-black hover:opacity-90"
                : "cursor-not-allowed bg-white/10 text-white/40",
            ].join(" ")}
          >
            Continue to Dashboard
          </button>
        </div>

      </div>
    </section>
  );
}