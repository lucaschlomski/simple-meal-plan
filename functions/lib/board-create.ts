import { sha256Hex } from "./crypto";
import { createThreeWordSlug, isReservedSlug } from "./slug";

export type CreatedBoard = {
  id: number;
  slug: string;
  name: string;
  created_at: string;
  updated_at: string;
  last_accessed_at: string | null;
  board_admin_enabled: number;
};

export async function createUniqueSlug(db: D1Database): Promise<string> {
  for (let i = 0; i < 20; i += 1) {
    const slug = createThreeWordSlug();
    if (isReservedSlug(slug)) continue;
    const existing = await db.prepare("SELECT id FROM boards WHERE slug = ? LIMIT 1").bind(slug).first();
    if (!existing) return slug;
  }
  throw new Error("slug_generation_failed");
}

export async function createBoard(db: D1Database, name: string, password: string | null): Promise<CreatedBoard | null> {
  const slug = await createUniqueSlug(db);
  const boardPasswordHash = password === null ? null : await sha256Hex(password);
  return db.prepare(
    `INSERT INTO boards (slug, name, board_password_hash)
     VALUES (?, ?, ?)
     RETURNING id, slug, name, created_at, updated_at, last_accessed_at,
       CASE WHEN board_admin_password_hash IS NULL THEN 0 ELSE 1 END AS board_admin_enabled`
  )
    .bind(slug, name, boardPasswordHash)
    .first<CreatedBoard>();
}
