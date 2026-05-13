export type BoardRow = {
  id: number;
  slug: string;
  name: string;
};

export type BoardAccessRow = {
  id: number;
  slug: string;
  board_password_hash: string | null;
};

export type MealRow = {
  id: number;
  board_id: number;
  meal_date: string;
  meal_type: string;
  meal_name: string | null;
  cooks_text: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export async function getBoardBySlug(db: D1Database, slug: string): Promise<BoardRow | null> {
  return db
    .prepare("SELECT id, slug, name FROM boards WHERE slug = ? LIMIT 1")
    .bind(slug)
    .first<BoardRow>();
}

export async function getBoardAccessBySlug(db: D1Database, slug: string): Promise<BoardAccessRow | null> {
  return db
    .prepare("SELECT id, slug, board_password_hash FROM boards WHERE slug = ? LIMIT 1")
    .bind(slug)
    .first<BoardAccessRow>();
}

export async function getMealById(db: D1Database, mealId: number): Promise<MealRow | null> {
  return db
    .prepare(
      "SELECT id, board_id, meal_date, meal_type, meal_name, cooks_text, notes, created_at, updated_at FROM meals WHERE id = ? LIMIT 1"
    )
    .bind(mealId)
    .first<MealRow>();
}
