export type MealType = "breakfast" | "lunch" | "dinner" | "other";
export type StoredMealType = MealType | "unset";

export type Board = { id: number; slug: string; name: string };
export type Person = {
  id: number;
  display_name: string;
  group_size: number;
  position: number;
};
export type MealAttendee = {
  person_id: number;
  display_name: string;
  group_size: number;
};
export type Meal = {
  id: number;
  meal_date: string;
  meal_type: StoredMealType | null;
  meal_name: string | null;
  cooks_text: string | null;
  notes: string | null;
  attendees: MealAttendee[];
  attendee_count: number;
};
export type Day = { date: string; meals: Meal[] };
export type ThemeMode = "light" | "dark";
export type LanguageMode = "en" | "de";

export type AdminBoard = {
  id: number;
  slug: string;
  name: string;
  created_at: string;
  updated_at: string;
  last_accessed_at: string | null;
  board_admin_enabled: boolean | number;
};

export const MEAL_TYPES: MealType[] = [
  "breakfast",
  "lunch",
  "dinner",
  "other"
];
