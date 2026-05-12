import { getBoardAdminRow, publicBoardAdmin, requireBoardAdminAccess } from "../../../../lib/board-admin";

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
