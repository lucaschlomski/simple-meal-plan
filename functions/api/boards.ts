import { createBoard } from "../lib/board-create";
import { verifyTurnstile } from "../lib/turnstile";

type CreateBoardBody = {
  name?: string;
  password?: string;
  turnstileToken?: string;
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = (await request.json().catch(() => ({}))) as CreateBoardBody;
  const name = (body.name || "").trim();
  const password = body.password || "";

  if (!name) return Response.json({ ok: false, error: "NAME_REQUIRED" }, { status: 400 });
  if (!password) return Response.json({ ok: false, error: "PASSWORD_REQUIRED" }, { status: 400 });

  const verified = await verifyTurnstile(env.TURNSTILE_SECRET_KEY, body.turnstileToken);
  if (!verified) {
    return Response.json({ ok: false, error: "TURNSTILE_FAILED" }, { status: 403 });
  }

  const board = await createBoard(env.DB, name, password);
  return Response.json({ ok: true, board }, { status: 201 });
};
