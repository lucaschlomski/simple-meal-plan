import { parseCookieHeader } from "./cookies";
import {
  getAdminCookieName,
  getBoardAdminCookieName,
  getBoardCookieName,
  verifySessionToken
} from "./session";

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

export async function requireBoardAdminSession(
  request: Request,
  env: Env,
  slug: string,
  adminPasswordEnabled: boolean
): Promise<boolean> {
  const cookies = parseCookieHeader(request.headers.get("cookie"));
  if (!(await requireBoardSession(request, env, slug))) return false;
  if (!adminPasswordEnabled) return true;

  const token = cookies[getBoardAdminCookieName(slug)];
  if (!token) return false;
  const payload = await verifySessionToken(env.SESSION_SIGNING_KEY, token, "boardAdmin");
  if (!payload) return false;
  return payload.slug === slug;
}
