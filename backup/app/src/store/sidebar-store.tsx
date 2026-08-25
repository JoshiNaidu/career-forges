import { create } from "zustand";

type SidebarStore = {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebar: (collapsed: boolean) => void;
};

export const useSidebarStore = create<SidebarStore>((set) => ({
  isCollapsed: localStorage.getItem("sidebar-collapsed") === "true" ? true : false,

  setSidebar: (collapsed) => {
    localStorage.setItem("sidebar-collapsed", String(collapsed));
    set({ isCollapsed: collapsed });
  },

  toggleSidebar: () =>
    set((state) => {
      const next = !state.isCollapsed;
      localStorage.setItem("sidebar-collapsed", String(next));
      return { isCollapsed: next };
    }),
}));
