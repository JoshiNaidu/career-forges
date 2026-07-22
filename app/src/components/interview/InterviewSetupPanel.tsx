import { useState } from "react";

import {
  Brain,
  Briefcase,
  Clock3,
  Sparkles,
  FileText,
  User,
  ChevronDown,
  ChevronUp,
  Play,
  Square,
} from "lucide-react";

type Props = {
  role: string;
  setRole: (
    value: string
  ) => void;

  level: string;
  setLevel: (
    value: string
  ) => void;

  type: string;
  setType: (
    value: string
  ) => void;

  jobDescription: string;
  setJobDescription: (
    value: string
  ) => void;

  resumeContext: string;
  setResumeContext: (
    value: string
  ) => void;

  personality: string;
  setPersonality: (
    value: string
  ) => void;

  startInterview: () => void;
  finishInterview: () => void;
};

export default function InterviewSetupPanel({
  role,
  setRole,
  level,
  setLevel,
  type,
  setType,
  jobDescription,
  setJobDescription,
  resumeContext,
  setResumeContext,
  personality,
  setPersonality,
  startInterview,
  finishInterview,
}: Props) {
  const [
    showJD,
    setShowJD,
  ] = useState(true);

  const [
    showResume,
    setShowResume,
  ] = useState(false);

  return (
    <aside className="flex w-[340px] flex-col overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface)]">

      {/* HEADER */}
      <div className="border-b border-[var(--border)] p-5">

        <div className="flex items-center gap-3">

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-[0_0_25px_rgba(249,115,22,0.35)]">

            <Brain size={20} />

          </div>

          <div>

            <h2 className="text-base font-semibold text-[var(--text)]">
              Interview Setup
            </h2>

            <p className="mt-1 text-sm text-[var(--muted)]">
              Configure your AI interviewer
            </p>

          </div>

        </div>

      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto p-5">

        <div className="space-y-5">

          {/* ROLE */}
          <div className="space-y-2">

            <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              Target Role
            </label>

            <div className="relative">

              <Briefcase
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
              />

              <input
                value={role}
                onChange={(e) =>
                  setRole(
                    e.target.value
                  )
                }
                placeholder="Frontend Engineer"
                className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] pl-11 pr-4 text-sm text-[var(--text)] outline-none transition focus:border-orange-500/30"
              />

            </div>

          </div>

          {/* EXPERIENCE */}
          <div className="space-y-2">

            <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              Experience Level
            </label>

            <div className="relative">

              <Sparkles
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
              />

              <select
                value={level}
                onChange={(e) =>
                  setLevel(
                    e.target.value
                  )
                }
                className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] pl-11 pr-4 text-sm text-[var(--text)] outline-none"
              >
                <option value="junior">
                  Junior
                </option>

                <option value="mid">
                  Mid-Level
                </option>

                <option value="senior">
                  Senior
                </option>

              </select>

            </div>

          </div>

          {/* TYPE */}
          <div className="space-y-2">

            <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              Interview Type
            </label>

            <div className="relative">

              <Clock3
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
              />

              <select
                value={type}
                onChange={(e) =>
                  setType(
                    e.target.value
                  )
                }
                className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] pl-11 pr-4 text-sm text-[var(--text)] outline-none"
              >
                <option value="behavioral">
                  Behavioral
                </option>

                <option value="technical">
                  Technical
                </option>

                <option value="system-design">
                  System Design
                </option>

              </select>

            </div>

          </div>

          {/* PERSONALITY */}
          <div className="space-y-2">

            <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              AI Personality
            </label>

            <div className="relative">

              <User
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
              />

              <select
                value={personality}
                onChange={(e) =>
                  setPersonality(
                    e.target.value
                  )
                }
                className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] pl-11 pr-4 text-sm text-[var(--text)] outline-none"
              >
                <option value="Friendly Recruiter">
                  Friendly Recruiter
                </option>

                <option value="Strict FAANG Interviewer">
                  Strict FAANG Interviewer
                </option>

                <option value="Startup Founder">
                  Startup Founder
                </option>

                <option value="Technical Architect">
                  Technical Architect
                </option>

              </select>

            </div>

          </div>

          {/* JOB DESCRIPTION */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] overflow-hidden">

            <button
              onClick={() =>
                setShowJD(
                  !showJD
                )
              }
              className="flex w-full items-center justify-between px-4 py-4"
            >

              <div className="flex items-center gap-2">

                <FileText
                  size={16}
                  className="text-orange-400"
                />

                <p className="text-sm font-medium text-[var(--text)]">
                  Job Description
                </p>

              </div>

              {showJD ? (
                <ChevronUp
                  size={16}
                  className="text-[var(--muted)]"
                />
              ) : (
                <ChevronDown
                  size={16}
                  className="text-[var(--muted)]"
                />
              )}

            </button>

            {showJD && (
              <div className="border-t border-[var(--border)] p-4">

                <textarea
                  value={
                    jobDescription
                  }
                  onChange={(e) =>
                    setJobDescription(
                      e.target.value
                    )
                  }
                  placeholder="Paste job description..."
                  className="min-h-[140px] w-full resize-none rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--text)] outline-none placeholder:text-[var(--muted)]"
                />

              </div>
            )}

          </div>

          {/* RESUME */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] overflow-hidden">

            <button
              onClick={() =>
                setShowResume(
                  !showResume
                )
              }
              className="flex w-full items-center justify-between px-4 py-4"
            >

              <div className="flex items-center gap-2">

                <User
                  size={16}
                  className="text-blue-400"
                />

                <p className="text-sm font-medium text-[var(--text)]">
                  Resume Highlights
                </p>

              </div>

              {showResume ? (
                <ChevronUp
                  size={16}
                  className="text-[var(--muted)]"
                />
              ) : (
                <ChevronDown
                  size={16}
                  className="text-[var(--muted)]"
                />
              )}

            </button>

            {showResume && (
              <div className="border-t border-[var(--border)] p-4">

                <textarea
                  value={
                    resumeContext
                  }
                  onChange={(e) =>
                    setResumeContext(
                      e.target.value
                    )
                  }
                  placeholder="Paste resume highlights..."
                  className="min-h-[120px] w-full resize-none rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--text)] outline-none placeholder:text-[var(--muted)]"
                />

              </div>
            )}

          </div>

        </div>

      </div>

      {/* FOOTER ACTIONS */}
      <div className="border-t border-[var(--border)] p-5">

        <div className="grid grid-cols-2 gap-3">

          <button
            onClick={
              startInterview
            }
            className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-orange-500 text-sm font-semibold text-white shadow-[0_0_30px_rgba(249,115,22,0.35)] transition hover:scale-[1.01]"
          >

            <Play size={16} />

            Start

          </button>

          <button
            onClick={
              finishInterview
            }
            className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--surface)]"
          >

            <Square size={15} />

            Finish

          </button>

        </div>

      </div>

    </aside>
  );
}