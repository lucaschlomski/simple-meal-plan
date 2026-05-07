import type { LanguageMode } from "./types";
import { t } from "./i18n";

const LOCALE: Record<LanguageMode, string> = {
  en: "en-GB",
  de: "de-DE"
};

export function fmtWeekday(date: string, language: LanguageMode): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString(LOCALE[language], {
    weekday: "long",
    timeZone: "UTC"
  });
}

export function fmtDate(date: string, language: LanguageMode): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString(LOCALE[language], {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  });
}

export function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isToday(date: string): boolean {
  return date === todayIsoDate();
}

/** Returns relative day label for ±7 days; null otherwise. */
export function relativeDayLabel(date: string, language: LanguageMode): string | null {
  const today = new Date(todayIsoDate() + "T00:00:00Z").getTime();
  const target = new Date(date + "T00:00:00Z").getTime();
  const diff = Math.round((target - today) / (1000 * 60 * 60 * 24));
  if (diff === 0) return null; // covered by Today pill
  if (diff === 1) return t(language, "relative.tomorrow");
  if (diff === -1) return t(language, "relative.yesterday");
  if (diff > 1 && diff <= 7) return t(language, "relative.inDays", { n: diff });
  if (diff < -1 && diff >= -7) return t(language, "relative.daysAgo", { n: Math.abs(diff) });
  return null;
}
