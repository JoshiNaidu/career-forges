import { useEffect, useState } from "react";
import { db } from "@/lib/db/service";
import type { Job, Resume, ActivityLog } from "@/lib/db/models";
import ResumeViewer from "@/components/resume/ResumeViewer";
import { 
  LayoutDashboard, 
  Briefcase, 
  FileText, 
  CheckCircle2, 
  Clock,
  ChevronRight,
  TrendingUp
} from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalJobs: 0,
    appliedJobs: 0,
    resumes: 0,
    interviews: 0
  });
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [defaultResume, setDefaultResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const users = await db.listUsers();
        if (users.length > 0) {
          const userId = users[0].id;
          
          const [jobs, resumes, logs, defResume] = await Promise.all([
            db.listUserJobs(userId),
            db.listUserResumes(userId),
            db.listActivityLogs(userId, 5),
            db.getDefaultResume(userId)
          ]);

          setStats({
            totalJobs: jobs.length,
            appliedJobs: jobs.filter(j => j.status === 'applied').length,
            resumes: resumes.length,
            interviews: jobs.filter(j => j.status === 'interview').length
          });

          setRecentJobs(jobs.slice(0, 3));
          setActivities(logs);
          setDefaultResume(defResume);
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Welcome back!</h1>
        <p className="mt-2 text-[var(--muted)]">Here's what's happening with your job search.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Jobs" 
          value={stats.totalJobs} 
          icon={<Briefcase className="h-5 w-5 text-blue-400" />} 
          trend="+2 this week"
        />
        <StatCard 
          title="Applications" 
          value={stats.appliedJobs} 
          icon={<CheckCircle2 className="h-5 w-5 text-green-400" />} 
          trend="85% success rate"
        />
        <StatCard 
          title="Resumes" 
          value={stats.resumes} 
          icon={<FileText className="h-5 w-5 text-purple-400" />} 
          trend="3 optimized"
        />
        <StatCard 
          title="Interviews" 
          value={stats.interviews} 
          icon={<Clock className="h-5 w-5 text-orange-400" />} 
          trend="Next: Tomorrow"
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Recent Jobs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Job Opportunities</h2>
            <button className="text-sm text-orange-400 hover:underline">View all</button>
          </div>
          <div className="space-y-4">
            {recentJobs.length > 0 ? (
              recentJobs.map(job => (
                <div key={job.id} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition hover:bg-white/[0.04]">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5">
                      <Briefcase className="h-6 w-6 text-[var(--muted)]" />
                    </div>
                    <div>
                      <h3 className="font-medium">{job.title}</h3>
                      <p className="text-sm text-[var(--muted)]">{job.company || 'Unknown Company'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                      job.status === 'applied' ? 'bg-green-500/10 text-green-400' :
                      job.status === 'interview' ? 'bg-orange-500/10 text-orange-400' :
                      'bg-white/5 text-[var(--muted)]'
                    }`}>
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
        </div>

        {/* Sidebar: Resume & Activity */}
        <div className="space-y-8">
          {/* Default Resume (The Master Piece) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Master Resume</h2>
              <button className="text-sm text-orange-400 hover:underline">Manage all</button>
            </div>
            {defaultResume ? (
              <ResumeViewer resume={defaultResume} />
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
                <p className="text-sm text-[var(--muted)]">No default resume set.</p>
                <button className="mt-4 text-xs font-medium text-orange-400 hover:underline">Upload one now</button>
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
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

function StatCard({ title, value, icon, trend }: { title: string, value: number | string, icon: React.ReactNode, trend: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition hover:bg-white/[0.04]">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
          {icon}
        </div>
        <span className="flex items-center gap-1 text-[10px] font-medium text-green-400">
          <TrendingUp className="h-3 w-3" />
          {trend}
        </span>
      </div>
      <div className="mt-4">
        <h3 className="text-sm font-medium text-[var(--muted)]">{title}</h3>
        <p className="mt-1 text-3xl font-bold">{value}</p>
      </div>
    </div>
  );
}
