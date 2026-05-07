import { requireAdminSession } from "../../../../lib/guards";

type MoveBody = { direction?: "up" | "down" };

type Row = { id: number; board_id: number; position: number };

export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  if (!(await requireAdminSession(request, env))) {
    return Response.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const personId = Number(params.id);
  if (!Number.isInteger(personId) || personId <= 0) {
    return Response.json({ ok: false, error: "INVALID_PERSON_ID" }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as MoveBody;
  const direction = body.direction;
  if (direction !== "up" && direction !== "down") {
    return Response.json({ ok: false, error: "INVALID_DIRECTION" }, { status: 400 });
  }

  const me = await env.DB.prepare(
    "SELECT id, board_id, position FROM people WHERE id = ? LIMIT 1"
  )
    .bind(personId)
    .first<Row>();

  if (!me) {
    return Response.json({ ok: false, error: "PERSON_NOT_FOUND" }, { status: 404 });
  }

  // Pick the immediately adjacent neighbor on the same board. Tie-break on id
  // so the swap is deterministic if two rows share a position.
  const cmp = direction === "up" ? "<" : ">";
  const order = direction === "up" ? "DESC" : "ASC";

  const neighbor = await env.DB.prepare(
    `SELECT id, board_id, position FROM people
     WHERE board_id = ? AND position ${cmp} ?
     ORDER BY position ${order}, id ${order}
     LIMIT 1`
  )
    .bind(me.board_id, me.position)
    .first<Row>();

  if (!neighbor) {
    // Already at the top or bottom — treat as a no-op success.
    return Response.json({ ok: true });
  }

  // Swap the two positions atomically. There's no UNIQUE constraint on
  // (board_id, position) so this needs no intermediate placeholder.
  await env.DB.batch([
    env.DB.prepare("UPDATE people SET position = ? WHERE id = ?").bind(neighbor.position, me.id),
    env.DB.prepare("UPDATE people SET position = ? WHERE id = ?").bind(me.position, neighbor.id)
  ]);

  return Response.json({ ok: true });
};
