import { useEffect, useState, useCallback } from "react";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { db } from "@/lib/db/service";
import type { Job, Resume, ActivityLog, BackgroundTask, GeneratedResume, InterviewSession } from "@/lib/db/models";
import ResumeViewer from "@/components/resume/ResumeViewer";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  FileText,
  CheckCircle2,
  Clock,
  ChevronRight,
  TrendingUp,
  Zap,
  Loader2,
  XCircle,
  Activity,
  Target,
  Mic,
  ArrowRight,
} from "lucide-react";

export default function DashboardPage() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalJobs: 0,
    appliedJobs: 0,
    resumes: 0,
    interviews: 0,
    pendingTasks: 0,
    avgAtsScore: 0,
    completedTasks: 0,
  });
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [defaultResume, setDefaultResume] = useState<Resume | null>(null);
  const [activeTasks, setActiveTasks] = useState<BackgroundTask[]>([]);
  const [topResumes, setTopResumes] = useState<GeneratedResume[]>([]);
  const [interviewSessions, setInterviewSessions] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const users = await db.listUsers();
      if (users.length === 0) return;
      const userId = users[0].id;

      const [jobs, resumes, logs, defResume, recentTasks, genResumes, interviews] = await Promise.all([
        db.listUserJobs(userId),
        db.listUserResumes(userId),
        db.listActivityLogs(userId, 5),
        db.getDefaultResume(userId),
        db.listRecentBackgroundTasks(10),
        db.listAllGeneratedResumes(userId),
        db.listInterviewSessions(),
      ]);

      const appliedCount = jobs.filter((j) => j.status === "applied").length;
      const interviewCount = jobs.filter((j) => j.status === "interview").length;
      const pending = recentTasks.filter((t) => t.status === "pending" || t.status === "running");
      const completed = recentTasks.filter((t) => t.status === "completed");
      const scores = genResumes.filter((r) => r.ats_score != null).map((r) => r.ats_score!);
      const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

      setStats({
        totalJobs: jobs.length,
        appliedJobs: appliedCount,
        resumes: resumes.length,
        interviews: interviewCount,
        pendingTasks: pending.length,
        avgAtsScore: avgScore,
        completedTasks: completed.length,
      });

      setRecentJobs(jobs.slice(0, 5));
      setActivities(logs);
      setDefaultResume(defResume);
      setActiveTasks(pending);
      setTopResumes(genResumes.slice(0, 4));
      setInterviewSessions(interviews.slice(0, 4));
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    let unlisten: UnlistenFn | null = null;
    listen<string>("background-task-updated", async (event) => {
      try {
        const updated = await db.getBackgroundTask(event.payload);
        if (updated) {
          if (updated.status === "completed") {
            await loadData();
          } else if (updated.status === "pending" || updated.status === "running") {
            setActiveTasks((prev) => {
              const exists = prev.find((t) => t.id === updated.id);
              if (exists) return prev.map((t) => (t.id === updated.id ? updated : t));
              return [updated, ...prev];
            });
          } else {
            setActiveTasks((prev) => prev.filter((t) => t.id !== updated.id));
          }
        }
      } catch {
        // ignore
      }
    }).then((fn) => { unlisten = fn; });

    return () => { unlisten?.(); };
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Welcome back!</h1>
          <p className="mt-2 text-[var(--muted)]">Here's what's happening with your job search.</p>
        </div>
        {stats.pendingTasks > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-orange-500/20 bg-orange-500/10 px-4 py-2">
            <Loader2 className="h-4 w-4 animate-spin text-orange-400" />
            <span className="text-sm font-bold text-orange-400">{stats.pendingTasks} task{stats.pendingTasks > 1 ? "s" : ""} running</span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Jobs" value={stats.totalJobs} icon={<Briefcase className="h-5 w-5 text-blue-400" />} accent="blue" />
        <StatCard title="Applications" value={stats.appliedJobs} icon={<CheckCircle2 className="h-5 w-5 text-green-400" />} accent="green" />
        <StatCard title="Avg ATS Score" value={stats.avgAtsScore > 0 ? `${stats.avgAtsScore}%` : "—"} icon={<Target className="h-5 w-5 text-orange-400" />} accent="orange" />
        <StatCard title="Interviews" value={stats.interviews} icon={<Mic className="h-5 w-5 text-purple-400" />} accent="purple" />
      </div>

      {/* Active Tasks Banner */}
      {activeTasks.length > 0 && (
        <div className="rounded-2xl border border-orange-500/20 bg-orange-500/[0.04] p-5">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-orange-400" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-orange-400">Active Background Tasks</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 rounded-xl bg-white/[0.03] p-3">
                {task.status === "running" ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-orange-400" />
                ) : (
                  <Clock className="h-4 w-4 shrink-0 text-[var(--muted)]" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{task.label}</p>
                  <div className="mt-1.5 h-1 w-full rounded-full bg-white/5">
                    <div
                      className="h-1 rounded-full bg-orange-500 transition-all duration-500"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-bold text-[var(--muted)]">{task.progress}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Recent Jobs */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Job Opportunities</h2>
            <button onClick={() => navigate("/app/jobs")} className="flex items-center gap-1 text-sm text-orange-400 hover:underline">
              View all <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3">
            {recentJobs.length > 0 ? (
              recentJobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => navigate("/app/jobs")}
                  className="flex cursor-pointer items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition hover:bg-white/[0.04]"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5">
                      <Briefcase className="h-6 w-6 text-[var(--muted)]" />
                    </div>
                    <div>
                      <h3 className="font-medium">{job.title}</h3>
                      <p className="text-sm text-[var(--muted)]">{job.company || "Unknown Company"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {job.match_score != null && (
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-green-400" />
                        <span className="text-sm font-bold text-green-400">{Math.round(job.match_score)}%</span>
                      </div>
                    )}
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        job.status === "applied"
                          ? "bg-green-500/10 text-green-400"
                          : job.status === "interview"
                          ? "bg-orange-500/10 text-orange-400"
                          : "bg-white/5 text-[var(--muted)]"
                      }`}
                    >
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </span>
                    <ChevronRight className="h-5 w-5 text-white/20" />
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
                <p className="text-[var(--muted)]">No jobs found. Start searching to see results!</p>
              </div>
            )}
          </div>

          {/* Top ATS Resumes */}
          {topResumes.length > 0 && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Recent ATS Optimized Resumes</h2>
                <button onClick={() => navigate("/app/ats")} className="flex items-center gap-1 text-sm text-orange-400 hover:underline">
                  View all <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {topResumes.map((gr) => (
                  <div
                    key={gr.id}
                    onClick={() => navigate("/app/ats")}
                    className="cursor-pointer rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition hover:bg-white/[0.04]"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{gr.job_title || "Untitled Position"}</p>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {gr.generated_at ? new Date(gr.generated_at).toLocaleDateString() : "—"}
                        </p>
                      </div>
                      {gr.ats_score != null && (
                        <div className="flex flex-col items-end">
                          <span className={`text-2xl font-bold ${gr.ats_score >= 80 ? "text-green-400" : gr.ats_score >= 60 ? "text-orange-400" : "text-red-400"}`}>
                            {gr.ats_score}
                          </span>
                          <span className="text-[10px] uppercase tracking-wider text-[var(--muted)]">ATS</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interview Sessions */}
          {interviewSessions.length > 0 && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Recent Interview Sessions</h2>
                <button onClick={() => navigate("/app/interview")} className="flex items-center gap-1 text-sm text-orange-400 hover:underline">
                  View all <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {interviewSessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => navigate("/app/interview")}
                    className="cursor-pointer rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition hover:bg-white/[0.04]"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{session.job_title || "Practice Interview"}</p>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {session.company || "—"} • {new Date(session.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {session.score != null && (
                        <div className="flex flex-col items-end">
                          <span className={`text-2xl font-bold ${session.score >= 80 ? "text-green-400" : session.score >= 60 ? "text-orange-400" : "text-red-400"}`}>
                            {session.score}
                          </span>
                          <span className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Score</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Resume & Activity */}
        <div className="space-y-8">
          {/* Default Resume */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Master Resume</h2>
              <button onClick={() => navigate("/app/ats")} className="text-sm text-orange-400 hover:underline">Manage</button>
            </div>
            {defaultResume ? (
              <ResumeViewer resume={defaultResume} />
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
                <p className="text-sm text-[var(--muted)]">No default resume set.</p>
                <button onClick={() => navigate("/app/ats")} className="mt-4 flex items-center gap-1 text-xs font-medium text-orange-400 hover:underline mx-auto">
                  Upload one now <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          {/* Activity Feed */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Recent Activity</h2>
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 space-y-6">
              {activities.length > 0 ? (
                activities.map((log, i) => (
                  <div key={log.id} className="relative flex gap-4">
                    {i !== activities.length - 1 && (
                      <div className="absolute left-2 top-6 h-full w-[1px] bg-white/5" />
                    )}
                    <div className="z-10 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-orange-500/20 ring-4 ring-[var(--surface)]">
                      <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm leading-none">{log.action}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-[var(--muted)]">No recent activity.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  accent,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  accent: "blue" | "green" | "orange" | "purple";
}) {
  const accentBg: Record<string, string> = {
    blue: "bg-blue-500/10",
    green: "bg-green-500/10",
    orange: "bg-orange-500/10",
    purple: "bg-purple-500/10",
  };

  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition hover:bg-white/[0.04]">
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accentBg[accent]}`}>
          {icon}
        </div>
        <Zap className="h-4 w-4 text-white/10" />
      </div>
      <div className="mt-4">
        <h3 className="text-sm font-medium text-[var(--muted)]">{title}</h3>
        <p className="mt-1 text-3xl font-bold">{value}</p>
      </div>
    </div>
  );
}
