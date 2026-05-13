import { ReactNode, useEffect, useState } from "react";
import type { ThemeMode } from "../lib/types";

export function Topbar({
  theme,
  left,
  right
}: {
  theme: ThemeMode;
  left: ReactNode;
  right: ReactNode;
}) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 4);
    handle();
    window.addEventListener("scroll", handle, { passive: true });
    return () => window.removeEventListener("scroll", handle);
  }, []);

  return (
    <header className={`topbar ${scrolled ? "scrolled" : ""}`}>
      <div className="topbar-left">
        <a href="/" className="topbar-logo" aria-label="Simple Meal Plan">
          <img
            src={`/logo/crescent-${theme === "dark" ? "dark" : "light"}.svg`}
            alt=""
            width="24"
            height="24"
          />
        </a>
        {left}
      </div>
      <div className="topbar-right">{right}</div>
    </header>
  );
}
