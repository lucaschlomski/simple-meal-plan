import { getBoardBySlug } from "../../../lib/board";
import { requireBoardSession } from "../../../lib/guards";

type PersonRow = {
  id: number;
  board_id: number;
  display_name: string;
  group_size: number;
  active: number;
  position: number;
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const slug = String(params.slug || "");
  if (!slug) return Response.json({ ok: false, error: "INVALID_SLUG" }, { status: 400 });

  if (!(await requireBoardSession(request, env, slug))) {
    return Response.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const board = await getBoardBySlug(env.DB, slug);
  if (!board) return Response.json({ ok: false, error: "BOARD_NOT_FOUND" }, { status: 404 });

  const { results } = await env.DB.prepare(
    "SELECT id, board_id, display_name, group_size, active, position FROM people WHERE board_id = ? AND active = 1 ORDER BY position ASC, id ASC"
  )
    .bind(board.id)
    .all<PersonRow>();

  return Response.json({ ok: true, people: results ?? [] });
};
