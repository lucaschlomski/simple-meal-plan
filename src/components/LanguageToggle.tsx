import { Languages } from "lucide-react";
import type { LanguageMode } from "../lib/types";
import { languageLabel, t } from "../lib/i18n";

export function LanguageToggle({
  language,
  onToggle,
  className
}: {
  language: LanguageMode;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`btn language-toggle ghost-quiet ${className ?? ""}`}
      onClick={onToggle}
      aria-label={language === "en" ? t(language, "language.toDe") : t(language, "language.toEn")}
      title={language === "en" ? t(language, "language.toDe") : t(language, "language.toEn")}
    >
      <Languages size={16} />
      <span>{languageLabel(language)}</span>
    </button>
  );
}
