import { parseCookieHeader } from "./cookies";
import { getAdminCookieName, getBoardCookieName, verifySessionToken } from "./session";

export async function requireAdminSession(request: Request, env: Env): Promise<boolean> {
  const cookies = parseCookieHeader(request.headers.get("cookie"));
  const token = cookies[getAdminCookieName()];
  if (!token) return false;
  const payload = await verifySessionToken(env.SESSION_SIGNING_KEY, token, "admin");
  return payload !== null;
}

export async function requireBoardSession(request: Request, env: Env, slug: string): Promise<boolean> {
  const cookies = parseCookieHeader(request.headers.get("cookie"));
  const token = cookies[getBoardCookieName(slug)];
  if (!token) return false;
  const payload = await verifySessionToken(env.SESSION_SIGNING_KEY, token, "board");
  if (!payload) return false;
  return payload.slug === slug;
}
