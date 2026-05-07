import { getMealById } from "../../../../lib/board";
import { requireBoardSession } from "../../../../lib/guards";

async function resolveBoardSlug(db: D1Database, boardId: number): Promise<string | null> {
  const row = await db.prepare("SELECT slug FROM boards WHERE id = ? LIMIT 1").bind(boardId).first<{ slug: string }>();
  return row?.slug ?? null;
}

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  const mealId = Number(params.id);
  const personId = Number(params.personId);
  if (!Number.isInteger(mealId) || mealId <= 0) {
    return Response.json({ ok: false, error: "INVALID_MEAL_ID" }, { status: 400 });
  }
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

  await env.DB.prepare("DELETE FROM meal_attendees WHERE meal_id = ? AND person_id = ?").bind(mealId, personId).run();
  return Response.json({ ok: true });
};
