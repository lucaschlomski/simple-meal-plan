import { FormEvent, useEffect, useState } from "react";
import { ExternalLink, LogOut, Settings } from "lucide-react";
import type { AdminBoard, LanguageMode, Person, ThemeMode } from "../lib/types";
import { api } from "../lib/api";
import { Topbar } from "../components/Topbar";
import { ThemeToggle } from "../components/ThemeToggle";
import { LanguageToggle } from "../components/LanguageToggle";
import { useToast } from "../components/Toast";
import { t } from "../lib/i18n";
import { BoardManageModal } from "./BoardManageModal";

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
  const [managingBoardId, setManagingBoardId] = useState<number | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
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

  async function loadPeople(boardId: number) {
    const data = await api<{ ok: true; people: Person[] }>(
      `/api/admin/boards/${boardId}/people`
    );
    setPeople(data.people);
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

  useEffect(() => {
    if (managingBoardId) {
      loadPeople(managingBoardId).catch(() => setPeople([]));
    } else {
      setPeople([]);
    }
  }, [managingBoardId]);

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
    setPeople([]);
    setManagingBoardId(null);
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

  async function updateBoard(
    boardId: number,
    patch: { name?: string; password?: string }
  ) {
    setSaving(true);
    try {
      await api(`/api/admin/boards/${boardId}`, {
        method: "PUT",
        body: JSON.stringify(patch)
      });
      toast.showSuccess(t(language, "admin.boardUpdated"));
      await loadBoards();
    } catch (err) {
      toast.showError(err instanceof Error ? err.message : t(language, "admin.updateFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function addPerson(boardId: number, displayName: string, groupSize: number) {
    setSaving(true);
    try {
      await api(`/api/admin/boards/${boardId}/people`, {
        method: "POST",
        body: JSON.stringify({ display_name: displayName, group_size: groupSize })
      });
      toast.showSuccess(t(language, "admin.personAdded"));
      await loadPeople(boardId);
    } catch (err) {
      toast.showError(err instanceof Error ? err.message : t(language, "admin.addPersonFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function removePerson(boardId: number, personId: number) {
    setSaving(true);
    try {
      await api(`/api/admin/people/${personId}`, { method: "DELETE" });
      toast.showSuccess(t(language, "admin.personRemoved"));
      await loadPeople(boardId);
    } catch (err) {
      toast.showError(err instanceof Error ? err.message : t(language, "admin.removeFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function updatePerson(
    boardId: number,
    person: Person,
    patch: Partial<{ display_name: string; group_size: number; active: boolean }>
  ) {
    setSaving(true);
    try {
      await api(`/api/admin/people/${person.id}`, {
        method: "PUT",
        body: JSON.stringify(patch)
      });
      await loadPeople(boardId);
    } catch (err) {
      toast.showError(err instanceof Error ? err.message : t(language, "admin.updateFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function movePerson(boardId: number, personId: number, direction: "up" | "down") {
    setSaving(true);
    try {
      await api(`/api/admin/people/${personId}/move`, {
        method: "POST",
        body: JSON.stringify({ direction })
      });
      await loadPeople(boardId);
    } catch (err) {
      toast.showError(err instanceof Error ? err.message : t(language, "admin.reorderFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function deleteBoard(boardId: number) {
    setSaving(true);
    try {
      await api(`/api/admin/boards/${boardId}`, { method: "DELETE" });
      toast.showSuccess(t(language, "admin.boardDeleted"));
      setManagingBoardId(null);
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

  const managedBoard = boards.find((b) => b.id === managingBoardId) ?? null;

  return (
    <main className="admin-page">
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
                <span />
              </div>
              {boards.map((b) => (
                <div key={b.id} className="boards-table-row">
                  <span>{b.name}</span>
                  <span>
                    <code>/{b.slug}</code>
                  </span>
                  <span className="row-actions">
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
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => setManagingBoardId(b.id)}
                    >
                      <Settings size={14} /> {t(language, "admin.manage")}
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>

      {managedBoard ? (
        <BoardManageModal
          key={managedBoard.id}
          board={managedBoard}
          people={people}
          language={language}
          saving={saving}
          onClose={() => setManagingBoardId(null)}
          onUpdateBoard={(patch) => updateBoard(managedBoard.id, patch)}
          onDeleteBoard={() => deleteBoard(managedBoard.id)}
          onAddPerson={(n, g) => addPerson(managedBoard.id, n, g)}
          onUpdatePerson={(person, patch) =>
            updatePerson(managedBoard.id, person, patch)
          }
          onRemovePerson={(pid) => removePerson(managedBoard.id, pid)}
          onMovePerson={(pid, dir) => movePerson(managedBoard.id, pid, dir)}
        />
      ) : null}
    </main>
  );
}
