import { useEffect, RefObject } from "react";

export function useOutsideClick(
  ref: RefObject<HTMLElement>,
  active: boolean,
  onOutside: () => void
) {
  useEffect(() => {
    if (!active) return;
    function handle(e: MouseEvent) {
      const node = ref.current;
      if (!node) return;
      if (node.contains(e.target as Node)) return;
      onOutside();
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [ref, active, onOutside]);
}
