import { useTheme } from "./hooks/useTheme";
import { useLanguage } from "./hooks/useLanguage";
import { BoardPage } from "./board/BoardPage";
import { AdminPage } from "./admin/AdminPage";
import { RootPage } from "./RootPage";
import { LegalPage } from "./LegalPage";

function boardSlugFromPath(): string | null {
  const match = window.location.pathname.match(/^\/b\/([a-z0-9-]+)$/i);
  return match?.[1] ?? null;
}

function isAdminPath(): boolean {
  return window.location.pathname === "/admin";
}

function isLegalPath(): boolean {
  return window.location.pathname === "/legal";
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
  if (isLegalPath()) {
    return (
      <LegalPage
        theme={theme}
        onToggleTheme={toggleTheme}
        language={language}
        onToggleLanguage={toggleLanguage}
      />
    );
  }
  if (!slug) {
    return (
      <RootPage
        theme={theme}
        onToggleTheme={toggleTheme}
        language={language}
        onToggleLanguage={toggleLanguage}
      />
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
