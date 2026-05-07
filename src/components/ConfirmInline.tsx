import {
  KeyboardEvent,
  ReactNode,
  useEffect,
  useRef,
  useState
} from "react";
import { useOutsideClick } from "../hooks/useOutsideClick";
import type { LanguageMode } from "../lib/types";
import { t } from "../lib/i18n";

export function ConfirmInline({
  trigger,
  message,
  language = "en",
  confirmLabel,
  onConfirm,
  popDir = "down"
}: {
  trigger: (open: () => void) => ReactNode;
  message: string;
  language?: LanguageMode;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
  popDir?: "up" | "down";
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  useOutsideClick(wrapRef, open, () => setOpen(false));

  // When the popover opens, move focus into it so subsequent keys are
  // dispatched from within and can be caught by the wrap's keydown handler
  // (Esc to close just the popover, not the surrounding modal).
  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);

  function onKey(e: KeyboardEvent<HTMLDivElement>) {
    if (open && e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    }
  }

  return (
    <div className="confirm-wrap" ref={wrapRef} onKeyDown={onKey}>
      {trigger(() => setOpen(true))}
      {open ? (
        <div
          className={`confirm-popover ${popDir === "up" ? "pop-up" : ""}`}
          role="dialog"
        >
          <span className="muted-text">{message}</span>
          <div className="confirm-actions">
            <button
              ref={cancelRef}
              type="button"
              className="btn ghost"
              onClick={() => setOpen(false)}
            >
              {t(language, "confirm.cancel")}
            </button>
            <button
              type="button"
              className="btn danger"
              onClick={async () => {
                setOpen(false);
                await onConfirm();
              }}
            >
              {confirmLabel ?? t(language, "confirm.confirm")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
