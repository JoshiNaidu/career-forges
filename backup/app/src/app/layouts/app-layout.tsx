import { Outlet } from "react-router-dom";

import Sidebar from "../../components/sidebar";
import Topbar from "../../components/topbar";

export default function AppLayout() {
  return (
    <div className="theme-transition">
      <div className="flex h-screen bg-[var(--bg)] text-[var(--text)]">
        <Sidebar />

        <main className="flex flex-1 flex-col overflow-hidden">
          <Topbar />

          <div className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}