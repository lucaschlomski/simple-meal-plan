import { KeyboardEvent } from "react";
import { ChefHat, Users } from "lucide-react";
import type { LanguageMode, Meal, MealType, StoredMealType } from "../lib/types";
import { mealTypeLabel, t } from "../lib/i18n";

const MAX_CHIPS = 20;

function visibleMealType(type: StoredMealType | null): MealType {
  return type === "breakfast" || type === "lunch" || type === "dinner" ? type : "other";
}

export function MealCard({
  meal,
  language,
  onOpen
}: {
  meal: Meal;
  language: LanguageMode;
  onOpen: (meal: Meal) => void;
}) {
  function onKey(e: KeyboardEvent<HTMLElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen(meal);
    }
  }

  const type = visibleMealType(meal.meal_type);
  const visibleAttendees = meal.attendees.slice(0, MAX_CHIPS);
  const overflow = meal.attendees.length - visibleAttendees.length;

  return (
    <article
      className="meal-card"
      role="button"
      tabIndex={0}
      onClick={() => onOpen(meal)}
      onKeyDown={onKey}
      aria-label={t(language, "meal.editAria", { name: meal.meal_name || t(language, "meal.editFallback") })}
    >
      <div className="card-head">
        <span className={`badge type-${type}`}>
          {mealTypeLabel(language, type)}
        </span>
        {meal.attendee_count > 0 && (
          <span className="count" title={t(language, "meal.totalAttendees")}>
            <Users size={14} />
            {meal.attendee_count}
          </span>
        )}
      </div>
      <div className="card-title">
        <h3 className={meal.meal_name ? "" : "unset"}>
          {meal.meal_name || t(language, "meal.notSet")}
        </h3>
        {meal.cooks_text ? (
          <p className="cook">
            <ChefHat size={14} aria-hidden />
            <span>{meal.cooks_text}</span>
          </p>
        ) : null}
      </div>
      {visibleAttendees.length > 0 ? (
        <div className="chips chips-sm">
          {visibleAttendees.map((a) => (
            <span className="chip" key={`${meal.id}-${a.person_id}`}>
              {a.display_name}
            </span>
          ))}
          {overflow > 0 ? <span className="chip">+{overflow}</span> : null}
        </div>
      ) : null}
    </article>
  );
}
