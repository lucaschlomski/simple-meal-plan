import { useEffect, useState } from "react";
import type { ThemeMode } from "../lib/types";

export function useTheme() {
  const initial = (): ThemeMode => {
    const stored = window.localStorage.getItem("mp_theme");
    if (stored === "dark" || stored === "light") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  };

  const [theme, setTheme] = useState<ThemeMode>(initial);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("mp_theme", theme);
  }, [theme]);

  return {
    theme,
    toggleTheme: () =>
      setTheme((current) => (current === "light" ? "dark" : "light"))
  };
}
