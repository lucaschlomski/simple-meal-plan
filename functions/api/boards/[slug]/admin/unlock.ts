import {
  createBoardAdminCookie,
  getBoardAdminRow,
  isDemoBoardSlug,
  matchesBoardAdminPassword,
  publicBoardAdmin
} from "../../../../lib/board-admin";
import { validateEnv } from "../../../../lib/env";

type UnlockBody = { password?: string };

export const onRequestPost: PagesFunction<Env> = async ({ params, request, env }) => {
  const envErr = validateEnv(env);
  if (envErr) return Response.json({ ok: false, error: envErr }, { status: 500 });

  const slug = String(params.slug || "");
  if (!slug) return Response.json({ ok: false, error: "INVALID_SLUG" }, { status: 400 });

  const board = await getBoardAdminRow(env.DB, slug);
  if (!board) return Response.json({ ok: false, error: "BOARD_NOT_FOUND" }, { status: 404 });

  if (isDemoBoardSlug(board.slug)) {
    return Response.json({ ok: true, board: publicBoardAdmin(board), demo: true });
  }

  if (board.board_password_hash === null && board.board_admin_password_hash === null) {
    return Response.json({ ok: true, board: publicBoardAdmin(board), public: true });
  }

  const body = (await request.json().catch(() => ({}))) as UnlockBody;
  if (typeof body.password !== "string") {
    return Response.json({ ok: false, error: "PASSWORD_REQUIRED" }, { status: 400 });
  }

  if (!(await matchesBoardAdminPassword(board, body.password))) {
    return Response.json({ ok: false, error: "INVALID_CREDENTIALS" }, { status: 401 });
  }

  const cookie = await createBoardAdminCookie(request, env, board);
  return new Response(JSON.stringify({ ok: true, board: publicBoardAdmin(board) }), {
    status: 200,
    headers: { "content-type": "application/json", "set-cookie": cookie }
  });
};
