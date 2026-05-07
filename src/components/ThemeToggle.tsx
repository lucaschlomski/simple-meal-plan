import { Moon, Sun } from "lucide-react";
import type { LanguageMode, ThemeMode } from "../lib/types";
import { t } from "../lib/i18n";

export function ThemeToggle({
  theme,
  onToggle,
  language,
  className
}: {
  theme: ThemeMode;
  onToggle: () => void;
  language: LanguageMode;
  className?: string;
}) {
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      className={`btn icon ghost-quiet ${className ?? ""}`}
      onClick={onToggle}
      aria-label={isDark ? t(language, "theme.toLight") : t(language, "theme.toDark")}
      title={isDark ? t(language, "theme.light") : t(language, "theme.dark")}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
