import { requireAdminSession } from "../../../lib/guards";

type UpdatePersonBody = {
  display_name?: string;
  group_size?: number;
  active?: boolean;
};

type PersonRow = {
  id: number;
  board_id: number;
  display_name: string;
  group_size: number;
  active: number;
  created_at: string;
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  if (!(await requireAdminSession(request, env))) {
    return Response.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const personId = Number(params.id);
  if (!Number.isInteger(personId) || personId <= 0) {
    return Response.json({ ok: false, error: "INVALID_PERSON_ID" }, { status: 400 });
  }

  const current = await env.DB.prepare(
    "SELECT id, board_id, display_name, group_size, active, created_at FROM people WHERE id = ? LIMIT 1"
  )
    .bind(personId)
    .first<PersonRow>();

  if (!current) {
    return Response.json({ ok: false, error: "PERSON_NOT_FOUND" }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as UpdatePersonBody;
  const displayName = typeof body.display_name === "string" ? body.display_name.trim() : undefined;
  const groupSize = body.group_size === undefined ? undefined : Number(body.group_size);
  const active = body.active === undefined ? undefined : body.active ? 1 : 0;

  if (displayName !== undefined && !displayName) {
    return Response.json({ ok: false, error: "DISPLAY_NAME_REQUIRED" }, { status: 400 });
  }
  if (groupSize !== undefined && (!Number.isInteger(groupSize) || groupSize < 1)) {
    return Response.json({ ok: false, error: "INVALID_GROUP_SIZE" }, { status: 400 });
  }

  await env.DB.prepare(
    "UPDATE people SET display_name = COALESCE(?, display_name), group_size = COALESCE(?, group_size), active = COALESCE(?, active) WHERE id = ?"
  )
    .bind(displayName ?? null, groupSize ?? null, active ?? null, personId)
    .run();

  const updated = await env.DB.prepare(
    "SELECT id, board_id, display_name, group_size, active, created_at FROM people WHERE id = ? LIMIT 1"
  )
    .bind(personId)
    .first<PersonRow>();

  return Response.json({ ok: true, person: updated });
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  if (!(await requireAdminSession(request, env))) {
    return Response.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const personId = Number(params.id);
  if (!Number.isInteger(personId) || personId <= 0) {
    return Response.json({ ok: false, error: "INVALID_PERSON_ID" }, { status: 400 });
  }

  const result = await env.DB.prepare("DELETE FROM people WHERE id = ?").bind(personId).run();
  if (!result.success || (result.meta.changes ?? 0) === 0) {
    return Response.json({ ok: false, error: "PERSON_NOT_FOUND" }, { status: 404 });
  }

  return Response.json({ ok: true });
};
