interface Env {
  DB: D1Database;
  ADMIN_PASSWORD: string;
  SESSION_SIGNING_KEY: string;
  TURNSTILE_SECRET_KEY?: string;
}
