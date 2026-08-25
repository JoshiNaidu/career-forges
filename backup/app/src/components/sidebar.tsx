import {
  Briefcase,
  FileText,
  Home,
  Settings,
  Sparkles,
  MessageSquare,
  UserCheck,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { NavLink } from "react-router-dom";

import { useSidebarStore } from "../store/sidebar-store";

import logo from "../assets/logo.png";

const items = [
  {
    label: "Dashboard",
    icon: Home,
    path: "/app/dashboard",
  },
  {
    label: "ATS Analysis",
    icon: Sparkles,
    path: "/app/ats",
  },
  {
    label: "Jobs",
    icon: Briefcase,
    path: "/app/jobs",
  },
  {
    label: "Interview",
    icon: FileText,
    path: "/app/interview",
  },
  {
    label: "Community",
    icon: Users,
    path: "/app/community",
  },
  {
    label: "Chat",
    icon: MessageSquare,
    path: "/app/chat",
  },
  {
    label: "Settings",
    icon: Settings,
    path: "/app/settings",
  },
];

export default function Sidebar() {
  const {
    isCollapsed,
    toggleSidebar,
  } = useSidebarStore();

  return (
    <aside
      className={`hidden bg-[var(--surface)] transition-all duration-300 lg:flex lg:flex-col ${
        isCollapsed
          ? "w-[84px]"
          : "w-[270px]"
      }`}
    >
      {/* HEADER */}
      <div className="flex h-[72px] items-center justify-between px-5">

        <div className="flex min-w-0 items-center gap-3">

          <img
            src={logo}
            alt="CareerForges"
            className="h-10 w-10 shrink-0 object-contain"
          />

          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-display text-[20px] font-bold tracking-tight text-[var(--text)]">
                CareerForges
              </h1>

              <p className="truncate text-xs text-[var(--muted)]">
                Local AI Career Assistant
              </p>
            </div>
          )}

        </div>

        {!isCollapsed && (
          <button
            onClick={toggleSidebar}
            className="flex ml-2 flex-shrink-0 h-9 w-9 items-center justify-center rounded-xl text-[var(--muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
          >
            <ChevronLeft size={18} />
          </button>
        )}

      </div>

      {/* NAVIGATION */}
      <nav
        className={`flex flex-1 flex-col gap-1.5 ${
          isCollapsed
            ? "items-center px-2 py-3"
            : "px-4 py-3"
        }`}
      >
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={
                isCollapsed
                  ? item.label
                  : ""
              }
              className={({
                isActive,
              }) =>
                `group flex items-center gap-3 rounded-2xl text-sm font-medium transition-all ${
                  isCollapsed
                    ? "h-12 w-12 justify-center"
                    : "px-4 py-3"
                } ${
                  isActive
                    ? "bg-[var(--accent)] text-white shadow-lg shadow-orange-500/10"
                    : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
                }`
              }
            >
              <Icon
                size={18}
                className="shrink-0"
              />

              {!isCollapsed && (
                <span>
                  {item.label}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* FOOTER */}
      <div className="p-4">

        <div
          className={`topbar-chip rounded-3xl ${
            isCollapsed
              ? "flex items-center justify-center p-3"
              : "p-4"
          }`}
        >
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-2">

                <div className="h-2 w-2 rounded-full bg-emerald-500" />

                <p className="text-sm font-medium text-[var(--text)]">
                  Ollama Connected
                </p>

              </div>

              <p className="mt-2 text-xs text-[var(--muted)]">
                llama3:8b
              </p>
            </>
          ) : (
            <div
              title="Ollama Connected"
              className="h-2.5 w-2.5 rounded-full bg-emerald-500"
            />
          )}
        </div>

        {isCollapsed && (
          <button
            onClick={toggleSidebar}
            className="mt-3 flex h-10 w-full items-center justify-center rounded-2xl text-[var(--muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
          >
            <ChevronRight size={18} />
          </button>
        )}

      </div>
    </aside>
  );
}
