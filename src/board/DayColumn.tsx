import { Plus } from "lucide-react";
import type { Day, LanguageMode, Meal } from "../lib/types";
import { fmtWeekday, fmtDate, isToday, relativeDayLabel } from "../lib/dates";
import { t } from "../lib/i18n";
import { MealCard } from "./MealCard";

export function DayColumn({
  day,
  language,
  onOpenMeal,
  onAdd
}: {
  day: Day;
  language: LanguageMode;
  onOpenMeal: (meal: Meal) => void;
  onAdd: (date: string) => void;
}) {
  const today = isToday(day.date);
  const rel = relativeDayLabel(day.date, language);

  return (
    <article className="day-column">
      <div className="day-title">
        <div className="day-title-row">
          <strong>{fmtWeekday(day.date, language)}</strong>
          {today ? <span className="today-pill">{t(language, "board.today")}</span> : null}
        </div>
        <small>{fmtDate(day.date, language)}</small>
        {rel ? <span className="relative-label">{rel}</span> : null}
      </div>
      <div className="meal-list">
        {day.meals.map((meal) => (
          <MealCard key={meal.id} meal={meal} language={language} onOpen={onOpenMeal} />
        ))}
        <button
          className="add-card"
          type="button"
          onClick={() => onAdd(day.date)}
        >
          <Plus size={16} /> {t(language, "board.addMeal")}
        </button>
      </div>
    </article>
  );
}
