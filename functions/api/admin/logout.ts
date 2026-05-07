import { clearCookie } from "../../lib/cookies";
import { getAdminCookieName } from "../../lib/session";

export const onRequestPost: PagesFunction<Env> = async ({ request }) => {
  const secure = new URL(request.url).protocol === "https:";
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "set-cookie": clearCookie(getAdminCookieName(), secure)
    }
  });
};
