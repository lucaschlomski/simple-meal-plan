import { constantTimeEqual, sha256Hex } from "../../../lib/crypto";
import { createCookie } from "../../../lib/cookies";
import { createSessionToken, getBoardCookieName } from "../../../lib/session";
import { validateEnv } from "../../../lib/env";

type UnlockBody = {
  password?: string;
};

type BoardRecord = {
  id: number;
  slug: string;
  name: string;
  board_password_hash: string | null;
};

export const onRequestPost: PagesFunction<Env> = async ({ params, request, env }) => {
  const envErr = validateEnv(env);
  if (envErr) return Response.json({ ok: false, error: envErr }, { status: 500 });
  const slug = String(params.slug || "");
  if (!slug) {
    return Response.json({ ok: false, error: "INVALID_SLUG" }, { status: 400 });
  }

  const board = await env.DB.prepare(
    "SELECT id, slug, name, board_password_hash FROM boards WHERE slug = ? LIMIT 1"
  )
    .bind(slug)
    .first<BoardRecord>();

  if (!board) {
    return Response.json({ ok: false, error: "BOARD_NOT_FOUND" }, { status: 404 });
  }

  if (board.board_password_hash === null) {
    return Response.json({ ok: true, board: { slug: board.slug, name: board.name }, public: true });
  }

  const body = (await request.json().catch(() => ({}))) as UnlockBody;
  if (typeof body.password !== "string") {
    return Response.json({ ok: false, error: "PASSWORD_REQUIRED" }, { status: 400 });
  }

  const computedHash = await sha256Hex(body.password);
  if (!constantTimeEqual(computedHash, board.board_password_hash)) {
    return Response.json({ ok: false, error: "INVALID_CREDENTIALS" }, { status: 401 });
  }

  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 14;
  const token = await createSessionToken(env.SESSION_SIGNING_KEY, {
    kind: "board",
    boardId: board.id,
    slug: board.slug,
    exp
  });
  const cookie = createCookie(getBoardCookieName(slug), token, 14, new URL(request.url).protocol === "https:");

  return new Response(JSON.stringify({ ok: true, board: { slug: board.slug, name: board.name } }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "set-cookie": cookie
    }
  });
};
