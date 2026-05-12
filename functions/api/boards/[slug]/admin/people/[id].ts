import { getBoardAdminRow, requireBoardAdminAccess } from "../../../../../lib/board-admin";

type UpdatePersonBody = {
  display_name?: string;
  group_size?: number;
  active?: boolean;
};

type PersonRow = {
  id: number;
  board_id: number;
  display_name: string;
  group_size: number;
  active: number;
  position: number;
  created_at: string;
};

async function requireBoard(request: Request, env: Env, slug: string) {
  const board = await getBoardAdminRow(env.DB, slug);
  if (!board) return { response: Response.json({ ok: false, error: "BOARD_NOT_FOUND" }, { status: 404 }) };
  if (!(await requireBoardAdminAccess(request, env, board))) {
    return { response: Response.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 }) };
  }
  return { board };
}

export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  const slug = String(params.slug || "");
  const personId = Number(params.id);
  if (!slug) return Response.json({ ok: false, error: "INVALID_SLUG" }, { status: 400 });
  if (!Number.isInteger(personId) || personId <= 0) {
    return Response.json({ ok: false, error: "INVALID_PERSON_ID" }, { status: 400 });
  }
  const result = await requireBoard(request, env, slug);
  if (result.response) return result.response;

  const body = (await request.json().catch(() => ({}))) as UpdatePersonBody;
  const displayName = typeof body.display_name === "string" ? body.display_name.trim() : undefined;
  const groupSize = body.group_size === undefined ? undefined : Number(body.group_size);
  const active = body.active === undefined ? undefined : body.active ? 1 : 0;
  if (displayName !== undefined && !displayName) {
    return Response.json({ ok: false, error: "DISPLAY_NAME_REQUIRED" }, { status: 400 });
  }
  if (groupSize !== undefined && (!Number.isInteger(groupSize) || groupSize < 1)) {
    return Response.json({ ok: false, error: "INVALID_GROUP_SIZE" }, { status: 400 });
  }

  const existing = await env.DB.prepare("SELECT id FROM people WHERE id = ? AND board_id = ? LIMIT 1")
    .bind(personId, result.board.id)
    .first();
  if (!existing) return Response.json({ ok: false, error: "PERSON_NOT_FOUND" }, { status: 404 });

  await env.DB.prepare(
    "UPDATE people SET display_name = COALESCE(?, display_name), group_size = COALESCE(?, group_size), active = COALESCE(?, active) WHERE id = ? AND board_id = ?"
  )
    .bind(displayName ?? null, groupSize ?? null, active ?? null, personId, result.board.id)
    .run();

  const updated = await env.DB.prepare(
    "SELECT id, board_id, display_name, group_size, active, position, created_at FROM people WHERE id = ? LIMIT 1"
  )
    .bind(personId)
    .first<PersonRow>();

  return Response.json({ ok: true, person: updated });
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  const slug = String(params.slug || "");
  const personId = Number(params.id);
  if (!slug) return Response.json({ ok: false, error: "INVALID_SLUG" }, { status: 400 });
  if (!Number.isInteger(personId) || personId <= 0) {
    return Response.json({ ok: false, error: "INVALID_PERSON_ID" }, { status: 400 });
  }
  const result = await requireBoard(request, env, slug);
  if (result.response) return result.response;

  const deleted = await env.DB.prepare("DELETE FROM people WHERE id = ? AND board_id = ?")
    .bind(personId, result.board.id)
    .run();
  if (!deleted.success || (deleted.meta.changes ?? 0) === 0) {
    return Response.json({ ok: false, error: "PERSON_NOT_FOUND" }, { status: 404 });
  }
  return Response.json({ ok: true });
};
