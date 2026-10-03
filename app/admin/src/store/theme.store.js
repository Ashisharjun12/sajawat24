import { create } from "zustand";

export const THEME_STORAGE_KEY = "vite-ui-theme";

function readStoredTheme() {
  if (typeof window === "undefined") return "dark";
  return window.localStorage.getItem(THEME_STORAGE_KEY) || "dark";
}

export function applyThemeClass(theme) {
  const root = window.document.documentElement;
  root.classList.remove("light", "dark");

  if (theme === "system") {
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    root.classList.add(systemTheme);
    return;
  }

  root.classList.add(theme);
}

export const useThemeStore = create((set) => ({
  theme: readStoredTheme(),
  setTheme: (theme) => {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    applyThemeClass(theme);
    set({ theme });
  },
}));

if (typeof window !== "undefined") {
  applyThemeClass(readStoredTheme());
}
