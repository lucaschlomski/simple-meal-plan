import { LanguageToggle } from "./components/LanguageToggle";
import { ThemeToggle } from "./components/ThemeToggle";
import { useDocumentTitle } from "./hooks/useDocumentTitle";
import type { LanguageMode, ThemeMode } from "./lib/types";

export function LegalPage({ theme, onToggleTheme, language, onToggleLanguage }: {
  theme: ThemeMode;
  onToggleTheme: () => void;
  language: LanguageMode;
  onToggleLanguage: () => void;
}) {
  const isDe = language === "de";
  useDocumentTitle(isDe ? "Kontakt & Datenschutz - Simple Meal Plan" : "Contact & Privacy - Simple Meal Plan");
  return (
    <main className="legal-page">
      <div className="corner-actions">
        <LanguageToggle language={language} onToggle={onToggleLanguage} />
        <ThemeToggle theme={theme} onToggle={onToggleTheme} language={language} />
      </div>
      <article className="legal-card">
        <a className="legal-back" href="/">{isDe ? "Zurück" : "Back"}</a>
        <h1>{isDe ? "Kontakt & Datenschutz" : "Contact & Privacy"}</h1>

        <section>
          <h2>{isDe ? "Kontakt" : "Contact"}</h2>
          <p>Luca Schlomski</p>
          <p><a href="mailto:imprint@simple-meal-plan.com">imprint@simple-meal-plan.com</a></p>
          <p className="muted-text">{isDe ? "Dies ist kein vollständiges Impressum." : "This is not a full legal imprint."}</p>
        </section>

        <section>
          <h2>{isDe ? "Datenschutz" : "Privacy"}</h2>
          <p>{isDe ? "Simple Meal Plan speichert die Daten, die du in einem Board einträgst: Board-Name, Passwörter, Mahlzeiten, Notizen, Personen und Teilnahmen." : "Simple Meal Plan stores the data you enter into a board: board name, passwords, meals, notes, people, and attendance."}</p>
          <p>{isDe ? "Die Daten werden genutzt, um das jeweilige Board anzuzeigen und zu bearbeiten. Sie werden nicht für Werbung verkauft oder weitergegeben." : "The data is used to show and edit the relevant board. It is not sold or shared for advertising."}</p>
          <p>{isDe ? "Theme und Sprache werden lokal in deinem Browser gespeichert." : "Theme and language are stored locally in your browser."}</p>
        </section>

        <section>
          <h2>{isDe ? "Drittanbieter" : "Third parties"}</h2>
          <p>{isDe ? "Die Seite läuft über Cloudflare Pages und Cloudflare D1. Cloudflare verarbeitet technische Daten wie IP-Adresse und Server-Logs. Cloudflare Turnstile wird zur Bot-Prüfung beim Erstellen öffentlicher Boards verwendet." : "The site runs on Cloudflare Pages and Cloudflare D1. Cloudflare processes technical data such as IP address and server logs. Cloudflare Turnstile is used for bot checks when creating public boards."}</p>
          <p>{isDe ? "Der Ko-fi-Button lädt Inhalte von Ko-fi. Wenn du ihn öffnest, verarbeitet Ko-fi deine Daten nach deren eigener Datenschutzerklärung." : "The Ko-fi button loads content from Ko-fi. If you open it, Ko-fi processes your data under its own privacy policy."}</p>
        </section>

        <section>
          <h2>{isDe ? "Löschung" : "Deletion"}</h2>
          <p>{isDe ? "Wenn ein Board oder personenbezogene Daten gelöscht werden sollen, schreibe an die Kontaktadresse mit dem Board-Link." : "To request deletion of a board or personal data, email the contact address with the board link."}</p>
        </section>
      </article>
    </main>
  );
}
