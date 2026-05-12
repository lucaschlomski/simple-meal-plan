import { FormEvent, useEffect, useState } from "react";
import { ExternalLink, LogOut, Trash2 } from "lucide-react";
import type { AdminBoard, LanguageMode, ThemeMode } from "../lib/types";
import { api } from "../lib/api";
import { Topbar } from "../components/Topbar";
import { ThemeToggle } from "../components/ThemeToggle";
import { LanguageToggle } from "../components/LanguageToggle";
import { useToast } from "../components/Toast";
import { t } from "../lib/i18n";
import { ConfirmInline } from "../components/ConfirmInline";

function displayDateTime(value: string | null): string {
  return value || "-";
}

export function AdminPage({
  theme,
  onToggleTheme,
  language,
  onToggleLanguage
}: {
  theme: ThemeMode;
  onToggleTheme: () => void;
  language: LanguageMode;
  onToggleLanguage: () => void;
}) {
  const [authed, setAuthed] = useState(false);
  const [loginPassword, setLoginPassword] = useState("");
  const [boards, setBoards] = useState<AdminBoard[]>([]);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const toast = useToast();

  async function loadBoards() {
    const data = await api<{ ok: true; boards: AdminBoard[] }>(
      "/api/admin/boards"
    );
    setBoards(data.boards);
  }

  async function checkSession() {
    try {
      await api("/api/admin/session");
      setAuthed(true);
      await loadBoards();
    } catch {
      setAuthed(false);
    }
  }

  useEffect(() => {
    checkSession();
  }, []);

  async function login(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setLoginError(null);
    try {
      await api("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ password: loginPassword })
      });
      setLoginPassword("");
      await checkSession();
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : t(language, "admin.loginFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await api("/api/admin/logout", { method: "POST" });
    setAuthed(false);
    setBoards([]);
  }

  async function createBoard(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api("/api/admin/boards", {
        method: "POST",
        body: JSON.stringify({ name, password })
      });
      setName("");
      setPassword("");
      toast.showSuccess(t(language, "admin.boardCreated"));
      await loadBoards();
    } catch (err) {
      toast.showError(err instanceof Error ? err.message : t(language, "admin.createFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function deleteBoard(boardId: number) {
    setSaving(true);
    try {
      await api(`/api/admin/boards/${boardId}`, { method: "DELETE" });
      toast.showSuccess(t(language, "admin.boardDeleted"));
      await loadBoards();
    } catch (err) {
      toast.showError(err instanceof Error ? err.message : t(language, "board.deleteFailed"));
    } finally {
      setSaving(false);
    }
  }

  if (!authed) {
    return (
      <main className="center-shell">
        <div className="corner-actions">
          <LanguageToggle language={language} onToggle={onToggleLanguage} />
          <ThemeToggle theme={theme} onToggle={onToggleTheme} language={language} />
        </div>
        <form className="panel" onSubmit={login}>
          <h1>{t(language, "admin.loginTitle")}</h1>
          <input
            className="field"
            type="password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            placeholder={t(language, "admin.password")}
            required
            autoFocus
          />
          {loginError ? <p className="error-text">{loginError}</p> : null}
          <button className="btn" type="submit" disabled={saving}>
            {saving ? t(language, "admin.signingIn") : t(language, "admin.signIn")}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="admin-page admin-overview-page">
      <Topbar
        left={<span className="topbar-title">{t(language, "admin.title")}</span>}
        right={
          <>
            <LanguageToggle language={language} onToggle={onToggleLanguage} />
            <ThemeToggle theme={theme} onToggle={onToggleTheme} language={language} />
            <button
              type="button"
              className="btn icon ghost-quiet"
              onClick={logout}
              aria-label={t(language, "admin.logout")}
              title={t(language, "admin.logout")}
            >
              <LogOut size={18} />
            </button>
          </>
        }
      />

      <section className="admin-stack">
        <section className="panel wide">
          <h2>{t(language, "admin.createBoard")}</h2>
          <form onSubmit={createBoard} className="create-board-form">
            <input
              className="field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t(language, "admin.boardName")}
              required
            />
            <input
              className="field"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t(language, "admin.boardPassword")}
              required
            />
            <button className="btn" type="submit" disabled={saving}>
              {t(language, "admin.create")}
            </button>
          </form>
          <p className="helper-text">
            {t(language, "admin.slugHelp")}
          </p>
        </section>

        <section className="panel wide">
          <h2>{t(language, "admin.boards")}</h2>
          {boards.length === 0 ? (
            <div className="empty-state">
              <p className="muted-text">{t(language, "admin.noBoards")}</p>
            </div>
          ) : (
            <div className="boards-table">
              <div className="boards-table-head">
                <span>{t(language, "admin.name")}</span>
                <span>{t(language, "admin.slug")}</span>
                <span>{t(language, "admin.createdAt")}</span>
                <span>{t(language, "admin.updatedAt")}</span>
                <span>{t(language, "admin.lastAccessedAt")}</span>
                <span />
              </div>
              {boards.map((b) => (
                <div key={b.id} className="boards-table-row">
                  <span className="boards-cell boards-name" data-label={t(language, "admin.name")}>{b.name}</span>
                  <span className="boards-cell boards-slug" data-label={t(language, "admin.slug")}>
                    <code>/{b.slug}</code>
                  </span>
                  <span className="boards-cell boards-meta" data-label={t(language, "admin.createdAt")}>{displayDateTime(b.created_at)}</span>
                  <span className="boards-cell boards-meta" data-label={t(language, "admin.updatedAt")}>{displayDateTime(b.updated_at)}</span>
                  <span className="boards-cell boards-meta" data-label={t(language, "admin.lastAccessedAt")}>{displayDateTime(b.last_accessed_at)}</span>
                  <span className="row-actions" data-label={t(language, "admin.actions")}>
                    <a
                      className="btn icon ghost-quiet"
                      href={`/b/${b.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={t(language, "admin.openBoard")}
                      title={t(language, "admin.openBoard")}
                    >
                      <ExternalLink size={16} />
                    </a>
                    <ConfirmInline
                      message={t(language, "manage.deleteBoardConfirm", { name: b.name })}
                      language={language}
                      onConfirm={() => deleteBoard(b.id)}
                      trigger={(open) => (
                        <button
                          type="button"
                          className="btn icon ghost-quiet"
                          onClick={open}
                          disabled={saving}
                          aria-label={t(language, "manage.deleteBoard")}
                          title={t(language, "manage.deleteBoard")}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    />
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>

    </main>
  );
}
