import { getBoardAdminRow, requireBoardAdminAccess } from "../../../../lib/board-admin";

type PersonRow = {
  id: number;
  board_id: number;
  display_name: string;
  group_size: number;
  active: number;
  position: number;
  created_at: string;
};

type CreatePersonBody = {
  display_name?: string;
  group_size?: number;
  active?: boolean;
};

async function requireBoard(request: Request, env: Env, slug: string) {
  const board = await getBoardAdminRow(env.DB, slug);
  if (!board) return { response: Response.json({ ok: false, error: "BOARD_NOT_FOUND" }, { status: 404 }) };
  if (!(await requireBoardAdminAccess(request, env, board))) {
    return { response: Response.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 }) };
  }
  return { board };
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const slug = String(params.slug || "");
  if (!slug) return Response.json({ ok: false, error: "INVALID_SLUG" }, { status: 400 });
  const result = await requireBoard(request, env, slug);
  if (result.response) return result.response;

  const { results } = await env.DB.prepare(
    "SELECT id, board_id, display_name, group_size, active, position, created_at FROM people WHERE board_id = ? ORDER BY active DESC, position ASC, id ASC"
  )
    .bind(result.board.id)
    .all<PersonRow>();
  return Response.json({ ok: true, people: results ?? [] });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  const slug = String(params.slug || "");
  if (!slug) return Response.json({ ok: false, error: "INVALID_SLUG" }, { status: 400 });
  const result = await requireBoard(request, env, slug);
  if (result.response) return result.response;

  const body = (await request.json().catch(() => ({}))) as CreatePersonBody;
  const displayName = (body.display_name || "").trim();
  const groupSize = body.group_size === undefined ? 1 : Number(body.group_size);
  const active = body.active === undefined ? 1 : body.active ? 1 : 0;
  if (!displayName) return Response.json({ ok: false, error: "DISPLAY_NAME_REQUIRED" }, { status: 400 });
  if (!Number.isInteger(groupSize) || groupSize < 1) {
    return Response.json({ ok: false, error: "INVALID_GROUP_SIZE" }, { status: 400 });
  }

  const created = await env.DB.prepare(
    `INSERT INTO people (board_id, display_name, group_size, active, position)
     VALUES (?, ?, ?, ?, (SELECT COALESCE(MAX(position), 0) + 1 FROM people WHERE board_id = ?))
     RETURNING id, board_id, display_name, group_size, active, position, created_at`
  )
    .bind(result.board.id, displayName, groupSize, active, result.board.id)
    .first<PersonRow>();

  return Response.json({ ok: true, person: created }, { status: 201 });
};
