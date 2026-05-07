import {
  KeyboardEvent,
  useEffect,
  useRef,
  useState
} from "react";
import { createPortal } from "react-dom";
import { Calendar } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { enGB } from "date-fns/locale";
import { de } from "date-fns/locale";
import "react-day-picker/style.css";
import type { LanguageMode } from "../lib/types";
import { t } from "../lib/i18n";

/**
 * Hybrid date picker.
 *
 * Touch devices (`(pointer: coarse)`): renders the native `<input type="date">`
 * so iOS / Android wheels and pickers are preserved.
 *
 * Desktop / fine-pointer devices: renders a typed `dd/mm/yyyy` field plus a
 * react-day-picker calendar popover, locale-locked to `en-GB` (Monday week
 * start) so format is consistent regardless of OS region.
 *
 * `value` and `onChange` always speak `YYYY-MM-DD` so the surrounding form
 * code stays unchanged.
 */
export function DatePicker({
  value,
  onChange,
  language,
  required,
  ariaLabel
}: {
  value: string;
  onChange: (next: string) => void;
  language: LanguageMode;
  required?: boolean;
  ariaLabel?: string;
}) {
  const [isTouch] = useState(() =>
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches
  );

  if (isTouch) {
    return (
      <input
        className="field"
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        aria-label={ariaLabel}
      />
    );
  }

  return (
    <DesktopDatePicker
      value={value}
      onChange={onChange}
      language={language}
      required={required}
      ariaLabel={ariaLabel}
    />
  );
}

function DesktopDatePicker({
  value,
  onChange,
  language,
  required,
  ariaLabel
}: {
  value: string;
  onChange: (next: string) => void;
  language: LanguageMode;
  required?: boolean;
  ariaLabel?: string;
}) {
  const [text, setText] = useState(isoToDmy(value));
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Re-sync displayed text when the canonical value changes externally
  // (e.g. user picks a date in the calendar, or parent resets the form).
  useEffect(() => {
    setText(isoToDmy(value));
  }, [value]);

  function commit(next: string) {
    const trimmed = next.trim();
    if (trimmed === "") return;
    const iso = dmyToIso(trimmed);
    if (iso) {
      onChange(iso);
      setText(isoToDmy(iso));
    }
    // Invalid input: leave text alone so the user sees their typo.
  }

  const selected = isoToDate(value);

  return (
    <div className="picker-wrap date-picker" ref={wrapRef}>
      <div className="picker-input-wrap">
        <input
          className="field with-trailing"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder={t(language, "date.placeholder")}
          value={text}
          required={required}
          aria-label={ariaLabel}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => commit(text)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit(text);
              setOpen(false);
            }
          }}
        />
        <button
          type="button"
          className="picker-toggle"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? t(language, "date.closeCalendar") : t(language, "date.openCalendar")}
          aria-expanded={open}
        >
          <Calendar size={16} />
        </button>
      </div>
      {open ? <CalendarOverlay
        selected={selected}
        language={language}
        onClose={() => setOpen(false)}
        onSelect={(d) => {
          onChange(dateToIso(d));
          setOpen(false);
        }}
      /> : null}
    </div>
  );
}

/**
 * Calendar rendered as a portal at body level with its own backdrop, so it is
 * always centered in the viewport and cannot be clipped by the surrounding
 * modal's `overflow: hidden` or `transform`-induced containing block.
 */
function CalendarOverlay({
  selected,
  language,
  onSelect,
  onClose
}: {
  selected: Date | undefined;
  language: LanguageMode;
  onSelect: (d: Date) => void;
  onClose: () => void;
}) {
  function onKey(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      // Stop propagation so the surrounding modal's focus trap does not also
      // close on the same keystroke. Press Esc twice to exit modal.
      e.preventDefault();
      e.stopPropagation();
      onClose();
    }
  }

  return createPortal(
    <div
      className="date-picker-backdrop"
      onMouseDown={onClose}
      onKeyDown={onKey}
    >
      <div
        className="date-picker-overlay"
        role="dialog"
        aria-label={t(language, "date.pick")}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <DayPicker
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={(d) => {
            if (d) onSelect(d);
          }}
          locale={language === "de" ? de : enGB}
          weekStartsOn={1}
          showOutsideDays
          autoFocus
        />
      </div>
    </div>,
    document.body
  );
}

// ---------------------------------------------------------------------------
// Date string helpers. All canonical values are `YYYY-MM-DD`, all displayed
// values are `dd/mm/yyyy`. We keep DayPicker on local-day Date instances
// because that is what its keyboard nav and onSelect expect.
// ---------------------------------------------------------------------------

function isoToDmy(iso: string): string {
  if (!iso) return "";
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return "";
  return `${m[3]}/${m[2]}/${m[1]}`;
}

function dmyToIso(input: string): string | null {
  // Accept any of: dd/mm/yyyy, dd.mm.yyyy, dd-mm-yyyy, ddmmyyyy.
  const normalized = input.replace(/[.\-\s]/g, "/");
  const slashed = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  const compact = normalized.match(/^(\d{2})(\d{2})(\d{4})$/);
  const m = slashed || compact;
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  let year = Number(m[3]);
  if (year < 100) year += 2000;
  // Round-trip via Date to validate the calendar date (rejects 31/02 etc.).
  const d = new Date(year, month - 1, day);
  if (
    d.getFullYear() !== year ||
    d.getMonth() !== month - 1 ||
    d.getDate() !== day
  ) {
    return null;
  }
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isoToDate(iso: string): Date | undefined {
  if (!iso) return undefined;
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return undefined;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function dateToIso(d: Date): string {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
