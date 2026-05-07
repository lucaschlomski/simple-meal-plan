import { KeyboardEvent, useEffect, useRef, useState } from "react";
import type { LanguageMode } from "../lib/types";
import { t } from "../lib/i18n";

export function InlineEdit({
  value,
  onSave,
  placeholder,
  language = "en",
  ariaLabel
}: {
  value: string;
  onSave: (next: string) => void | Promise<void>;
  placeholder?: string;
  language?: LanguageMode;
  ariaLabel?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function commit() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) {
      void onSave(trimmed);
    }
    setEditing(false);
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="inline-edit-input"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={onKey}
        aria-label={ariaLabel ?? placeholder}
      />
    );
  }

  return (
    <button
      type="button"
      className="inline-edit-display"
      onClick={() => setEditing(true)}
      title={t(language, "inline.clickToEdit")}
    >
      {value || <span className="muted-text">{placeholder ?? ""}</span>}
    </button>
  );
}
