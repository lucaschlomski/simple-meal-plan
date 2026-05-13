import { FormEvent, useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Trash2, X } from "lucide-react";
import type { AdminBoard, LanguageMode, Person } from "../lib/types";
import { api } from "../lib/api";
import { t } from "../lib/i18n";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { InlineEdit } from "../components/InlineEdit";
import { Stepper } from "../components/Stepper";
import { ConfirmInline } from "../components/ConfirmInline";
import { useToast } from "../components/Toast";

export function BoardAdminModal({
  slug,
  language,
  onClose,
  onChanged
}: {
  slug: string;
  language: LanguageMode;
  onClose: () => void;
  onChanged: () => Promise<void>;
}) {
  const [locked, setLocked] = useState(true);
  const [password, setPassword] = useState("");
  const [board, setBoard] = useState<AdminBoard | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [name, setName] = useState("");
  const [boardPassword, setBoardPassword] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [personName, setPersonName] = useState("");
  const [groupSize, setGroupSize] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  useFocusTrap(modalRef, true, onClose);
  const isDemoBoard = slug === "demo-meal-planner" || board?.is_demo === true;

  async function loadAll() {
    const boardData = await api<{ ok: true; board: AdminBoard }>(`/api/boards/${slug}/admin`);
    const peopleData = await api<{ ok: true; people: Person[] }>(`/api/boards/${slug}/admin/people`);
    setBoard(boardData.board);
    setName(boardData.board.name);
    setPeople(peopleData.people);
    setLocked(false);
    setError(null);
  }

  useEffect(() => {
    loadAll().catch(() => setLocked(true));
  }, [slug]);

  async function reload() {
    await loadAll();
    await onChanged();
  }

  async function unlock(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api(`/api/boards/${slug}/admin/unlock`, { method: "POST", body: JSON.stringify({ password }) });
      setPassword("");
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : t(language, "board.unlockFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function saveSettings(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api(`/api/boards/${slug}/admin`, {
        method: "PUT",
        body: JSON.stringify({
          name,
          ...(boardPassword.trim() ? { password: boardPassword.trim() } : {}),
          ...(adminPassword.trim() ? { admin_password: adminPassword.trim() } : {})
        })
      });
      if (boardPassword.trim()) {
        await api(`/api/boards/${slug}/unlock`, {
          method: "POST",
          body: JSON.stringify({ password: boardPassword.trim() })
        });
      }
      if (adminPassword.trim()) {
        await api(`/api/boards/${slug}/admin/unlock`, {
          method: "POST",
          body: JSON.stringify({ password: adminPassword.trim() })
        });
      }
      setBoardPassword("");
      setAdminPassword("");
      toast.showSuccess(t(language, "admin.boardUpdated"));
      await reload();
    } catch (err) {
      toast.showError(err instanceof Error ? err.message : t(language, "admin.updateFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function clearAdminPassword() {
    setSaving(true);
    try {
      await api(`/api/boards/${slug}/admin`, { method: "PUT", body: JSON.stringify({ admin_password: null }) });
      toast.showSuccess(t(language, "admin.boardUpdated"));
      await reload();
    } catch (err) {
      toast.showError(err instanceof Error ? err.message : t(language, "admin.updateFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function addPerson(e: FormEvent) {
    e.preventDefault();
    if (!personName.trim()) return;
    setSaving(true);
    try {
      await api(`/api/boards/${slug}/admin/people`, { method: "POST", body: JSON.stringify({ display_name: personName.trim(), group_size: groupSize }) });
      setPersonName("");
      setGroupSize(1);
      await reload();
    } catch (err) {
      toast.showError(err instanceof Error ? err.message : t(language, "admin.addPersonFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function updatePerson(person: Person, patch: Partial<{ display_name: string; group_size: number; active: boolean }>) {
    setSaving(true);
    try {
      await api(`/api/boards/${slug}/admin/people/${person.id}`, { method: "PUT", body: JSON.stringify(patch) });
      await reload();
    } catch (err) {
      toast.showError(err instanceof Error ? err.message : t(language, "admin.updateFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function removePerson(personId: number) {
    setSaving(true);
    try {
      await api(`/api/boards/${slug}/admin/people/${personId}`, { method: "DELETE" });
      await reload();
    } catch (err) {
      toast.showError(err instanceof Error ? err.message : t(language, "admin.removeFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function movePerson(personId: number, direction: "up" | "down") {
    setSaving(true);
    try {
      await api(`/api/boards/${slug}/admin/people/${personId}/move`, { method: "POST", body: JSON.stringify({ direction }) });
      await reload();
    } catch (err) {
      toast.showError(err instanceof Error ? err.message : t(language, "admin.reorderFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function deleteBoard() {
    setSaving(true);
    try {
      await api(`/api/boards/${slug}/admin`, { method: "DELETE" });
      window.location.href = "/";
    } catch (err) {
      toast.showError(err instanceof Error ? err.message : t(language, "board.deleteFailed"));
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div ref={modalRef} className="modal admin-modal" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={t(language, "admin.boardAdminTitle")}>
        <header className="modal-head">
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <h2>{t(language, "admin.boardAdminTitle")}</h2>
            <span className="slug-pill">/{slug}</span>
          </div>
          <button
            type="button"
            className="btn icon ghost-quiet"
            onClick={onClose}
            disabled={saving}
            aria-label={t(language, "meal.close")}
            title={t(language, "meal.close")}
          >
            <X size={18} />
          </button>
        </header>

        {locked ? (
          <form className="modal-content" onSubmit={unlock}>
            <label>
              {t(language, "admin.boardAdminPassword")}
              <input className="field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t(language, "admin.boardAdminPassword")} required autoFocus />
            </label>
            {error ? <p className="error-text">{error}</p> : null}
            <button className="btn" type="submit" disabled={saving}>{saving ? t(language, "board.unlocking") : t(language, "board.unlock")}</button>
          </form>
        ) : (
          <div className="modal-content">
            <section className="modal-section">
              <h3>{t(language, "manage.settings")}</h3>
              <form onSubmit={saveSettings} className="stack-form">
                <label>{t(language, "admin.name")}<input className="field" value={name} onChange={(e) => setName(e.target.value)} required disabled={isDemoBoard} /></label>
                <label>{t(language, "manage.newPassword")}<input className="field" type="password" value={boardPassword} onChange={(e) => setBoardPassword(e.target.value)} placeholder={t(language, "manage.keepPassword")} disabled={isDemoBoard} /></label>
                <label>{t(language, "manage.adminPassword")}<input className="field" type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder={board?.board_admin_enabled ? t(language, "manage.keepPassword") : t(language, "manage.adminPasswordOptional")} disabled={isDemoBoard} /></label>
                {isDemoBoard ? <p className="helper-text">{t(language, "manage.demoLockedSettings")}</p> : null}
                <div className="form-actions">
                  <button className="btn" type="submit" disabled={saving || isDemoBoard}>{t(language, "manage.saveSettings")}</button>
                  {board?.board_admin_enabled && !isDemoBoard ? <button className="btn ghost" type="button" disabled={saving} onClick={clearAdminPassword}>{t(language, "manage.clearAdminPassword")}</button> : null}
                </div>
              </form>
            </section>

            <section className="modal-section">
              <h3>{t(language, "manage.people")}</h3>
              <form onSubmit={addPerson} className="add-person-form">
                <input className="field" value={personName} onChange={(e) => setPersonName(e.target.value)} placeholder={t(language, "manage.nameOrGroup")} />
                <Stepper value={groupSize} onChange={setGroupSize} language={language} />
                <button className="btn" type="submit" disabled={saving}>{t(language, "manage.add")}</button>
              </form>
              <div className="people-admin-list">
                {people.length === 0 ? <p className="muted-text">{t(language, "manage.noPeople")}</p> : people.map((person, idx) => (
                  <div className="people-admin-row" key={person.id}>
                    <div className="row-reorder">
                      <button type="button" className="btn icon ghost-quiet xs" onClick={() => movePerson(person.id, "up")} disabled={idx === 0 || saving} aria-label={t(language, "manage.moveUp")}><ChevronUp size={14} /></button>
                      <button type="button" className="btn icon ghost-quiet xs" onClick={() => movePerson(person.id, "down")} disabled={idx === people.length - 1 || saving} aria-label={t(language, "manage.moveDown")}><ChevronDown size={14} /></button>
                    </div>
                    <InlineEdit value={person.display_name} ariaLabel={t(language, "manage.personName")} language={language} onSave={(next) => updatePerson(person, { display_name: next })} />
                    <Stepper value={person.group_size} language={language} onChange={(next) => updatePerson(person, { group_size: next })} />
                    <ConfirmInline message={t(language, "manage.removePersonConfirm", { name: person.display_name })} language={language} onConfirm={() => removePerson(person.id)} trigger={(open) => <button type="button" className="btn icon ghost-quiet" onClick={open} aria-label={t(language, "manage.removePerson")}><Trash2 size={16} /></button>} />
                  </div>
                ))}
              </div>
            </section>

            {!isDemoBoard ? (
              <section className="modal-section danger-zone">
                <h3>{t(language, "manage.dangerZone")}</h3>
                <ConfirmInline message={t(language, "manage.deleteBoardConfirm", { name: board?.name ?? slug })} language={language} popDir="up" onConfirm={deleteBoard} trigger={(open) => <button type="button" className="btn danger" onClick={open} disabled={saving}><Trash2 size={14} /> {t(language, "manage.deleteBoard")}</button>} />
              </section>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
