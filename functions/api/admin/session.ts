import { requireAdminSession } from "../../lib/guards";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const authenticated = await requireAdminSession(request, env);
  if (!authenticated) {
    return Response.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  return Response.json({ ok: true });
};
