import { FormEvent, useEffect, useRef, useState } from "react";
import type {
  Board,
  Day,
  Meal,
  MealType,
  Person,
  LanguageMode,
  ThemeMode
} from "../lib/types";
import { MEAL_TYPES } from "../lib/types";
import { api } from "../lib/api";
import { todayIsoDate } from "../lib/dates";
import { Topbar } from "../components/Topbar";
import { ThemeToggle } from "../components/ThemeToggle";
import { LanguageToggle } from "../components/LanguageToggle";
import { useToast } from "../components/Toast";
import { t } from "../lib/i18n";
import { DayColumn } from "./DayColumn";
import { MealModal } from "./MealModal";

function defaultMealTypeForDate(date: string | null, days: Day[]): MealType {
  const day = date ? days.find((candidate) => candidate.date === date) : null;
  const usedTypes = new Set(
    (day?.meals ?? [])
      .map((meal) => meal.meal_type)
      .filter((type): type is MealType => MEAL_TYPES.includes(type as MealType))
  );
  return MEAL_TYPES.find((type) => !usedTypes.has(type)) ?? "other";
}

export function BoardPage({
  slug,
  theme,
  onToggleTheme,
  language,
  onToggleLanguage
}: {
  slug: string;
  theme: ThemeMode;
  onToggleTheme: () => void;
  language: LanguageMode;
  onToggleLanguage: () => void;
}) {
  const [locked, setLocked] = useState(true);
  const [password, setPassword] = useState("");
  const [board, setBoard] = useState<Board | null>(null);
  const [days, setDays] = useState<Day[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Meal | null>(null);
  const [createDate, setCreateDate] = useState<string | null>(null);
  const toast = useToast();

  const railRef = useRef<HTMLDivElement>(null);
  const [edgeLeft, setEdgeLeft] = useState(false);
  const [edgeRight, setEdgeRight] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  async function loadAll() {
    const boardData = await api<{ ok: true; board: Board; days: Day[] }>(
      `/api/boards/${slug}/board`
    );
    const peopleData = await api<{ ok: true; people: Person[] }>(
      `/api/boards/${slug}/people`
    );
    setBoard(boardData.board);
    setDays(boardData.days);
    setPeople(peopleData.people);
    setLocked(false);
    setError(null);
  }

  useEffect(() => {
    loadAll().catch(() => setLocked(true));
  }, [slug]);

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      setEdgeLeft(el.scrollLeft > 4);
      setEdgeRight(el.scrollLeft < max - 4);
      const first = el.firstElementChild as HTMLElement | null;
      const step = first?.offsetWidth || el.clientWidth || 1;
      setCurrentIndex(Math.round(el.scrollLeft / step));
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [days]);

  function scrollToDay(index: number) {
    const el = railRef.current;
    if (!el) return;
    const first = el.firstElementChild as HTMLElement | null;
    const step = first?.offsetWidth || el.clientWidth || 1;
    el.scrollTo({ left: index * step, behavior: "smooth" });
  }

  async function unlock(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api(`/api/boards/${slug}/unlock`, {
        method: "POST",
        body: JSON.stringify({ password })
      });
      setPassword("");
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : t(language, "board.unlockFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function saveMeal(payload: {
    id?: number;
    meal_date: string;
    meal_type: MealType;
    meal_name: string | null;
    cooks_text: string | null;
    notes: string | null;
    selectedPersonIds: number[];
    originalPersonIds: number[];
  }) {
    setSaving(true);
    try {
      let mealId = payload.id;
      if (mealId) {
        await api(`/api/meals/${mealId}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
      } else {
        const created = await api<{ ok: true; meal: { id: number } }>(
          `/api/boards/${slug}/meals`,
          { method: "POST", body: JSON.stringify(payload) }
        );
        mealId = created.meal.id;
      }

      const toAdd = payload.selectedPersonIds.filter(
        (id) => !payload.originalPersonIds.includes(id)
      );
      const toRemove = payload.originalPersonIds.filter(
        (id) => !payload.selectedPersonIds.includes(id)
      );

      await Promise.all([
        ...toAdd.map((personId) =>
          api(`/api/meals/${mealId}/attendees`, {
            method: "POST",
            body: JSON.stringify({ personId })
          })
        ),
        ...toRemove.map((personId) =>
          api(`/api/meals/${mealId}/attendees/${personId}`, {
            method: "DELETE"
          })
        )
      ]);

      setEditing(null);
      setCreateDate(null);
      toast.showSuccess(payload.id ? t(language, "board.mealUpdated") : t(language, "board.mealAdded"));
      await loadAll();
    } catch (err) {
      toast.showError(err instanceof Error ? err.message : t(language, "board.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function deleteMeal(mealId: number) {
    setSaving(true);
    try {
      await api(`/api/meals/${mealId}`, { method: "DELETE" });
      setEditing(null);
      toast.showSuccess(t(language, "board.mealDeleted"));
      await loadAll();
    } catch (err) {
      toast.showError(err instanceof Error ? err.message : t(language, "board.deleteFailed"));
    } finally {
      setSaving(false);
    }
  }

  const visibleDays = days.length > 0 ? days : [{ date: todayIsoDate(), meals: [] }];

  if (locked) {
    return (
      <main className="center-shell">
        <div className="corner-actions">
          <LanguageToggle language={language} onToggle={onToggleLanguage} />
          <ThemeToggle theme={theme} onToggle={onToggleTheme} language={language} />
        </div>
        <form className="panel" onSubmit={unlock}>
          <h1>{t(language, "board.unlockTitle")}</h1>
          <span className="slug-pill">/{slug}</span>
          <input
            className="field"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t(language, "board.password")}
            required
            autoFocus
          />
          {error ? <p className="error-text">{error}</p> : null}
          <button className="btn" disabled={saving} type="submit">
            {saving ? t(language, "board.unlocking") : t(language, "board.unlock")}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="board-page">
      <Topbar
        left={
          <div className="board-identity">
            <span className="topbar-title">{board?.name || slug}</span>
            <span className="slug-pill">/{slug}</span>
          </div>
        }
        right={
          <>
            <LanguageToggle language={language} onToggle={onToggleLanguage} />
            <ThemeToggle theme={theme} onToggle={onToggleTheme} language={language} />
          </>
        }
      />

      <div className="day-rail-wrap">
        <div
          className={`edge-mask left ${edgeLeft ? "visible" : ""}`}
          aria-hidden
        />
        <div
          className={`edge-mask right ${edgeRight ? "visible" : ""}`}
          aria-hidden
        />
        <section className="day-rail" ref={railRef}>
          {visibleDays.map((day) => (
            <DayColumn
              key={day.date}
              day={day}
              language={language}
              onOpenMeal={(meal) => setEditing(meal)}
              onAdd={(date) => setCreateDate(date)}
            />
          ))}
        </section>
      </div>

      <footer className="board-foot">
        {visibleDays.length > 1 ? (
          <nav className="day-pagination" aria-label={t(language, "board.dayNav")}>
            {visibleDays.map((day, i) => (
              <button
                key={day.date}
                type="button"
                className={`day-dot ${i === currentIndex ? "active" : ""}`}
                onClick={() => scrollToDay(i)}
              aria-label={t(language, "board.dayLabel", { n: i + 1 })}
                aria-current={i === currentIndex ? "true" : undefined}
              />
            ))}
          </nav>
        ) : null}
        <p className="board-attribution">{t(language, "board.by")}</p>
      </footer>

      {(editing || createDate) && (
        <MealModal
          key={editing?.id || createDate || "new"}
          meal={editing}
          date={createDate || editing?.meal_date || ""}
          people={people}
          language={language}
          defaultMealType={defaultMealTypeForDate(createDate, visibleDays)}
          saving={saving}
          onClose={() => {
            setEditing(null);
            setCreateDate(null);
          }}
          onDelete={(id) => deleteMeal(id)}
          onSave={saveMeal}
        />
      )}
    </main>
  );
}
