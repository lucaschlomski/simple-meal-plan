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

  const rows = await env.DB.prepare(
    "SELECT id, board_id, position FROM people WHERE board_id = ? ORDER BY position ASC, id ASC"
  )
    .bind(board.id)
    .all<Row>();
  const ordered = rows.results ?? [];
  const currentIndex = ordered.findIndex((row) => row.id === me.id);
  if (currentIndex === -1) return Response.json({ ok: false, error: "PERSON_NOT_FOUND" }, { status: 404 });
  const neighborIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  const neighbor = ordered[neighborIndex];
  if (!neighbor) return Response.json({ ok: true });

  const reordered = [...ordered];
  const [current] = reordered.splice(currentIndex, 1);
  reordered.splice(neighborIndex, 0, current);

  await env.DB.batch(
    reordered.map((row, index) =>
      env.DB.prepare("UPDATE people SET position = ? WHERE id = ? AND board_id = ?")
        .bind(index + 1, row.id, board.id)
    )
  );
  return Response.json({ ok: true });
};
