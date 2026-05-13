import { getBoardBySlug } from "../../../lib/board";
import { requireBoardAccess } from "../../../lib/guards";

type CreateMealBody = {
  meal_date?: string;
  meal_type?: "breakfast" | "lunch" | "dinner" | "other";
  meal_name?: string | null;
  cooks_text?: string | null;
  notes?: string | null;
};

const validTypes = new Set(["breakfast", "lunch", "dinner", "other"]);

export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  const slug = String(params.slug || "");
  if (!slug) return Response.json({ ok: false, error: "INVALID_SLUG" }, { status: 400 });

  if (!(await requireBoardAccess(request, env, slug))) {
    return Response.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const board = await getBoardBySlug(env.DB, slug);
  if (!board) return Response.json({ ok: false, error: "BOARD_NOT_FOUND" }, { status: 404 });

  const body = (await request.json().catch(() => ({}))) as CreateMealBody;
  const mealDate = String(body.meal_date || "").trim();
  const mealType = (body.meal_type || "other") as string;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(mealDate)) {
    return Response.json({ ok: false, error: "INVALID_MEAL_DATE" }, { status: 400 });
  }
  if (!validTypes.has(mealType)) {
    return Response.json({ ok: false, error: "INVALID_MEAL_TYPE" }, { status: 400 });
  }

  const created = await env.DB.prepare(
    "INSERT INTO meals (board_id, meal_date, meal_type, meal_name, cooks_text, notes) VALUES (?, ?, ?, ?, ?, ?) RETURNING id, board_id, meal_date, meal_type, meal_name, cooks_text, notes, created_at, updated_at"
  )
    .bind(
      board.id,
      mealDate,
      mealType,
      body.meal_name ?? null,
      body.cooks_text ?? null,
      body.notes ?? null
    )
    .first();

  return Response.json({ ok: true, meal: created }, { status: 201 });
};
