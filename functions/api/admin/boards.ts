import { requireAdminSession } from "../../lib/guards";
import { createBoard } from "../../lib/board-create";

type CreateBoardBody = {
  name?: string;
  password?: string;
};

type BoardRow = {
  id: number;
  slug: string;
  name: string;
  created_at: string;
  updated_at: string;
  last_accessed_at: string | null;
  board_admin_enabled: number;
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!(await requireAdminSession(request, env))) {
    return Response.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { results } = await env.DB.prepare(
    `SELECT id, slug, name, created_at, updated_at, last_accessed_at,
      CASE WHEN board_admin_password_hash IS NULL THEN 0 ELSE 1 END AS board_admin_enabled
     FROM boards ORDER BY created_at DESC`
  ).all<BoardRow>();

  return Response.json({ ok: true, boards: results ?? [] });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!(await requireAdminSession(request, env))) {
    return Response.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as CreateBoardBody;
  const name = (body.name || "").trim();
  const password = body.password || "";

  if (!name) {
    return Response.json({ ok: false, error: "NAME_REQUIRED" }, { status: 400 });
  }
  if (!password) {
    return Response.json({ ok: false, error: "PASSWORD_REQUIRED" }, { status: 400 });
  }

  const created = await createBoard(env.DB, name, password);

  return Response.json({ ok: true, board: created }, { status: 201 });
};
