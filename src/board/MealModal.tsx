import {
  FormEvent,
  KeyboardEvent,
  useMemo,
  useRef,
  useState
} from "react";
import { Trash2, X } from "lucide-react";
import type { LanguageMode, Meal, MealType, Person } from "../lib/types";
import { MEAL_TYPES } from "../lib/types";
import { fmtDate } from "../lib/dates";
import { mealTypeLabel, t } from "../lib/i18n";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { SegmentedControl } from "../components/SegmentedControl";
import { AttendeePicker } from "./AttendeePicker";
import { ConfirmInline } from "../components/ConfirmInline";
import { DatePicker } from "../components/DatePicker";

export function MealModal({
  meal,
  date,
  people,
  language,
  defaultMealType,
  saving,
  onClose,
  onDelete,
  onSave
}: {
  meal: Meal | null;
  date: string;
  people: Person[];
  language: LanguageMode;
  defaultMealType: MealType;
  saving: boolean;
  onClose: () => void;
  onDelete: (id: number) => void;
  onSave: (payload: {
    id?: number;
    meal_date: string;
    meal_type: MealType;
    meal_name: string | null;
    cooks_text: string | null;
    notes: string | null;
    selectedPersonIds: number[];
    originalPersonIds: number[];
  }) => Promise<void>;
}) {
  const [mealName, setMealName] = useState(meal?.meal_name ?? "");
  const [mealType, setMealType] = useState<MealType>(() => {
    const existingType = meal?.meal_type;
    return MEAL_TYPES.includes(existingType as MealType)
      ? (existingType as MealType)
      : defaultMealType;
  });
  const [mealDate, setMealDate] = useState(date);
  const [cooksText, setCooksText] = useState(meal?.cooks_text ?? "");
  const [notes, setNotes] = useState(meal?.notes ?? "");
  const originalPersonIds = useMemo(
    () => meal?.attendees.map((a) => a.person_id) ?? [],
    [meal]
  );
  const [selected, setSelected] = useState<number[]>(originalPersonIds);

  const modalRef = useRef<HTMLFormElement>(null);
  useFocusTrap(modalRef, true, onClose);

  function toggle(personId: number) {
    setSelected((prev) =>
      prev.includes(personId)
        ? prev.filter((id) => id !== personId)
        : [...prev, personId]
    );
  }

  function selectAll() {
    setSelected(people.map((p) => p.id));
  }

  function clearAll() {
    setSelected([]);
  }

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    await onSave({
      id: meal?.id,
      meal_date: mealDate,
      meal_type: mealType,
      meal_name: mealName.trim() || null,
      cooks_text: cooksText.trim() || null,
      notes: notes.trim() || null,
      selectedPersonIds: selected,
      originalPersonIds
    });
  }

  function onKey(e: KeyboardEvent<HTMLFormElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void submit();
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form
        ref={modalRef}
        className="modal"
        onMouseDown={(e) => e.stopPropagation()}
        onSubmit={submit}
        onKeyDown={onKey}
        aria-modal="true"
        role="dialog"
      >
        <header className="modal-head">
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <h2>{meal ? t(language, "meal.edit") : t(language, "meal.add")}</h2>
            {mealDate ? (
              <span className="date-pill">{fmtDate(mealDate, language)}</span>
            ) : null}
          </div>
          <div className="modal-head-actions">
            {meal ? (
              <ConfirmInline
                message={t(language, "meal.delete")}
                language={language}
                confirmLabel={t(language, "confirm.confirm")}
                onConfirm={() => onDelete(meal.id)}
                trigger={(open) => (
                  <button
                    type="button"
                    className="btn icon ghost-quiet"
                    onClick={open}
                    aria-label={t(language, "meal.deleteAria")}
                    title={t(language, "meal.deleteAria")}
                    disabled={saving}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              />
            ) : null}
            <button
              type="button"
              className="btn icon ghost-quiet"
              onClick={onClose}
              aria-label={t(language, "meal.close")}
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="modal-content">
          <label>
            {t(language, "meal.name")}
            <input
              className="field"
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
              placeholder={t(language, "meal.namePlaceholder")}
              autoFocus
            />
          </label>

          <label>
            {t(language, "meal.type")}
            <SegmentedControl<MealType>
              ariaLabel={t(language, "meal.typeAria")}
              value={mealType}
              onChange={(v) => setMealType(v)}
              options={MEAL_TYPES.map((t) => ({
                value: t,
                label: mealTypeLabel(language, t),
                className: `type-${t}`
              }))}
            />
          </label>

          <div className="form-row two-col">
            <label>
              {t(language, "meal.cook")}
              <input
                className="field"
                value={cooksText}
                onChange={(e) => setCooksText(e.target.value)}
                placeholder={t(language, "meal.cookPlaceholder")}
              />
            </label>

            <label>
              {t(language, "meal.date")}
              <DatePicker
                value={mealDate}
                onChange={setMealDate}
                language={language}
                required
                ariaLabel={t(language, "meal.dateAria")}
              />
            </label>
          </div>

          <AttendeePicker
            people={people}
            selected={selected}
            language={language}
            onToggle={toggle}
            onSelectAll={selectAll}
            onClearAll={clearAll}
          />

          <label>
            {t(language, "meal.notes")}
            <textarea
              className="field"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder={t(language, "meal.notesPlaceholder")}
            />
          </label>
        </div>

        <footer className="modal-foot">
          <button
            type="button"
            className="btn ghost"
            onClick={onClose}
            disabled={saving}
          >
            {t(language, "meal.cancel")}
          </button>
          <button className="btn primary" type="submit" disabled={saving}>
            {saving ? t(language, "meal.saving") : t(language, "meal.save")}
          </button>
        </footer>
      </form>
    </div>
  );
}
