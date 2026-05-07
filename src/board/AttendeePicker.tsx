import {
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { Check, ChevronDown, X } from "lucide-react";
import type { LanguageMode, Person } from "../lib/types";
import { useOutsideClick } from "../hooks/useOutsideClick";
import { t } from "../lib/i18n";

export function AttendeePicker({
  people,
  selected,
  language,
  onToggle,
  onSelectAll,
  onClearAll
}: {
  people: Person[];
  selected: number[];
  language: LanguageMode;
  onToggle: (personId: number) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [focusIdx, setFocusIdx] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(
    () =>
      people.filter((p) =>
        p.display_name.toLowerCase().includes(search.toLowerCase())
      ),
    [people, search]
  );

  useOutsideClick(wrapRef, open, () => setOpen(false));

  useEffect(() => {
    setFocusIdx(0);
  }, [search, open]);

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape" && open) {
      // Close the dropdown first; don't let Esc bubble to the modal's
      // focus trap and close the whole modal in one keystroke.
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusIdx((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = filtered[focusIdx];
      if (target) onToggle(target.id);
    }
  }

  const selectedPeople = people.filter((p) => selected.includes(p.id));
  const count = selectedPeople.reduce((sum, p) => sum + p.group_size, 0);

  return (
    <section>
      <div className="attendee-header">
        <label htmlFor="attendee-search">{t(language, "attendees.label")}</label>
        {count > 0 ? (
          <span className="attendee-count-pill">{count}</span>
        ) : null}
      </div>
      <div className="picker-wrap" ref={wrapRef}>
        <div className="picker-input-wrap">
          <input
            id="attendee-search"
            className="field with-trailing"
            placeholder={t(language, "attendees.search")}
            value={search}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpen(true);
            }}
            onKeyDown={onKey}
          />
          <button
            type="button"
            className="picker-toggle"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? t(language, "attendees.closePicker") : t(language, "attendees.openPicker")}
            aria-expanded={open}
          >
            <ChevronDown
              size={16}
              style={{
                transition: "transform 120ms",
                transform: open ? "rotate(180deg)" : "none"
              }}
            />
          </button>
        </div>
        {open ? (
          <div className="picker-dropdown" ref={listRef} role="listbox">
            <div className="picker-dropdown-head">
              <span className="muted-text" style={{ fontSize: "var(--text-xs)" }}>
                {filtered.length} {filtered.length === 1 ? t(language, "attendees.person") : t(language, "attendees.people")}
              </span>
              <div style={{ display: "flex", gap: 4 }}>
                {people.length > 0 ? (
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => {
                      if (selected.length === people.length) onClearAll();
                      else onSelectAll();
                    }}
                  >
                    {selected.length === people.length ? t(language, "attendees.clearAll") : t(language, "attendees.selectAll")}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => setOpen(false)}
                >
                  {t(language, "attendees.done")}
                </button>
              </div>
            </div>
            {filtered.length === 0 ? (
              <div className="muted-text" style={{ padding: "8px 12px" }}>
                {t(language, "attendees.noMatches")}
              </div>
            ) : (
              filtered.map((person, idx) => {
                const isSelected = selected.includes(person.id);
                return (
                  <button
                    key={person.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`person-row ${isSelected ? "selected" : ""} ${
                      idx === focusIdx ? "focused" : ""
                    }`}
                    onClick={() => onToggle(person.id)}
                    onMouseEnter={() => setFocusIdx(idx)}
                  >
                    <span className="check">
                      {isSelected ? <Check size={12} /> : null}
                    </span>
                    <span>{person.display_name}</span>
                    <span />
                  </button>
                );
              })
            )}
          </div>
        ) : null}
      </div>
      {selectedPeople.length > 0 ? (
        <div className="chips" style={{ marginTop: 8 }}>
          {selectedPeople.map((p) => (
            <button
              key={p.id}
              type="button"
              className="chip removable"
              onClick={() => onToggle(p.id)}
              aria-label={t(language, "attendees.remove", { name: p.display_name })}
            >
              {p.display_name}
              <span className="chip-x">
                <X size={12} />
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
