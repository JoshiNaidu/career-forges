import { create } from "zustand";

type Theme = "dark" | "light";

type ThemeStore = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: "dark",

  setTheme: (theme) => {
    document.documentElement.setAttribute(
      "data-theme",
      theme,
    );

    localStorage.setItem("theme", theme);

    set({ theme });
  },

  toggleTheme: () =>
    set((state) => {
      const next =
        state.theme === "dark"
          ? "light"
          : "dark";

      document.documentElement.setAttribute(
        "data-theme",
        next,
      );

      localStorage.setItem("theme", next);

      return { theme: next };
    }),
}));