import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/lib/db/service";
import type { Job, Resume, InterviewSession, ChatSession } from "@/lib/db/models";
import {
  Search,
  Briefcase,
  FileText,
  Mic,
  MessageSquare,
  Settings as SettingsIcon,
  LayoutDashboard,
  Sparkles,
  Users,
  ArrowRight,
} from "lucide-react";

interface SearchResult {
  id: string;
  type: "job" | "resume" | "interview" | "chat" | "page";
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  route: string;
}

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const staticPages: SearchResult[] = [
    { id: "page-dashboard", type: "page", title: "Dashboard", subtitle: "Overview and stats", icon: <LayoutDashboard size={18} className="text-blue-400" />, route: "/app/dashboard" },
    { id: "page-ats", type: "page", title: "ATS Analysis", subtitle: "Optimize resumes for job descriptions", icon: <Sparkles size={18} className="text-orange-400" />, route: "/app/ats" },
    { id: "page-jobs", type: "page", title: "Jobs", subtitle: "Browse and track job opportunities", icon: <Briefcase size={18} className="text-green-400" />, route: "/app/jobs" },
    { id: "page-interview", type: "page", title: "Interview", subtitle: "Practice mock interviews", icon: <Mic size={18} className="text-purple-400" />, route: "/app/interview" },
    { id: "page-chat", type: "page", title: "Chat", subtitle: "AI career assistant", icon: <MessageSquare size={18} className="text-blue-400" />, route: "/app/chat" },
    { id: "page-community", type: "page", title: "Community", subtitle: "Connect with other job seekers", icon: <Users size={18} className="text-orange-400" />, route: "/app/community" },
    { id: "page-settings", type: "page", title: "Settings", subtitle: "App preferences and configuration", icon: <SettingsIcon size={18} className="text-[var(--muted)]" />, route: "/app/settings" },
  ];

  const performSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults(staticPages);
      return;
    }

    setLoading(true);
    const lower = q.toLowerCase();
    const matched: SearchResult[] = [];

    // Match static pages
    staticPages.forEach((p) => {
      if (p.title.toLowerCase().includes(lower) || p.subtitle.toLowerCase().includes(lower)) {
        matched.push(p);
      }
    });

    try {
      const users = await db.listUsers();
      if (users.length > 0) {
        const userId = users[0].id;

        const [jobs, resumes, interviews, chats] = await Promise.all([
          db.listUserJobs(userId),
          db.listUserResumes(userId),
          db.listInterviewSessions(),
          db.listUserSessions(userId),
        ]);

        jobs.forEach((job: Job) => {
          if (job.title.toLowerCase().includes(lower) || (job.company || "").toLowerCase().includes(lower)) {
            matched.push({
              id: `job-${job.id}`,
              type: "job",
              title: job.title,
              subtitle: `${job.company || "Unknown"} • ${job.status}`,
              icon: <Briefcase size={18} className="text-green-400" />,
              route: "/app/jobs",
            });
          }
        });

        resumes.forEach((resume: Resume) => {
          if (resume.filename.toLowerCase().includes(lower)) {
            matched.push({
              id: `resume-${resume.id}`,
              type: "resume",
              title: resume.filename,
              subtitle: `Resume • ${new Date(resume.created_at).toLocaleDateString()}`,
              icon: <FileText size={18} className="text-orange-400" />,
              route: "/app/ats",
            });
          }
        });

        interviews.forEach((session: InterviewSession) => {
          if ((session.job_title || "").toLowerCase().includes(lower) || (session.company || "").toLowerCase().includes(lower)) {
            matched.push({
              id: `interview-${session.id}`,
              type: "interview",
              title: session.job_title || "Practice Interview",
              subtitle: `${session.company || "—"} • ${session.session_type}`,
              icon: <Mic size={18} className="text-purple-400" />,
              route: "/app/interview",
            });
          }
        });

        chats.forEach((chat: ChatSession) => {
          if (chat.title.toLowerCase().includes(lower)) {
            matched.push({
              id: `chat-${chat.id}`,
              type: "chat",
              title: chat.title,
              subtitle: `Chat session • ${chat.mode}`,
              icon: <MessageSquare size={18} className="text-blue-400" />,
              route: "/app/chat",
            });
          }
        });
      }
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setLoading(false);
    }

    setResults(matched.slice(0, 20));
    setSelectedIndex(0);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => performSearch(query), 150);
    return () => clearTimeout(timer);
  }, [query, performSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const result = results[selectedIndex];
      if (result) {
        navigate(result.route);
        setOpen(false);
      }
    }
  };

  const handleResultClick = (result: SearchResult) => {
    navigate(result.route);
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-sm text-[var(--muted)] transition hover:bg-white/5 hover:text-[var(--text)]"
        title="Search (Ctrl+K)"
      >
        <Search size={16} />
        <span>Search...</span>
        <kbd className="ml-2 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold">Ctrl+K</kbd>
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Search Modal */}
      <div className="fixed left-1/2 top-[20%] z-50 w-[90%] max-w-2xl -translate-x-1/2">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[var(--surface)] shadow-2xl">
          {/* Input */}
          <div className="flex items-center gap-3 border-b border-white/5 p-4">
            <Search size={20} className="text-[var(--muted)]" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search jobs, resumes, interviews, pages..."
              className="flex-1 bg-transparent text-lg outline-none placeholder:text-[var(--muted)]"
            />
            {loading && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
            )}
            <kbd className="rounded bg-white/10 px-2 py-1 text-[10px] font-bold text-[var(--muted)]">ESC</kbd>
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto p-2">
            {results.length > 0 ? (
              results.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${
                    index === selectedIndex ? "bg-orange-500/10" : "hover:bg-white/5"
                  }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5">
                    {result.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{result.title}</p>
                    <p className="truncate text-xs text-[var(--muted)]">{result.subtitle}</p>
                  </div>
                  <ArrowRight size={16} className={`shrink-0 transition ${index === selectedIndex ? "text-orange-400" : "text-white/10"}`} />
                </button>
              ))
            ) : (
              <div className="p-12 text-center">
                <p className="text-sm text-[var(--muted)]">No results found for "{query}"</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-white/5 px-4 py-2 text-[10px] text-[var(--muted)]">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-bold">↑↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-bold">Enter</kbd>
                Open
              </span>
            </div>
            <span>{results.length} results</span>
          </div>
        </div>
      </div>
    </>
  );
}
