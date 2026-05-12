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
    // Keep the browser/iOS status bar in sync with the app background color.
    // iOS Safari only responds to theme-color changes when the meta element is
    // removed and re-inserted — mutating .content alone is silently ignored.
    // Light --bg is #f7f8fa (gray-50), dark --bg is #0c1018.
    const color = theme === "dark" ? "#0c1018" : "#f7f8fa";
    const existing = document.querySelector('meta[name="theme-color"]');
    if (existing) existing.remove();
    const meta = document.createElement("meta");
    meta.name = "theme-color";
    meta.content = color;
    document.head.appendChild(meta);
  }, [theme]);

  return {
    theme,
    toggleTheme: () =>
      setTheme((current) => (current === "light" ? "dark" : "light"))
  };
}
