import { requireBoardSession } from "../../../lib/guards";
import { getBoardBySlug } from "../../../lib/board";
import { attendeeWeightedCount, compareMealOrder, expandDateRange } from "../../../lib/board-view";

type MealBoardRow = {
  id: number;
  board_id: number;
  meal_date: string;
  meal_type: "unset" | "breakfast" | "lunch" | "dinner" | "other";
  meal_name: string | null;
  cooks_text: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type AttendeeRow = {
  meal_id: number;
  person_id: number;
  display_name: string;
  group_size: number;
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const slug = String(params.slug || "");
  if (!slug) return Response.json({ ok: false, error: "INVALID_SLUG" }, { status: 400 });

  if (!(await requireBoardSession(request, env, slug))) {
    return Response.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const board = await getBoardBySlug(env.DB, slug);
  if (!board) return Response.json({ ok: false, error: "BOARD_NOT_FOUND" }, { status: 404 });

  await env.DB.prepare("UPDATE boards SET last_accessed_at = CURRENT_TIMESTAMP WHERE id = ?")
    .bind(board.id)
    .run();

  const bounds = await env.DB.prepare(
    "SELECT MIN(meal_date) as min_date, MAX(meal_date) as max_date FROM meals WHERE board_id = ?"
  )
    .bind(board.id)
    .first<{ min_date: string | null; max_date: string | null }>();

  if (!bounds || !bounds.min_date || !bounds.max_date) {
    return Response.json({ ok: true, board, days: [] });
  }

  const { results: mealsRaw } = await env.DB.prepare(
    "SELECT id, board_id, meal_date, meal_type, meal_name, cooks_text, notes, created_at, updated_at FROM meals WHERE board_id = ?"
  )
    .bind(board.id)
    .all<MealBoardRow>();
  const meals = (mealsRaw ?? []).sort(compareMealOrder);

  const { results: attendeeRows } = await env.DB.prepare(
    "SELECT ma.meal_id, p.id AS person_id, p.display_name, p.group_size FROM meal_attendees ma JOIN people p ON p.id = ma.person_id WHERE p.board_id = ?"
  )
    .bind(board.id)
    .all<AttendeeRow>();

  const attendeesByMeal = new Map<number, AttendeeRow[]>();
  for (const row of attendeeRows ?? []) {
    const list = attendeesByMeal.get(row.meal_id) ?? [];
    list.push(row);
    attendeesByMeal.set(row.meal_id, list);
  }

  const mealsByDate = new Map<string, Array<MealBoardRow & { attendees: AttendeeRow[]; attendee_count: number }>>();
  for (const meal of meals) {
    const attendees = attendeesByMeal.get(meal.id) ?? [];
    const attendeeCount = attendeeWeightedCount(attendees);
    const withAttendees = { ...meal, attendees, attendee_count: attendeeCount };
    const bucket = mealsByDate.get(meal.meal_date) ?? [];
    bucket.push(withAttendees);
    mealsByDate.set(meal.meal_date, bucket);
  }

  const allDates = expandDateRange(bounds.min_date, bounds.max_date);
  const days = allDates.map((date) => ({
    date,
    meals: mealsByDate.get(date) ?? []
  }));

  return Response.json({ ok: true, board, days });
};
