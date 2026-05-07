export type MealType = "unset" | "breakfast" | "lunch" | "dinner" | "other";

export const mealTypeOrder: Record<MealType, number> = {
  unset: 4,
  breakfast: 1,
  lunch: 2,
  dinner: 3,
  other: 4
};

export function compareMealOrder(
  a: { meal_date: string; meal_type: MealType; id: number },
  b: { meal_date: string; meal_type: MealType; id: number }
): number {
  if (a.meal_date < b.meal_date) return -1;
  if (a.meal_date > b.meal_date) return 1;
  if (mealTypeOrder[a.meal_type] !== mealTypeOrder[b.meal_type]) {
    return mealTypeOrder[a.meal_type] - mealTypeOrder[b.meal_type];
  }
  return a.id - b.id;
}

export function toIsoDate(d: Date): string {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function expandDateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const current = new Date(`${start}T00:00:00.000Z`);
  const endDate = new Date(`${end}T00:00:00.000Z`);

  while (current <= endDate) {
    dates.push(toIsoDate(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

export function attendeeWeightedCount(attendees: Array<{ group_size: number }>): number {
  return attendees.reduce((sum, attendee) => sum + attendee.group_size, 0);
}
