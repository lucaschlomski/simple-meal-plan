import { getMealById } from "../../../lib/board";
import { requireBoardSession } from "../../../lib/guards";

type AddAttendeeBody = {
  personId?: number;
};

async function resolveBoardSlug(db: D1Database, boardId: number): Promise<string | null> {
  const row = await db.prepare("SELECT slug FROM boards WHERE id = ? LIMIT 1").bind(boardId).first<{ slug: string }>();
  return row?.slug ?? null;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  const mealId = Number(params.id);
  if (!Number.isInteger(mealId) || mealId <= 0) {
    return Response.json({ ok: false, error: "INVALID_MEAL_ID" }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as AddAttendeeBody;
  const personId = Number(body.personId);
  if (!Number.isInteger(personId) || personId <= 0) {
    return Response.json({ ok: false, error: "INVALID_PERSON_ID" }, { status: 400 });
  }

  const meal = await getMealById(env.DB, mealId);
  if (!meal) return Response.json({ ok: false, error: "MEAL_NOT_FOUND" }, { status: 404 });

  const boardSlug = await resolveBoardSlug(env.DB, meal.board_id);
  if (!boardSlug) return Response.json({ ok: false, error: "BOARD_NOT_FOUND" }, { status: 404 });

  if (!(await requireBoardSession(request, env, boardSlug))) {
    return Response.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const person = await env.DB.prepare("SELECT id, board_id, active FROM people WHERE id = ? LIMIT 1").bind(personId).first<{
    id: number;
    board_id: number;
    active: number;
  }>();
  if (!person) return Response.json({ ok: false, error: "PERSON_NOT_FOUND" }, { status: 404 });
  if (person.board_id !== meal.board_id) {
    return Response.json({ ok: false, error: "PERSON_MEAL_BOARD_MISMATCH" }, { status: 400 });
  }
  if (person.active !== 1) {
    return Response.json({ ok: false, error: "PERSON_INACTIVE" }, { status: 400 });
  }

  await env.DB.prepare("INSERT OR IGNORE INTO meal_attendees (meal_id, person_id) VALUES (?, ?)").bind(mealId, personId).run();
  return Response.json({ ok: true });
};
