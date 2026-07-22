import { useState } from "react";
import {
  Users,
  MessageSquare,
  Share2,
  Award,
  ArrowUpRight,
  TrendingUp,
  Globe,
  Briefcase,
  ThumbsUp,
  Bookmark,
  Flame,
  Pin,
  Search,
  Plus,
  Clock,
} from "lucide-react";

type Tab = "trending" | "latest" | "top";

interface Post {
  id: string;
  title: string;
  author: string;
  avatar: string;
  category: string;
  replies: number;
  likes: number;
  time: string;
  pinned?: boolean;
  excerpt: string;
}

const POSTS: Post[] = [
  {
    id: "1",
    title: "How to handle 'What is your expected salary?' question?",
    author: "Sarah J.",
    avatar: "SJ",
    category: "Interview Tips",
    replies: 24,
    likes: 89,
    time: "2h ago",
    excerpt: "I always freeze on this one. Here's a framework I've been using that takes the pressure off...",
    pinned: true,
  },
  {
    id: "2",
    title: "My experience with Google's L4 Software Engineer interview",
    author: "Mike R.",
    avatar: "MR",
    category: "Interview Experience",
    replies: 156,
    likes: 342,
    time: "5h ago",
    excerpt: "4 rounds over 2 days. System design was the hardest part. Here's everything I prepared and what I wish I'd studied more...",
  },
  {
    id: "3",
    title: "Is it worth learning Rust for backend development in 2025?",
    author: "Alex K.",
    avatar: "AK",
    category: "Career Advice",
    replies: 89,
    likes: 201,
    time: "1d ago",
    excerpt: "Coming from Python/Go, I spent 3 months diving into Rust. Here's my honest take on whether it's worth the investment...",
  },
  {
    id: "4",
    title: "Got laid off after 6 years — how I bounced back in 2 months",
    author: "Jenna L.",
    avatar: "JL",
    category: "Career Story",
    replies: 67,
    likes: 412,
    time: "2d ago",
    excerpt: "It felt like the end of the world. Here's the step-by-step process I followed to land 3 offers...",
  },
  {
    id: "5",
    title: "Resume review: 5 years experience, targeting senior backend roles",
    author: "David C.",
    avatar: "DC",
    category: "Resume Review",
    replies: 42,
    likes: 78,
    time: "3d ago",
    excerpt: "I've been applying for 2 months with no callbacks. Would love brutally honest feedback on my resume...",
  },
  {
    id: "6",
    title: "Negotiating a remote-first offer — what worked for me",
    author: "Priya N.",
    avatar: "PN",
    category: "Salary & Negotiation",
    replies: 55,
    likes: 189,
    time: "4d ago",
    excerpt: "Company wanted 3 days in-office. I negotiated fully remote with a small comp adjustment. Here's the script I used...",
  },
];

const CATEGORIES = [
  { name: "Interview Tips", icon: MessageSquare, color: "text-blue-400", count: 1240 },
  { name: "Resume Reviews", icon: Share2, color: "text-green-400", count: 856 },
  { name: "Career Advice", icon: TrendingUp, color: "text-orange-400", count: 2103 },
  { name: "Salary & Negotiation", icon: Award, color: "text-yellow-400", count: 672 },
  { name: "Job Opportunities", icon: Briefcase, color: "text-purple-400", count: 489 },
  { name: "Skill Badges", icon: Award, color: "text-pink-400", count: 0 },
];

export default function CommunityPage() {
  const [tab, setTab] = useState<Tab>("trending");
  const [search, setSearch] = useState("");

  const sortedPosts = [...POSTS].filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.author.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  if (tab === "trending") {
    sortedPosts.sort((a, b) => b.likes - a.likes);
  } else if (tab === "latest") {
    sortedPosts.sort((a, b) => a.id.localeCompare(b.id));
  } else {
    sortedPosts.sort((a, b) => b.replies - a.replies);
  }

  return (
    <div className="space-y-8 p-8 max-w-6xl mx-auto">
      {/* Hero */}
      <div className="text-center space-y-4 py-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10">
          <Users className="h-8 w-8 text-orange-500" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">CareerForges Community</h1>
        <p className="mx-auto max-w-2xl text-lg text-[var(--muted)]">
          Connect with other job seekers, share interview experiences, and build your career network.
        </p>
      </div>

      {/* Stats Banner */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
            <Globe className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">12,450+</p>
            <p className="text-xs text-[var(--muted)]">Active Members</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10">
            <Briefcase className="h-6 w-6 text-green-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">1,820</p>
            <p className="text-xs text-[var(--muted)]">Jobs Found This Month</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10">
            <Flame className="h-6 w-6 text-orange-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">5,360</p>
            <p className="text-xs text-[var(--muted)]">Posts This Week</p>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.name}
              onClick={() => setSearch(cat.name)}
              className="group flex flex-col items-center gap-2 rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition hover:bg-white/[0.04] hover:border-white/10"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 group-hover:scale-110 transition duration-300">
                <Icon className={`h-5 w-5 ${cat.color}`} />
              </div>
              <p className="text-xs font-medium text-center">{cat.name}</p>
              <p className="text-[10px] text-[var(--muted)]">{cat.count} posts</p>
            </button>
          );
        })}
      </div>

      {/* Discussion Board */}
      <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-6">
        {/* Header with tabs and search */}
        <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1 rounded-xl bg-white/5 p-1">
            <TabButton active={tab === "trending"} onClick={() => setTab("trending")} icon={<TrendingUp size={14} />}>
              Trending
            </TabButton>
            <TabButton active={tab === "latest"} onClick={() => setTab("latest")} icon={<Clock size={14} />}>
              Latest
            </TabButton>
            <TabButton active={tab === "top"} onClick={() => setTab("top")} icon={<Flame size={14} />}>
              Top
            </TabButton>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
              <Search size={16} className="text-[var(--muted)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search posts..."
                className="bg-transparent text-sm outline-none placeholder:text-[var(--muted)] w-32 sm:w-48"
              />
            </div>
            <button className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-orange-600">
              <Plus size={16} />
              New Post
            </button>
          </div>
        </div>

        {/* Posts List */}
        <div className="space-y-4">
          {sortedPosts.length > 0 ? (
            sortedPosts.map((post) => (
              <div
                key={post.id}
                className="group flex cursor-pointer flex-col gap-3 rounded-2xl border border-white/5 bg-white/[0.01] p-5 transition hover:bg-white/[0.03] hover:border-white/10 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  {/* Avatar */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-400">
                    {post.avatar}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {post.pinned && (
                        <span className="flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold text-orange-400">
                          <Pin size={10} /> Pinned
                        </span>
                      )}
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-[var(--muted)]">
                        {post.category}
                      </span>
                    </div>
                    <h3 className="font-medium group-hover:text-orange-400 transition">{post.title}</h3>
                    <p className="text-sm text-[var(--muted)] line-clamp-1">{post.excerpt}</p>
                    <div className="flex items-center gap-3 text-xs text-[var(--muted)] pt-1">
                      <span>By {post.author}</span>
                      <span>•</span>
                      <span>{post.time}</span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-2">
                  <div className="flex items-center gap-1.5 text-xs">
                    <MessageSquare size={14} className="text-[var(--muted)]" />
                    <span className="font-bold">{post.replies}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <ThumbsUp size={14} className="text-[var(--muted)]" />
                    <span className="font-bold">{post.likes}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-16 text-center">
              <p className="text-[var(--muted)]">No posts found for "{search}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
        active ? "bg-white/10 text-white" : "text-[var(--muted)] hover:text-white"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
