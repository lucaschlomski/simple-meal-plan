export const onRequestGet: PagesFunction = async () => {
  return Response.json({ ok: true, service: "meal-planner-api" });
};
