import { getMealById } from "../../lib/board";
import { requireBoardAccess } from "../../lib/guards";

type UpdateMealBody = {
  meal_date?: string;
  meal_type?: "breakfast" | "lunch" | "dinner" | "other";
  meal_name?: string | null;
  cooks_text?: string | null;
  notes?: string | null;
};

const validTypes = new Set(["breakfast", "lunch", "dinner", "other"]);

async function resolveBoardSlug(db: D1Database, boardId: number): Promise<string | null> {
  const row = await db.prepare("SELECT slug FROM boards WHERE id = ? LIMIT 1").bind(boardId).first<{ slug: string }>();
  return row?.slug ?? null;
}

export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  const mealId = Number(params.id);
  if (!Number.isInteger(mealId) || mealId <= 0) {
    return Response.json({ ok: false, error: "INVALID_MEAL_ID" }, { status: 400 });
  }

  const meal = await getMealById(env.DB, mealId);
  if (!meal) return Response.json({ ok: false, error: "MEAL_NOT_FOUND" }, { status: 404 });

  const boardSlug = await resolveBoardSlug(env.DB, meal.board_id);
  if (!boardSlug) return Response.json({ ok: false, error: "BOARD_NOT_FOUND" }, { status: 404 });

  if (!(await requireBoardAccess(request, env, boardSlug))) {
    return Response.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as UpdateMealBody;
  const hasMealName = Object.prototype.hasOwnProperty.call(body, "meal_name");
  const hasCooksText = Object.prototype.hasOwnProperty.call(body, "cooks_text");
  const hasNotes = Object.prototype.hasOwnProperty.call(body, "notes");

  if (body.meal_date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(String(body.meal_date))) {
    return Response.json({ ok: false, error: "INVALID_MEAL_DATE" }, { status: 400 });
  }
  if (body.meal_type !== undefined && !validTypes.has(body.meal_type)) {
    return Response.json({ ok: false, error: "INVALID_MEAL_TYPE" }, { status: 400 });
  }

  await env.DB.prepare(
    "UPDATE meals SET meal_date = COALESCE(?, meal_date), meal_type = COALESCE(?, meal_type), meal_name = ?, cooks_text = ?, notes = ? WHERE id = ?"
  )
    .bind(
      body.meal_date ?? null,
      body.meal_type ?? null,
      hasMealName ? body.meal_name ?? null : meal.meal_name,
      hasCooksText ? body.cooks_text ?? null : meal.cooks_text,
      hasNotes ? body.notes ?? null : meal.notes,
      mealId
    )
    .run();

  const updated = await getMealById(env.DB, mealId);
  return Response.json({ ok: true, meal: updated });
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  const mealId = Number(params.id);
  if (!Number.isInteger(mealId) || mealId <= 0) {
    return Response.json({ ok: false, error: "INVALID_MEAL_ID" }, { status: 400 });
  }

  const meal = await getMealById(env.DB, mealId);
  if (!meal) return Response.json({ ok: false, error: "MEAL_NOT_FOUND" }, { status: 404 });

  const boardSlug = await resolveBoardSlug(env.DB, meal.board_id);
  if (!boardSlug) return Response.json({ ok: false, error: "BOARD_NOT_FOUND" }, { status: 404 });

  if (!(await requireBoardAccess(request, env, boardSlug))) {
    return Response.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  await env.DB.prepare("DELETE FROM meals WHERE id = ?").bind(mealId).run();
  return Response.json({ ok: true });
};
