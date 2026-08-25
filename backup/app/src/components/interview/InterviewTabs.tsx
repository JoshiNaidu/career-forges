import {
  useState,
} from "react";

import {
  FileText,
  Sparkles,
  StickyNote,
  Radio,
} from "lucide-react";

import { motion } from "framer-motion";

import TranscriptPanel from "./TranscriptPanel";

import AIOrb from "./AIOrb";

import SpeakingWave from "./SpeakingWave";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type Analysis = {
  confidence: string;
  technical: string;
  communication: string;
  feedback: string;
};

type Props = {
  messages: Message[];
  latestMessage: string;
  speaking: boolean;
  listening: boolean;
  thinking: boolean;
  aiState: string;
  analysis: Analysis | null;
  onTabChange?: (tab: "live" | "transcript" | "analysis" | "notes") => void;
  activeTab?: "live" | "transcript" | "analysis" | "notes";
};

export default function InterviewTabs({
  messages,
  latestMessage,
  speaking,
  listening,
  thinking,
  aiState,
  analysis,
  onTabChange,
  activeTab = "live",
}: Props) {
  const [internalTab, setInternalTab] =
    useState<
      | "live"
      | "transcript"
      | "analysis"
      | "notes"
    >("live");

  const tab = onTabChange ? activeTab : internalTab;
  const setTab = (t: typeof tab) => {
    if (onTabChange) {
      onTabChange(t);
    } else {
      setInternalTab(t);
    }
  };

  const tabs = [
    {
      id: "live",
      label: "Live",
      icon: Radio,
    },
    {
      id: "transcript",
      label: "Transcript",
      icon: FileText,
    },
    {
      id: "analysis",
      label: "Analysis",
      icon: Sparkles,
    },
    {
      id: "notes",
      label: "Notes",
      icon: StickyNote,
    },
  ] as const;

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface)]">

      {/* TAB BAR */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">

        <div className="flex items-center gap-2">

          {tabs.map((item) => {
            const Icon = item.icon;

            const active =
              tab === item.id;

            return (
              <button
                key={item.id}
                onClick={() =>
                  setTab(item.id)
                }
                className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition ${active
                  ? "border-orange-500/20 bg-orange-500/15 text-orange-400"
                  : "border-transparent text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
                  }`}
              >
                <Icon size={16} />

                {item.label}
              </button>
            );
          })}

        </div>

        {/* STATUS */}
        <div className="flex items-center gap-2">

          <div
            className={`h-2.5 w-2.5 rounded-full ${aiState ===
              "speaking"
              ? "bg-orange-400 animate-pulse"
              : aiState ===
                "listening"
                ? "bg-emerald-400 animate-pulse"
                : aiState ===
                  "thinking"
                  ? "bg-yellow-400 animate-pulse"
                  : "bg-white/20"
              }`}
          />

          <p className="text-xs font-medium capitalize text-[var(--muted)]">
            {aiState}
          </p>

        </div>

      </div>

      {/* CONTENT */}
      <div className="flex-1 min-h-0 overflow-hidden">

        {/* LIVE */}
        {tab === "live" && (
          <div className="flex h-full flex-col overflow-hidden">

            {/* ORB SECTION */}
            {/* ORB SECTION */}
            <div className="relative h-[360px] flex-shrink-0 overflow-hidden border-b border-[var(--border)]">

              <div className="absolute inset-0 flex flex-col items-center justify-center px-6">

                <AIOrb
                  speaking={
                    speaking
                  }
                  listening={
                    listening
                  }
                  energy={0}
                />

                <SpeakingWave
                  active={
                    speaking ||
                    listening
                  }
                  energy={0}
                />

                <motion.div
                  initial={{
                    opacity: 0,
                    y: 10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  className="mt-2 max-w-3xl text-center"
                >

                  <p className="text-[10px] uppercase tracking-[0.22em] text-orange-400">

                    {thinking
                      ? "Thinking"
                      : speaking
                        ? "Speaking"
                        : listening
                          ? "Listening"
                          : "Ready"}

                  </p>

                  <h2 className="mt-2 text-[15px] font-medium leading-7 text-[var(--text)] prose prose-invert prose-sm max-w-none">
                    {latestMessage ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {latestMessage}
                      </ReactMarkdown>
                    ) : (
                      "Start the interview to begin AI interaction."
                    )}
                  </h2>

                </motion.div>

              </div>

            </div>

            {/* LIVE TRANSCRIPT */}
            <div className="flex-1 min-h-0 overflow-hidden">

              <TranscriptPanel
                messages={
                  messages
                }
                liveMode
              />

            </div>

          </div>
        )}

        {/* TRANSCRIPT */}
        {tab ===
          "transcript" && (
            <TranscriptPanel
              messages={
                messages
              }
            />
          )}

        {/* ANALYSIS */}
        {tab === "analysis" && (
          <div className="h-full overflow-y-auto p-5">
            {analysis ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.06] p-5">
                    <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                      Confidence
                    </p>
                    <h3 className="mt-3 text-3xl font-bold text-emerald-400">
                      {analysis.confidence}
                    </h3>
                  </div>

                  <div className="rounded-2xl border border-orange-500/10 bg-orange-500/[0.06] p-5">
                    <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                      Technical
                    </p>
                    <h3 className="mt-3 text-3xl font-bold text-orange-400">
                      {analysis.technical}
                    </h3>
                  </div>

                  <div className="rounded-2xl border border-blue-500/10 bg-blue-500/[0.06] p-5">
                    <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                      Communication
                    </p>
                    <h3 className="mt-3 text-3xl font-bold text-blue-400">
                      {analysis.communication}
                    </h3>
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-6">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-orange-400 mb-4">
                    Detailed Feedback
                  </h4>
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {analysis.feedback}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-center">
                <div className="max-w-xs">
                  <Sparkles className="mx-auto mb-4 h-12 w-12 text-white/10" />
                  <h3 className="text-lg font-medium">No Analysis Yet</h3>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Complete your interview to see AI feedback and performance metrics.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* NOTES */}
        {tab ===
          "notes" && (
            <div className="h-full p-5">

              <textarea
                placeholder="Write interview notes..."
                className="h-full w-full resize-none rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-5 text-[var(--text)] outline-none placeholder:text-[var(--muted)]"
              />

            </div>
          )}

      </div>

    </div>
  );
}