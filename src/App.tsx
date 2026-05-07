import { useTheme } from "./hooks/useTheme";
import { useLanguage } from "./hooks/useLanguage";
import { ThemeToggle } from "./components/ThemeToggle";
import { LanguageToggle } from "./components/LanguageToggle";
import { BoardPage } from "./board/BoardPage";
import { AdminPage } from "./admin/AdminPage";
import { t } from "./lib/i18n";

function boardSlugFromPath(): string | null {
  const match = window.location.pathname.match(/^\/b\/([a-z0-9-]+)$/i);
  return match?.[1] ?? null;
}

function isAdminPath(): boolean {
  return window.location.pathname === "/admin";
}

export function App() {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage } = useLanguage();
  const slug = boardSlugFromPath();

  if (isAdminPath()) {
    return (
      <AdminPage
        theme={theme}
        onToggleTheme={toggleTheme}
        language={language}
        onToggleLanguage={toggleLanguage}
      />
    );
  }
  if (!slug) {
    return (
      <main className="center-shell landing">
        <div className="corner-actions">
          <LanguageToggle language={language} onToggle={toggleLanguage} />
          <ThemeToggle theme={theme} onToggle={toggleTheme} language={language} />
        </div>
        <div className="landing-glow" aria-hidden="true" />
        <section className="landing-hero">
          <div className="landing-mark">
            <span className="landing-dot" aria-hidden="true" />
            <span className="landing-eyebrow">{t(language, "root.eyebrow")}</span>
          </div>
          <h1 className="landing-title">{t(language, "root.title")}</h1>
          <p className="landing-tagline muted-text">
            {t(language, "root.tagline")}
          </p>
          <p className="landing-cta">
            {t(language, "root.cta")} <code>/b/&lt;slug&gt;</code>
          </p>
          <p className="landing-attribution">
            {t(language, "root.by")} <strong>Luca Schlomski</strong>
          </p>
        </section>
      </main>
    );
  }
  return (
    <BoardPage
      slug={slug}
      theme={theme}
      onToggleTheme={toggleTheme}
      language={language}
      onToggleLanguage={toggleLanguage}
    />
  );
}
