import { getBoardAdminRow, requireBoardAdminAccess } from "../../../../../../lib/board-admin";

type MoveBody = { direction?: "up" | "down" };
type Row = { id: number; board_id: number; position: number };

export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  const slug = String(params.slug || "");
  const personId = Number(params.id);
  if (!slug) return Response.json({ ok: false, error: "INVALID_SLUG" }, { status: 400 });
  if (!Number.isInteger(personId) || personId <= 0) {
    return Response.json({ ok: false, error: "INVALID_PERSON_ID" }, { status: 400 });
  }

  const board = await getBoardAdminRow(env.DB, slug);
  if (!board) return Response.json({ ok: false, error: "BOARD_NOT_FOUND" }, { status: 404 });
  if (!(await requireBoardAdminAccess(request, env, board))) {
    return Response.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as MoveBody;
  const direction = body.direction;
  if (direction !== "up" && direction !== "down") {
    return Response.json({ ok: false, error: "INVALID_DIRECTION" }, { status: 400 });
  }

  const me = await env.DB.prepare(
    "SELECT id, board_id, position FROM people WHERE id = ? AND board_id = ? LIMIT 1"
  )
    .bind(personId, board.id)
    .first<Row>();
  if (!me) return Response.json({ ok: false, error: "PERSON_NOT_FOUND" }, { status: 404 });

  const cmp = direction === "up" ? "<" : ">";
  const order = direction === "up" ? "DESC" : "ASC";
  const neighbor = await env.DB.prepare(
    `SELECT id, board_id, position FROM people
     WHERE board_id = ? AND position ${cmp} ?
     ORDER BY position ${order}, id ${order}
     LIMIT 1`
  )
    .bind(board.id, me.position)
    .first<Row>();
  if (!neighbor) return Response.json({ ok: true });

  await env.DB.batch([
    env.DB.prepare("UPDATE people SET position = ? WHERE id = ?").bind(neighbor.position, me.id),
    env.DB.prepare("UPDATE people SET position = ? WHERE id = ?").bind(me.position, neighbor.id)
  ]);
  return Response.json({ ok: true });
};
