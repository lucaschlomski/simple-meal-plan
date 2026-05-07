import { ReactNode, useEffect, useState } from "react";

export function Topbar({
  left,
  right
}: {
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
      <div className="topbar-left">{left}</div>
      <div className="topbar-right">{right}</div>
    </header>
  );
}
