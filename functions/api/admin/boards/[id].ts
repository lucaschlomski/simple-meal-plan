import { requireAdminSession } from "../../../lib/guards";
import { sha256Hex } from "../../../lib/crypto";

type UpdateBoardBody = {
  name?: string;
  password?: string;
};

type BoardRow = {
  id: number;
  slug: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  if (!(await requireAdminSession(request, env))) {
    return Response.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const boardId = Number(params.id);
  if (!Number.isInteger(boardId) || boardId <= 0) {
    return Response.json({ ok: false, error: "INVALID_BOARD_ID" }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as UpdateBoardBody;
  const name = typeof body.name === "string" ? body.name.trim() : undefined;
  const password = typeof body.password === "string" ? body.password : undefined;

  const current = await env.DB.prepare("SELECT id FROM boards WHERE id = ? LIMIT 1").bind(boardId).first();
  if (!current) {
    return Response.json({ ok: false, error: "BOARD_NOT_FOUND" }, { status: 404 });
  }

  if (name !== undefined && !name) {
    return Response.json({ ok: false, error: "NAME_REQUIRED" }, { status: 400 });
  }

  if (name !== undefined) {
    await env.DB.prepare("UPDATE boards SET name = ? WHERE id = ?").bind(name, boardId).run();
  }

  if (password !== undefined) {
    if (!password) {
      return Response.json({ ok: false, error: "PASSWORD_REQUIRED" }, { status: 400 });
    }
    const hash = await sha256Hex(password);
    await env.DB.prepare("UPDATE boards SET board_password_hash = ? WHERE id = ?").bind(hash, boardId).run();
  }

  const updated = await env.DB.prepare(
    "SELECT id, slug, name, created_at, updated_at FROM boards WHERE id = ? LIMIT 1"
  )
    .bind(boardId)
    .first<BoardRow>();

  return Response.json({ ok: true, board: updated });
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  if (!(await requireAdminSession(request, env))) {
    return Response.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const boardId = Number(params.id);
  if (!Number.isInteger(boardId) || boardId <= 0) {
    return Response.json({ ok: false, error: "INVALID_BOARD_ID" }, { status: 400 });
  }

  const current = await env.DB.prepare("SELECT id FROM boards WHERE id = ? LIMIT 1").bind(boardId).first();
  if (!current) {
    return Response.json({ ok: false, error: "BOARD_NOT_FOUND" }, { status: 404 });
  }

  await env.DB.prepare("DELETE FROM boards WHERE id = ?").bind(boardId).run();
  return Response.json({ ok: true });
};
