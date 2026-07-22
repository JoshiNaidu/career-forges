import { Download, FileJson, FileText, RefreshCw, Send, X } from "lucide-react";

import type { GeneratedCoverLetter, GeneratedResume, Job } from "@/lib/db/models";

type AssetViewerMode = "resume" | "coverLetter" | "application";

interface AtsAssetViewerProps {
  job: Job;
  resume?: GeneratedResume;
  coverLetter?: GeneratedCoverLetter;
  mode: AssetViewerMode;
  regenerating?: "resume" | "cv" | null;
  onClose: () => void;
  onRegenerateResume: () => void;
  onRegenerateCoverLetter: () => void;
  onUseForApplication: () => void;
}

type ParsedGeneratedResume = {
  optimized?: {
    summary?: string;
    skills?: string[];
    experience_bullets?: string[];
    ats_score?: number;
    strengths?: string[];
    weaknesses?: string[];
    recommendations?: string[];
  };
};

export default function AtsAssetViewer({
  job,
  resume,
  coverLetter,
  mode,
  regenerating,
  onClose,
  onRegenerateResume,
  onRegenerateCoverLetter,
  onUseForApplication,
}: AtsAssetViewerProps) {
  const parsedResume = parseGeneratedResume(resume);
  const score = resume?.ats_score ?? parsedResume?.optimized?.ats_score;
  const title = mode === "coverLetter"
    ? "ATS Cover Letter"
    : mode === "application"
      ? "Application Assets"
      : "ATS Resume";

  const resumeText = buildResumeText(job, resume, parsedResume);
  const coverLetterText = coverLetter?.content ?? "";

  return (
    <div className="fixed inset-0 z-[9990] overflow-y-auto bg-black/75 p-4 backdrop-blur-sm fade-in">
      <div className="mx-auto my-6 max-w-6xl rounded-3xl border border-white/10 bg-[var(--surface)] shadow-[var(--shadow-lg)] scale-in">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 rounded-t-3xl border-b border-white/10 bg-[var(--surface)]/95 p-6 backdrop-blur">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-orange-400">{job.company || "Company"}</p>
            <h2 className="mt-2 text-2xl font-bold">{title}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {job.title} {resume?.generated_at || resume?.created_at ? `- Generated ${formatDate(resume?.generated_at || resume?.created_at)}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-[var(--muted)] hover:bg-white/5 hover:text-white"
            aria-label="Close ATS asset viewer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            {mode !== "coverLetter" && resume && (
              <ResumePreview
                resume={resume}
                parsedResume={parsedResume}
                job={job}
              />
            )}
            {mode !== "coverLetter" && !resume && (
              <MissingAsset
                title="No ATS resume yet"
                description="Generate a job-specific ATS resume from the master resume before using it in this application."
                actionLabel={regenerating === "resume" ? "Generating..." : "Generate ATS Resume"}
                onAction={onRegenerateResume}
                disabled={regenerating !== null}
              />
            )}

            {mode !== "resume" && coverLetter && (
              <section className="rounded-3xl border border-white/5 bg-white/[0.02] p-6">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-lg font-bold">
                    <FileText className="h-5 w-5 text-orange-400" />
                    Cover Letter Preview
                  </h3>
                  <span className="text-xs text-[var(--muted)]">{formatDate(coverLetter.generated_at || coverLetter.created_at)}</span>
                </div>
                <div className="max-h-[520px] overflow-y-auto whitespace-pre-wrap rounded-2xl bg-[var(--bg)] p-6 text-sm leading-7 text-white/90">
                  {coverLetter.content}
                </div>
              </section>
            )}
            {mode !== "resume" && !coverLetter && (
              <MissingAsset
                title="No cover letter yet"
                description="Generate a cover letter tailored to this job and company before applying."
                actionLabel={regenerating === "cv" ? "Generating..." : "Generate Cover Letter"}
                onAction={onRegenerateCoverLetter}
                disabled={regenerating !== null}
              />
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">Job</p>
              <h3 className="mt-2 font-bold">{job.title}</h3>
              <p className="mt-1 text-sm text-orange-400">{job.company || "Unknown company"}</p>
              {score !== undefined && (
                <div className="mt-5 rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-orange-300">ATS Score</p>
                  <p className="mt-2 text-4xl font-bold text-white">{Math.round(score)}%</p>
                </div>
              )}
            </div>

            {resume && (
              <FeedbackPanel
                title="Strengths"
                items={splitFeedback(resume.ats_strengths, parsedResume?.optimized?.strengths)}
                tone="success"
              />
            )}
            {resume && (
              <FeedbackPanel
                title="Weaknesses"
                items={splitFeedback(resume.ats_weaknesses, parsedResume?.optimized?.weaknesses)}
                tone="danger"
              />
            )}
            {resume && (
              <FeedbackPanel
                title="Recommendations"
                items={splitFeedback(resume.ats_recommendations, parsedResume?.optimized?.recommendations)}
                tone="warning"
              />
            )}

            <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-5">
              <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[var(--muted)]">Actions</p>
              <div className="space-y-3">
                {resume && (
                  <>
                    <ActionButton icon={Download} label="Download Resume PDF" onClick={() => downloadPdf("ats-resume.pdf", resumeText)} />
                    <ActionButton icon={FileJson} label="Download Resume JSON" onClick={() => downloadJson("ats-resume.json", resume.generated_resume_json || JSON.stringify(resume, null, 2))} />
                    <ActionButton icon={RefreshCw} label={regenerating === "resume" ? "Regenerating..." : "Regenerate Resume"} onClick={onRegenerateResume} disabled={regenerating !== null} />
                  </>
                )}
                {coverLetter && (
                  <>
                    <ActionButton icon={Download} label="Download Cover Letter PDF" onClick={() => downloadPdf("cover-letter.pdf", coverLetterText)} />
                    <ActionButton icon={FileText} label="Download Cover Letter" onClick={() => downloadText("cover-letter.txt", coverLetterText, "text/plain")} />
                    <ActionButton icon={RefreshCw} label={regenerating === "cv" ? "Regenerating..." : "Regenerate Cover Letter"} onClick={onRegenerateCoverLetter} disabled={regenerating !== null} />
                  </>
                )}
                <ActionButton icon={Send} label="Use for Application" onClick={onUseForApplication} disabled={!resume && !coverLetter} strong />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function MissingAsset({
  title,
  description,
  actionLabel,
  onAction,
  disabled,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  disabled?: boolean;
}) {
  return (
    <section className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
      <FileText className="h-10 w-10 text-white/20" />
      <h3 className="mt-4 text-lg font-bold">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-[var(--muted)]">{description}</p>
      <button
        type="button"
        onClick={onAction}
        disabled={disabled}
        className="mt-5 flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-black transition hover:opacity-90 disabled:opacity-50"
      >
        {disabled ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
        {actionLabel}
      </button>
    </section>
  );
}

function ResumePreview({
  resume,
  parsedResume,
  job,
}: {
  resume: GeneratedResume;
  parsedResume: ParsedGeneratedResume | null;
  job: Job;
}) {
  const summary = parsedResume?.optimized?.summary ?? resume.optimized_summary;
  const skills = parsedResume?.optimized?.skills ?? resume.optimized_skills?.split(",").map((skill) => skill.trim()).filter(Boolean) ?? [];
  const bullets = parsedResume?.optimized?.experience_bullets ?? parseBullets(resume.optimized_experience);

  return (
    <section className="rounded-3xl border border-white/5 bg-white/[0.02] p-6">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-bold">
          <FileText className="h-5 w-5 text-orange-400" />
          Resume Preview
        </h3>
        <span className="text-xs text-[var(--muted)]">{formatDate(resume.generated_at || resume.created_at)}</span>
      </div>
      <div className="space-y-8 rounded-2xl bg-[var(--bg)] p-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-orange-400">{job.title}</p>
          <h4 className="mt-2 text-2xl font-bold">Job-Tailored ATS Resume</h4>
          <p className="mt-1 text-sm text-[var(--muted)]">{job.company || "Unknown company"}</p>
        </div>
        {summary && (
          <div>
            <h5 className="mb-3 text-xs font-bold uppercase tracking-widest text-orange-400">Professional Summary</h5>
            <p className="text-sm leading-7 text-white/90">{summary}</p>
          </div>
        )}
        {skills.length > 0 && (
          <div>
            <h5 className="mb-3 text-xs font-bold uppercase tracking-widest text-orange-400">Relevant Skills</h5>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span key={skill} className="rounded-lg border border-white/5 bg-white/5 px-3 py-1.5 text-xs text-white/85">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
        {bullets.length > 0 && (
          <div>
            <h5 className="mb-3 text-xs font-bold uppercase tracking-widest text-orange-400">Optimized Experience</h5>
            <ul className="space-y-3">
              {bullets.map((bullet) => (
                <li key={bullet} className="flex gap-3 text-sm leading-6 text-white/90">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                  {bullet}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

function FeedbackPanel({ title, items, tone }: { title: string; items: string[]; tone: "success" | "danger" | "warning" }) {
  if (items.length === 0) return null;

  const toneClassName = {
    success: "text-green-400",
    danger: "text-red-400",
    warning: "text-yellow-400",
  }[tone];

  return (
    <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-5">
      <h3 className={`text-sm font-bold ${toneClassName}`}>{title}</h3>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="text-xs leading-5 text-[var(--muted)]">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  strong,
}: {
  icon: typeof Download;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  strong?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:opacity-50 ${
        strong
          ? "bg-white text-black hover:opacity-90"
          : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function parseGeneratedResume(resume?: GeneratedResume): ParsedGeneratedResume | null {
  if (!resume?.generated_resume_json) return null;

  try {
    return JSON.parse(resume.generated_resume_json) as ParsedGeneratedResume;
  } catch {
    return null;
  }
}

function parseBullets(value?: string) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return value.split("\n").map((item) => item.trim()).filter(Boolean);
  }
}

function splitFeedback(value?: string, fallback?: string[]) {
  if (fallback?.length) return fallback;
  return value?.split("\n").map((item) => item.trim()).filter(Boolean) ?? [];
}

function buildResumeText(job: Job, resume?: GeneratedResume, parsedResume?: ParsedGeneratedResume | null) {
  if (!resume) return "";

  const summary = parsedResume?.optimized?.summary ?? resume.optimized_summary ?? "";
  const skills = parsedResume?.optimized?.skills ?? resume.optimized_skills?.split(",").map((skill) => skill.trim()).filter(Boolean) ?? [];
  const bullets = parsedResume?.optimized?.experience_bullets ?? parseBullets(resume.optimized_experience);

  return [
    `ATS Resume for ${job.title}`,
    job.company ? `Company: ${job.company}` : "",
    "",
    "Professional Summary",
    summary,
    "",
    "Relevant Skills",
    skills.join(", "),
    "",
    "Optimized Experience",
    ...bullets.map((bullet) => `- ${bullet}`),
  ].filter(Boolean).join("\n");
}

function formatDate(value?: string) {
  if (!value) return "Unknown date";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function downloadJson(filename: string, content: string) {
  downloadText(filename, content, "application/json");
}

function downloadPdf(filename: string, content: string) {
  const lines = content.split("\n").flatMap((line) => wrapLine(line, 86));
  const textCommands = lines.slice(0, 42).map((line, index) => `BT /F1 10 Tf 50 ${760 - index * 16} Td (${escapePdfText(line)}) Tj ET`).join("\n");
  const stream = `${textCommands}\n`;
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${stream.length} >> stream\n${stream}endstream endobj`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) {
    offsets.push(pdf.length);
    pdf += `${object}\n`;
  }
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  downloadText(filename, pdf, "application/pdf");
}

function downloadText(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function wrapLine(line: string, width: number) {
  if (line.length <= width) return [line];

  const words = line.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (`${current} ${word}`.trim().length > width) {
      lines.push(current);
      current = word;
    } else {
      current = `${current} ${word}`.trim();
    }
  }

  if (current) lines.push(current);
  return lines;
}

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}
