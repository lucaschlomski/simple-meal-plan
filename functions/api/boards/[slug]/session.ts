import { requireBoardSession } from "../../../lib/guards";

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const slug = String(params.slug || "");
  if (!slug) {
    return Response.json({ ok: false, error: "INVALID_SLUG" }, { status: 400 });
  }

  const authenticated = await requireBoardSession(request, env, slug);
  if (!authenticated) {
    return Response.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  return Response.json({ ok: true });
};
