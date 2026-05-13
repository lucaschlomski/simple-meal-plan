import { getBoardAccessBySlug } from "../../../lib/board";
import { requireBoardSession } from "../../../lib/guards";

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const slug = String(params.slug || "");
  if (!slug) {
    return Response.json({ ok: false, error: "INVALID_SLUG" }, { status: 400 });
  }

  const board = await getBoardAccessBySlug(env.DB, slug);
  if (!board) {
    return Response.json({ ok: false, error: "BOARD_NOT_FOUND" }, { status: 404 });
  }

  if (board.board_password_hash === null) {
    return Response.json({ ok: true, public: true });
  }

  const authenticated = await requireBoardSession(request, env, slug);
  if (!authenticated) {
    return Response.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  return Response.json({ ok: true, public: false });
};
