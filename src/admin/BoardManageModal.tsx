import { FormEvent, useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import type { AdminBoard, LanguageMode, Person } from "../lib/types";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { InlineEdit } from "../components/InlineEdit";
import { Stepper } from "../components/Stepper";
import { ConfirmInline } from "../components/ConfirmInline";
import { t } from "../lib/i18n";

export function BoardManageModal({
  board,
  people,
  language,
  saving,
  onClose,
  onUpdateBoard,
  onDeleteBoard,
  onAddPerson,
  onUpdatePerson,
  onRemovePerson,
  onMovePerson
}: {
  board: AdminBoard;
  people: Person[];
  language: LanguageMode;
  saving: boolean;
  onClose: () => void;
  onUpdateBoard: (patch: { name?: string; password?: string }) => Promise<void>;
  onDeleteBoard: () => Promise<void>;
  onAddPerson: (displayName: string, groupSize: number) => Promise<void>;
  onUpdatePerson: (
    person: Person,
    patch: Partial<{ display_name: string; group_size: number; active: boolean }>
  ) => Promise<void>;
  onRemovePerson: (personId: number) => Promise<void>;
  onMovePerson: (personId: number, direction: "up" | "down") => Promise<void>;
}) {
  const [name, setName] = useState(board.name);
  const [password, setPassword] = useState("");
  const [personName, setPersonName] = useState("");
  const [groupSize, setGroupSize] = useState(1);

  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef, true, onClose);

  useEffect(() => {
    setName(board.name);
    setPassword("");
  }, [board.id]);

  async function saveSettings(e: FormEvent) {
    e.preventDefault();
    await onUpdateBoard({
      name: name.trim(),
      ...(password.trim() ? { password: password.trim() } : {})
    });
    setPassword("");
  }

  async function addPerson(e: FormEvent) {
    e.preventDefault();
    if (!personName.trim()) return;
    await onAddPerson(personName.trim(), groupSize);
    setPersonName("");
    setGroupSize(1);
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        ref={modalRef}
        className="modal admin-modal"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`${t(language, "admin.manage")} ${board.name}`}
      >
        <header className="modal-head">
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <h2>{t(language, "admin.manage")}</h2>
            <span className="slug-pill">/{board.slug}</span>
          </div>

        </header>

        <div className="modal-content">
          <section className="modal-section">
            <h3>{t(language, "manage.settings")}</h3>
            <form onSubmit={saveSettings} className="stack-form">
              <label>
                {t(language, "admin.name")}
                <input
                  className="field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>
              <label>
                {t(language, "manage.newPassword")}
                <input
                  className="field"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t(language, "manage.keepPassword")}
                />
              </label>
              <div className="form-actions">
                <button className="btn" type="submit" disabled={saving}>
                  {t(language, "manage.saveSettings")}
                </button>
              </div>
            </form>
          </section>

          <section className="modal-section">
            <h3>{t(language, "manage.people")}</h3>
            <form onSubmit={addPerson} className="add-person-form">
              <input
                className="field"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder={t(language, "manage.nameOrGroup")}
              />
              <Stepper value={groupSize} onChange={setGroupSize} language={language} />
              <button className="btn" type="submit" disabled={saving}>
                {t(language, "manage.add")}
              </button>
            </form>

            <div className="people-admin-list">
              {people.length === 0 ? (
                <p className="muted-text">{t(language, "manage.noPeople")}</p>
              ) : (
                people.map((person, idx) => (
                  <div className="people-admin-row" key={person.id}>
                    <div className="row-reorder">
                      <button
                        type="button"
                        className="btn icon ghost-quiet xs"
                        onClick={() => onMovePerson(person.id, "up")}
                        disabled={idx === 0 || saving}
                        aria-label={t(language, "manage.moveUp")}
                        title={t(language, "manage.moveUp")}
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn icon ghost-quiet xs"
                        onClick={() => onMovePerson(person.id, "down")}
                        disabled={idx === people.length - 1 || saving}
                        aria-label={t(language, "manage.moveDown")}
                        title={t(language, "manage.moveDown")}
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>
                    <InlineEdit
                      value={person.display_name}
                      ariaLabel={t(language, "manage.personName")}
                      language={language}
                      onSave={(next) =>
                        onUpdatePerson(person, { display_name: next })
                      }
                    />
                    <Stepper
                      value={person.group_size}
                      language={language}
                      onChange={(next) =>
                        onUpdatePerson(person, { group_size: next })
                      }
                    />
                    <ConfirmInline
                      message={t(language, "manage.removePersonConfirm", { name: person.display_name })}
                      language={language}
                      onConfirm={() => onRemovePerson(person.id)}
                      trigger={(open) => (
                        <button
                          type="button"
                          className="btn icon ghost-quiet"
                          onClick={open}
                          aria-label={t(language, "manage.removePerson")}
                          title={t(language, "manage.removePerson")}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    />
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <footer className="modal-foot">
          <ConfirmInline
            message={t(language, "manage.deleteBoardConfirm", { name: board.name })}
            language={language}
            onConfirm={onDeleteBoard}
            popDir="up"
            trigger={(open) => (
              <button
                type="button"
                className="btn danger"
                onClick={open}
                disabled={saving}
              >
                <Trash2 size={14} /> {t(language, "manage.deleteBoard")}
              </button>
            )}
            />
          <button
            type="button"
            className="btn ghost"
            onClick={onClose}
            disabled={saving}
          >
            {t(language, "manage.done")}
          </button>
        </footer>
      </div>
    </div>
  );
}
