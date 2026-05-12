import { useEffect, useRef, RefObject } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useFocusTrap(
  ref: RefObject<HTMLElement>,
  active: boolean,
  onEscape?: () => void,
  initialFocus = true
) {
  // Keep the callback in a ref so effect identity is tied only to `active`.
  // Without this, callers passing inline arrow functions (e.g.
  // onEscape={() => setManagingBoardId(null)}) cause the effect to re-run
  // on every parent re-render, which re-runs initial.focus() and steals
  // focus from whatever input the user is typing in. Common trigger:
  // a toast auto-dismissing somewhere up the tree while a modal is open.
  const onEscapeRef = useRef(onEscape);
  useEffect(() => {
    onEscapeRef.current = onEscape;
  });

  useEffect(() => {
    if (!active || !ref.current) return;
    const root = ref.current;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusables = () =>
      Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => !el.hasAttribute("data-focus-skip")
      );

    if (initialFocus) {
      const initial = focusables()[0];
      initial?.focus();
    }

    function handle(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onEscapeRef.current?.();
        return;
      }
      if (e.key !== "Tab") return;
      const list = focusables();
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handle);
    return () => {
      document.removeEventListener("keydown", handle);
      previouslyFocused?.focus?.();
    };
  }, [active, ref, initialFocus]);
}
