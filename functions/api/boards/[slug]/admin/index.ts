import { sha256Hex } from "../../../../lib/crypto";
import { getBoardAdminRow, isDemoBoardSlug, publicBoardAdmin, requireBoardAdminAccess } from "../../../../lib/board-admin";

type UpdateBody = {
  name?: string;
  password?: string;
  admin_password?: string | null;
};

export const onRequestGet: PagesFunction<Env> = async ({ params, request, env }) => {
  const slug = String(params.slug || "");
  if (!slug) return Response.json({ ok: false, error: "INVALID_SLUG" }, { status: 400 });
  const board = await getBoardAdminRow(env.DB, slug);
  if (!board) return Response.json({ ok: false, error: "BOARD_NOT_FOUND" }, { status: 404 });
  if (!(await requireBoardAdminAccess(request, env, board))) {
    return Response.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }
  return Response.json({ ok: true, board: publicBoardAdmin(board) });
};

export const onRequestPut: PagesFunction<Env> = async ({ params, request, env }) => {
  const slug = String(params.slug || "");
  if (!slug) return Response.json({ ok: false, error: "INVALID_SLUG" }, { status: 400 });
  const board = await getBoardAdminRow(env.DB, slug);
  if (!board) return Response.json({ ok: false, error: "BOARD_NOT_FOUND" }, { status: 404 });
  if (!(await requireBoardAdminAccess(request, env, board))) {
    return Response.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as UpdateBody;
  const name = typeof body.name === "string" ? body.name.trim() : undefined;
  const password = typeof body.password === "string" ? body.password : undefined;
  const adminPassword = body.admin_password;
  const isDemoBoard = isDemoBoardSlug(board.slug);

  if (name !== undefined && !name) return Response.json({ ok: false, error: "NAME_REQUIRED" }, { status: 400 });
  if (password !== undefined && !password) return Response.json({ ok: false, error: "PASSWORD_REQUIRED" }, { status: 400 });
  if (adminPassword !== undefined && adminPassword !== null && !adminPassword) {
    return Response.json({ ok: false, error: "ADMIN_PASSWORD_REQUIRED" }, { status: 400 });
  }
  if (isDemoBoard && (name !== undefined || password !== undefined || adminPassword !== undefined)) {
    return Response.json({ ok: false, error: "DEMO_BOARD_LOCKED_SETTINGS" }, { status: 403 });
  }

  if (name !== undefined) await env.DB.prepare("UPDATE boards SET name = ? WHERE id = ?").bind(name, board.id).run();
  if (password !== undefined) {
    await env.DB.prepare("UPDATE boards SET board_password_hash = ? WHERE id = ?")
      .bind(await sha256Hex(password), board.id)
      .run();
  }
  if (adminPassword !== undefined) {
    await env.DB.prepare("UPDATE boards SET board_admin_password_hash = ? WHERE id = ?")
      .bind(adminPassword === null ? null : await sha256Hex(adminPassword), board.id)
      .run();
  }

  const updated = await getBoardAdminRow(env.DB, slug);
  return Response.json({ ok: true, board: updated ? publicBoardAdmin(updated) : null });
};

export const onRequestDelete: PagesFunction<Env> = async ({ params, request, env }) => {
  const slug = String(params.slug || "");
  if (!slug) return Response.json({ ok: false, error: "INVALID_SLUG" }, { status: 400 });
  const board = await getBoardAdminRow(env.DB, slug);
  if (!board) return Response.json({ ok: false, error: "BOARD_NOT_FOUND" }, { status: 404 });
  if (!(await requireBoardAdminAccess(request, env, board))) {
    return Response.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }
  if (isDemoBoardSlug(board.slug)) {
    return Response.json({ ok: false, error: "DEMO_BOARD_IMMUTABLE" }, { status: 403 });
  }
  await env.DB.prepare("DELETE FROM boards WHERE id = ?").bind(board.id).run();
  return Response.json({ ok: true });
};
