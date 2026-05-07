export function validateEnv(env: Env): string | null {
  if (typeof env.ADMIN_PASSWORD !== "string" || !env.ADMIN_PASSWORD) {
    return "ADMIN_PASSWORD environment secret is not set. Run: wrangler secret put ADMIN_PASSWORD";
  }
  if (typeof env.SESSION_SIGNING_KEY !== "string" || !env.SESSION_SIGNING_KEY) {
    return "SESSION_SIGNING_KEY environment secret is not set. Run: wrangler secret put SESSION_SIGNING_KEY";
  }
  return null;
}
