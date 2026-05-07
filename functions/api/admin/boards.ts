import { requireAdminSession } from "../../lib/guards";
import { sha256Hex } from "../../lib/crypto";
import { createThreeWordSlug, isReservedSlug } from "../../lib/slug";

type CreateBoardBody = {
  name?: string;
  password?: string;
};

type BoardRow = {
  id: number;
  slug: string;
  name: string;
  created_at: string;
  updated_at: string;
};

async function createUniqueSlug(db: D1Database): Promise<string> {
  for (let i = 0; i < 20; i += 1) {
    const slug = createThreeWordSlug();
    if (isReservedSlug(slug)) continue;
    const existing = await db.prepare("SELECT id FROM boards WHERE slug = ? LIMIT 1").bind(slug).first();
    if (!existing) return slug;
  }
  throw new Error("slug_generation_failed");
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!(await requireAdminSession(request, env))) {
    return Response.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { results } = await env.DB.prepare(
    "SELECT id, slug, name, created_at, updated_at FROM boards ORDER BY created_at DESC"
  ).all<BoardRow>();

  return Response.json({ ok: true, boards: results ?? [] });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!(await requireAdminSession(request, env))) {
    return Response.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as CreateBoardBody;
  const name = (body.name || "").trim();
  const password = body.password || "";

  if (!name) {
    return Response.json({ ok: false, error: "NAME_REQUIRED" }, { status: 400 });
  }
  if (!password) {
    return Response.json({ ok: false, error: "PASSWORD_REQUIRED" }, { status: 400 });
  }

  const slug = await createUniqueSlug(env.DB);
  const boardPasswordHash = await sha256Hex(password);

  const created = await env.DB.prepare(
    "INSERT INTO boards (slug, name, board_password_hash) VALUES (?, ?, ?) RETURNING id, slug, name, created_at, updated_at"
  )
    .bind(slug, name, boardPasswordHash)
    .first<BoardRow>();

  return Response.json({ ok: true, board: created }, { status: 201 });
};
