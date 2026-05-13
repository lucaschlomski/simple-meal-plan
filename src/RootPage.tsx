import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { LanguageToggle } from "./components/LanguageToggle";
import { ThemeToggle } from "./components/ThemeToggle";
import { Turnstile, type TurnstileStatus } from "./components/Turnstile";
import { useDocumentTitle } from "./hooks/useDocumentTitle";
import { useFocusTrap } from "./hooks/useFocusTrap";
import { api } from "./lib/api";
import { t } from "./lib/i18n";
import type { AdminBoard, LanguageMode, ThemeMode } from "./lib/types";

function turnstileMessage(language: LanguageMode, status: TurnstileStatus): string {
  if (status === "missing") return t(language, "turnstile.missing");
  if (status === "failed") return t(language, "turnstile.failed");
  if (status === "expired") return t(language, "turnstile.expired");
  if (status === "verified") return t(language, "turnstile.verified");
  return t(language, "turnstile.verifying");
}

function CreateBoardModal({ language, saving, turnstileStatus, turnstileToken, onClose, onCreate }: {
  language: LanguageMode;
  saving: boolean;
  turnstileStatus: TurnstileStatus;
  turnstileToken: string;
  onClose: () => void;
  onCreate: (name: string, password: string, token: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLFormElement>(null);
  const shouldAutoFocus = window.matchMedia("(min-width: 700px)").matches;
  useFocusTrap(modalRef, true, onClose, shouldAutoFocus);
  const waitingForVerification = !turnstileToken;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!turnstileToken) return;
    try {
      await onCreate(name, password, turnstileToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : t(language, "root.createFailed"));
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form ref={modalRef} className="modal create-board-modal" onMouseDown={(e) => e.stopPropagation()} onSubmit={submit} role="dialog" aria-modal="true">
        <header className="modal-head">
          <h2>{t(language, "root.createBoard")}</h2>
        </header>
        <div className="modal-content">
          <p className="modal-intro">{t(language, "root.createBoardDescription")}</p>
          <label>
            {t(language, "root.boardName")}
            <input className="field" value={name} onChange={(e) => setName(e.target.value)} required autoFocus={shouldAutoFocus} />
          </label>
          <label>
            {t(language, "root.boardPassword")}
            <input className="field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t(language, "root.passwordOptional")} />
          </label>
          <p className="helper-text">{t(language, "root.boardPasswordHelp")}</p>
          {error ? <p className="error-text">{error}</p> : null}
        </div>
        <footer className="modal-foot">
          <p className={`helper-text verification-status ${waitingForVerification ? "verification-pending" : ""}`}>{turnstileMessage(language, turnstileStatus)}</p>
          <button type="button" className="btn ghost" onClick={onClose} disabled={saving}>{t(language, "meal.cancel")}</button>
          <button className="btn primary" type="submit" disabled={saving || waitingForVerification}>{saving ? t(language, "root.creating") : waitingForVerification ? t(language, "turnstile.verifyingShort") : t(language, "admin.create")}</button>
        </footer>
      </form>
    </div>
  );
}

export function RootPage({ theme, onToggleTheme, language, onToggleLanguage }: {
  theme: ThemeMode;
  onToggleTheme: () => void;
  language: LanguageMode;
  onToggleLanguage: () => void;
}) {
  useDocumentTitle("Simple Meal Plan - Plan meals together");
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load Ko-fi overlay widget once on mount. The button is rendered inside a
  // same-origin iframe via document.write, so parent CSS cannot reach button
  // colours — a single accent colour works across both themes. Re-initialising
  // on theme change causes stale setInterval timers inside Ko-fi's
  // createButtonContainerIframe to keep firing on removed elements, breaking
  // React's update cycle. Load once; clean up on unmount only.
  useEffect(() => {
    const removeKofi = () => {
      document.querySelectorAll('[id^="kofi-widget-overlay"],[class*="floatingchat"],[id^="kofi-wo"]')
        .forEach(el => el.remove());
      const existing = document.querySelector('script[src*="overlay-widget"]');
      if (existing) existing.remove();
      // Clear the cached IIFE so draw() re-initialises cleanly if remounted.
      delete (window as unknown as Record<string, unknown>).kofiWidgetOverlay;
    };
    removeKofi();

    const script = document.createElement('script');
    script.src = 'https://storage.ko-fi.com/cdn/scripts/overlay-widget.js';
    script.async = true;
    script.onload = () => {
      (window as unknown as Record<string, { draw: (id: string, opts: Record<string, string>) => void }>)
        .kofiWidgetOverlay?.draw('lucaschlomski', {
          'type': 'floating-chat',
          'floating-chat.donateButton.text': 'Support me',
          // Accent colour: readable on both light and dark backgrounds.
          'floating-chat.donateButton.background-color': '#8b6fd6',
          'floating-chat.donateButton.text-color': '#ffffff',
        });
    };
    document.body.appendChild(script);

    return () => { removeKofi(); };
  }, []); // empty deps: load once, never re-init on theme/language change
  const [turnstileStatus, setTurnstileStatus] = useState<TurnstileStatus>("loading");
  const [turnstileToken, setTurnstileToken] = useState("");

  const onTurnstileToken = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  const onTurnstileStatus = useCallback((status: TurnstileStatus) => {
    setTurnstileStatus(status);
  }, []);

  async function createBoard(name: string, password: string, turnstileToken: string) {
    setSaving(true);
    try {
      const data = await api<{ ok: true; board: AdminBoard }>("/api/boards", {
        method: "POST",
        body: JSON.stringify({ name, password, turnstileToken })
      });
      window.location.href = `/b/${data.board.slug}`;
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="center-shell landing">
      <Turnstile onStatus={onTurnstileStatus} onToken={onTurnstileToken} />
      <div className="corner-actions">
        <LanguageToggle language={language} onToggle={onToggleLanguage} />
        <ThemeToggle theme={theme} onToggle={onToggleTheme} language={language} />
      </div>
      <div className="landing-glow" aria-hidden="true" />
      <section className="landing-hero">
        <div className="landing-mark">
          <img
            src={`/logo/lockup-horizontal-${theme === "dark" ? "dark" : "light"}.svg`}
            alt="Simple Meal Plan"
            height="120"
          />
        </div>
        <h1 className="landing-title">{t(language, "root.title")}</h1>
        <p className="landing-tagline muted-text">{t(language, "root.tagline")}</p>
        <div className="landing-actions">
          <button className="btn primary landing-create-btn" type="button" onClick={() => setCreating(true)}>{t(language, "root.createBoard")}</button>
        </div>
        <p className="landing-cta">{t(language, "root.cta")} <code>/b/&lt;slug&gt;</code></p>
        <p className="landing-attribution">{t(language, "root.by")} <strong>Luca Schlomski</strong></p>
        <a className="landing-demo-link" href="/b/demo-meal-planner">{t(language, "root.openDemo")}</a>
        <p className="landing-legal">
        <a href="/legal">{language === "de" ? "Kontakt & Datenschutz" : "Contact & Privacy"}</a>
        {" · "}
        <a href="https://github.com/lucaschlomski/simple-meal-plan" target="_blank" rel="noreferrer">GitHub</a>
        {" · "}
        <a href="https://github.com/lucaschlomski/simple-meal-plan/issues" target="_blank" rel="noreferrer">Feedback</a>
      </p>
      </section>
      {creating ? <CreateBoardModal language={language} saving={saving} turnstileStatus={turnstileStatus} turnstileToken={turnstileToken} onClose={() => setCreating(false)} onCreate={createBoard} /> : null}
    </main>
  );
}
