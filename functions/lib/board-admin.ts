import { constantTimeEqual, sha256Hex } from "./crypto";
import { createCookie } from "./cookies";
import { requireBoardAdminSession } from "./guards";
import { createSessionToken, getBoardAdminCookieName } from "./session";

export type BoardAdminRow = {
  id: number;
  slug: string;
  name: string;
  board_password_hash: string | null;
  board_admin_password_hash: string | null;
  created_at: string;
  updated_at: string;
  last_accessed_at: string | null;
};

export const DEMO_BOARD_SLUG = "demo-meal-planner";

export function isDemoBoardSlug(slug: string): boolean {
  return slug === DEMO_BOARD_SLUG;
}

export async function getBoardAdminRow(db: D1Database, slug: string): Promise<BoardAdminRow | null> {
  return db.prepare(
    `SELECT id, slug, name, board_password_hash, board_admin_password_hash,
      created_at, updated_at, last_accessed_at
     FROM boards WHERE slug = ? LIMIT 1`
  )
    .bind(slug)
    .first<BoardAdminRow>();
}

export async function requireBoardAdminAccess(
  request: Request,
  env: Env,
  board: BoardAdminRow
): Promise<boolean> {
  if (isDemoBoardSlug(board.slug)) return true;
  const publicBoard = board.board_password_hash === null;
  return requireBoardAdminSession(
    request,
    env,
    board.slug,
    board.board_admin_password_hash !== null,
    !publicBoard
  );
}

export async function matchesBoardAdminPassword(board: BoardAdminRow, password: string): Promise<boolean> {
  const hash = await sha256Hex(password);
  const expected = board.board_admin_password_hash ?? board.board_password_hash;
  if (!expected) return false;
  return constantTimeEqual(hash, expected);
}

export async function createBoardAdminCookie(request: Request, env: Env, board: BoardAdminRow): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 14;
  const token = await createSessionToken(env.SESSION_SIGNING_KEY, {
    kind: "boardAdmin",
    boardId: board.id,
    slug: board.slug,
    exp
  });
  return createCookie(getBoardAdminCookieName(board.slug), token, 14, new URL(request.url).protocol === "https:");
}

export function publicBoardAdmin(board: BoardAdminRow) {
  return {
    id: board.id,
    slug: board.slug,
    name: board.name,
    created_at: board.created_at,
    updated_at: board.updated_at,
    last_accessed_at: board.last_accessed_at,
    board_admin_enabled: board.board_admin_password_hash !== null,
    is_demo: isDemoBoardSlug(board.slug)
  };
}
