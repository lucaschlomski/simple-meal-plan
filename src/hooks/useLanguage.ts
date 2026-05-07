import { useEffect, useState } from "react";
import type { LanguageMode } from "../lib/types";

const STORAGE_KEY = "mp_language";

export function useLanguage() {
  const initial = (): LanguageMode => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "de" ? "de" : "en";
  };

  const [language, setLanguage] = useState<LanguageMode>(initial);

  useEffect(() => {
    document.documentElement.setAttribute("lang", language);
    window.localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  return {
    language,
    toggleLanguage: () => setLanguage((current) => (current === "en" ? "de" : "en"))
  };
}
