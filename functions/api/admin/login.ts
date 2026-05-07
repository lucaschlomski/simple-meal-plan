import { constantTimeEqual } from "../../lib/crypto";
import { createCookie } from "../../lib/cookies";
import { createSessionToken, getAdminCookieName } from "../../lib/session";
import { validateEnv } from "../../lib/env";

type LoginBody = {
  password?: string;
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const envErr = validateEnv(env);
  if (envErr) return Response.json({ ok: false, error: envErr }, { status: 500 });
  const body = (await request.json().catch(() => ({}))) as LoginBody;
  const valid = typeof body.password === "string" && constantTimeEqual(body.password, env.ADMIN_PASSWORD);

  if (!valid) {
    return Response.json({ ok: false, error: "INVALID_CREDENTIALS" }, { status: 401 });
  }

  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7;
  const token = await createSessionToken(env.SESSION_SIGNING_KEY, { kind: "admin", exp });
  const secure = new URL(request.url).protocol === "https:";
  const cookie = createCookie(getAdminCookieName(), token, 7, secure);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "set-cookie": cookie
    }
  });
};
