export const onRequestGet: PagesFunction = async () => {
  return Response.json({ ok: true, service: "simple-meal-plan-api" });
};
