import { requireAdminSession } from "../../../lib/guards";

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
