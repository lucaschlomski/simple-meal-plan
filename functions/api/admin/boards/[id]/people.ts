import { requireAdminSession } from "../../../../lib/guards";

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

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  if (!(await requireAdminSession(request, env))) {
    return Response.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const boardId = Number(params.id);
  if (!Number.isInteger(boardId) || boardId <= 0) {
    return Response.json({ ok: false, error: "INVALID_BOARD_ID" }, { status: 400 });
  }

  const board = await env.DB.prepare("SELECT id FROM boards WHERE id = ? LIMIT 1").bind(boardId).first();
  if (!board) {
    return Response.json({ ok: false, error: "BOARD_NOT_FOUND" }, { status: 404 });
  }

  const { results } = await env.DB.prepare(
    "SELECT id, board_id, display_name, group_size, active, position, created_at FROM people WHERE board_id = ? ORDER BY active DESC, position ASC, id ASC"
  )
    .bind(boardId)
    .all<PersonRow>();

  return Response.json({ ok: true, people: results ?? [] });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  if (!(await requireAdminSession(request, env))) {
    return Response.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const boardId = Number(params.id);
  if (!Number.isInteger(boardId) || boardId <= 0) {
    return Response.json({ ok: false, error: "INVALID_BOARD_ID" }, { status: 400 });
  }

  const board = await env.DB.prepare("SELECT id FROM boards WHERE id = ? LIMIT 1").bind(boardId).first();
  if (!board) {
    return Response.json({ ok: false, error: "BOARD_NOT_FOUND" }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as CreatePersonBody;
  const displayName = (body.display_name || "").trim();
  const groupSize = body.group_size === undefined ? 1 : Number(body.group_size);
  const active = body.active === undefined ? 1 : body.active ? 1 : 0;

  if (!displayName) {
    return Response.json({ ok: false, error: "DISPLAY_NAME_REQUIRED" }, { status: 400 });
  }
  if (!Number.isInteger(groupSize) || groupSize < 1) {
    return Response.json({ ok: false, error: "INVALID_GROUP_SIZE" }, { status: 400 });
  }

  // New people append to the end of the board's list. COALESCE handles the
  // first row on a board (no existing rows -> MAX returns NULL).
  const created = await env.DB.prepare(
    `INSERT INTO people (board_id, display_name, group_size, active, position)
     VALUES (?, ?, ?, ?,
       (SELECT COALESCE(MAX(position), 0) + 1 FROM people WHERE board_id = ?))
     RETURNING id, board_id, display_name, group_size, active, position, created_at`
  )
    .bind(boardId, displayName, groupSize, active, boardId)
    .first<PersonRow>();

  return Response.json({ ok: true, person: created }, { status: 201 });
};
