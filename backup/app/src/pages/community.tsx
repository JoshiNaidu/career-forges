import { 
  Users, 
  MessageSquare, 
  Share2, 
  Award,
  ArrowUpRight,
  TrendingUp,
  Globe,
  Briefcase
} from "lucide-react";

export default function CommunityPage() {
  return (
    <div className="space-y-8 p-8 max-w-6xl mx-auto">
      <div className="text-center space-y-4 py-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10">
          <Users className="h-8 w-8 text-orange-500" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">CareerForges Community</h1>
        <p className="mx-auto max-w-2xl text-lg text-[var(--muted)]">
          Connect with other job seekers, share interview experiences, and build your career network — coming soon.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <CommunityCard 
          title="Interview Insights" 
          description="Read real-world interview experiences from top tech companies."
          icon={<MessageSquare className="h-5 w-5 text-blue-400" />}
          members="1.2k members"
        />
        <CommunityCard 
          title="Resume Reviews" 
          description="Get constructive feedback on your resume from industry peers."
          icon={<Share2 className="h-5 w-5 text-purple-400" />}
          members="850 members"
        />
        <CommunityCard 
          title="Skill Badges" 
          description="Earn badges for completing mock interviews and challenges."
          icon={<Award className="h-5 w-5 text-orange-400" />}
          members="Coming Soon"
        />
      </div>

      {/* Featured Discussions */}
      <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-green-400" />
            Trending Discussions
          </h2>
          <button className="text-sm text-orange-400 hover:underline">Join the conversation</button>
        </div>

        <div className="space-y-6">
          <DiscussionItem 
            title="How to handle 'What is your expected salary?' question?"
            author="Sarah J."
            replies={24}
            time="2h ago"
          />
          <DiscussionItem 
            title="My experience with Google's L4 Software Engineer interview"
            author="Mike R."
            replies={156}
            time="5h ago"
          />
          <DiscussionItem 
            title="Is it worth learning Rust for backend development in 2024?"
            author="Alex K."
            replies={89}
            time="1d ago"
          />
        </div>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="flex items-center gap-6 rounded-3xl border border-white/5 bg-white/[0.02] p-8 transition hover:bg-white/[0.04]">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
            <Globe className="h-7 w-7 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--muted)]">Active Users Worldwide</p>
            <p className="text-3xl font-bold">12,450+</p>
          </div>
        </div>
        <div className="flex items-center gap-6 rounded-3xl border border-white/5 bg-white/[0.02] p-8 transition hover:bg-white/[0.04]">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
            <Briefcase className="h-7 w-7 text-green-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--muted)]">Jobs Found This Month</p>
            <p className="text-3xl font-bold">1,820</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommunityCard({ title, description, icon, members }: { title: string, description: string, icon: React.ReactNode, members: string }) {
  return (
    <div className="group relative rounded-3xl border border-white/5 bg-white/[0.02] p-8 transition hover:bg-white/[0.04] hover:border-white/10">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 mb-6 group-hover:scale-110 transition duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-sm text-[var(--muted)] leading-relaxed mb-6">{description}</p>
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
        <span className="text-xs font-medium text-[var(--muted)]">{members}</span>
        <ArrowUpRight className="h-4 w-4 text-white/20 group-hover:text-orange-500 transition" />
      </div>
    </div>
  );
}

function DiscussionItem({ title, author, replies, time }: { title: string, author: string, replies: number, time: string }) {
  return (
    <div className="flex items-center justify-between group cursor-pointer">
      <div className="space-y-1">
        <h3 className="font-medium group-hover:text-orange-400 transition">{title}</h3>
        <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
          <span>By {author}</span>
          <span>•</span>
          <span>{time}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium">
        <MessageSquare className="h-3.5 w-3.5" />
        {replies}
      </div>
    </div>
  );
}
