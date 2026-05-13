# Architecture

## Platform

- Stack: Cloudflare Pages + Pages Functions + D1.
- No KV for attendees or board data in MVP.
- URL shape:
  - board: `/b/:slug`
  - admin: `/admin`
- No routing library. Routing is done via `window.location.pathname` matching in `App.tsx`:
  - `/admin` → AdminPage
  - `/legal` → LegalPage
  - `/b/:slug` (regex `^\/b\/([a-z0-9-]+)$/i`) → BoardPage
  - `/` → Landing page
- No global state management (no zustand, redux, context other than Toast). State lives in page components and passes down via props. `language` and `theme` are lifted to `App.tsx`.

## Board Model

Top-level planning unit: board (trip-like container).

Board has:
- name
- slug (human-typable, three random words: `word-word-word`)
- board password

Multiple boards are supported. Slug is generated server-side and unique.

## Dates and Board Rendering

- Meal date storage: date-only string (`YYYY-MM-DD`), no timezone.
- Column span is dynamic per board:
  - start: `MIN(meal_date)`
  - end: `MAX(meal_date)`
  - include all internal dates between start and end
  - do not show leading/trailing dates outside that range
- If an internal date has no meals, show an empty column with a subtle add placeholder.
- When a board has zero meals (new board), the frontend falls back to `[{ date: todayIsoDate(), meals: [] }]` — a single empty today column. This ensures new boards always render something.

## Meal Types and Ordering

Allowed meal types (selectable):
- `breakfast`
- `lunch`
- `dinner`
- `other`

`unset` is legacy-only. It is not selectable and new writes must not create it; old rows are treated like `other` in the UI.

New meal default type is chosen from the current day column: first missing `breakfast`, then `lunch`, then `dinner`, then `other`. If all types are already present, default to `other`. Implemented in `defaultMealTypeForDate()` in `BoardPage.tsx`.

Sort order by type:
1. `breakfast`
2. `lunch`
3. `dinner`
4. `other` / legacy `unset`

Within same type and date: stable `id ASC` ordering. No restriction on one meal per type per day; unlimited meals allowed.

## Attendees and People

- People list is board-global.
- Each person entry has a configurable `group_size` (integer >= 1).
- `group_size` supports single people, couples, families, etc.
- No ad-hoc free-text attendees in meals.
- Meal attendee counter is the sum of selected attendees' `group_size`, not just selected row count.
- People order within a board is admin-controlled via the `position` column. New people are appended (`MAX(position) + 1`); admin reorders via the manage modal. Both the public `/people` and the admin people list return rows ordered by `position ASC, id ASC`.
- Reorder writes normalize positions to a contiguous sequence (`1..N`) after each move so stale duplicates cannot block visible up/down moves.

## Meal Editing and Deletion

- Meal edits are anonymous (no change history, no attribution).
- Anyone with board access can create/update/delete meals.
- Deleting a meal must:
  - show a confirm dialog
  - hard-delete the meal row
  - hard-delete linked attendee rows

## Access and Authentication

### Admin Area (`/admin`)

- Protected by one global admin password from environment secret.
- Login flow sets a cookie session.
- Admin session cookie name: `mp_admin`.
- Admin dashboard creates boards, lists metadata, opens boards, and deletes boards.
- Board properties and people are edited from the board admin modal opened on an unlocked board.

### Board Area (`/b/:slug`)

- Board access depends on `boards.board_password_hash`:
  - `NULL` => public read/write board (no unlock cookie required)
  - non-`NULL` => protected board (requires board password unlock)
- Demo board (`demo-meal-planner`) allows everyone to open the board admin
  panel to inspect and manage people/groups, but blocks changes to board name,
  board password, admin password, and board deletion.
- Unlock flow sets a board cookie session.
- Board cookie name pattern: `mp_board_<slug>`.
- Board cookie grants board read/write meal access.
- Board cookie grants board-admin modal access until a separate board-admin password is set.

### Board Admin Modal

- Edits board name, board password, optional board-admin password, people/groups, order, and board deletion.
- Opened from the gear button in the board header. There is no standalone board-admin route.
- If `boards.board_admin_password_hash` is null, the normal board session unlocks the modal.
- If `boards.board_admin_password_hash` is set, both the normal board cookie and a `boardAdmin` session cookie are required.
- Board admin cookie name pattern: `mp_board_admin_<slug>`.

### Public Board Creation (`/`)

- Root page runs Cloudflare Turnstile in invisible mode on page load.
- The create-board modal uses the resulting token and disables submit while verification is pending.
- Frontend needs `VITE_TURNSTILE_SITE_KEY` at build time.
- Backend verifies tokens with `TURNSTILE_SECRET_KEY` before creating a public board.
- Root `/admin` board creation does not use Turnstile because it already requires global admin auth.

### Password and session implementation

- Board passwords are stored as SHA-256 hashes in `boards.board_password_hash` for protected boards; public boards store `NULL`.
- Session tokens are HMAC-SHA256 signed with `SESSION_SIGNING_KEY`.
- Admin sessions expire after 7 days. Board sessions expire after 14 days.
- Auth cookies are `HttpOnly`, `SameSite=Lax`. `Secure` flag is set conditionally: `new URL(request.url).protocol === "https:"` — true on deployed, false on local `http://localhost:8788`.
- Session signatures are HMAC-SHA256 signed and verified.
- Signature comparison uses constant-time comparison.
- Auth cookies are `HttpOnly`, `SameSite=Lax`. `Secure` flag is conditional: set on HTTPS, omitted on local HTTP dev.
- Board attendee add endpoint rejects inactive people.

## Data Model (D1)

### Tables

**`boards`**
| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER | Primary key, autoincrement |
| `slug` | TEXT | Unique, human-typable |
| `name` | TEXT | Display name |
| `board_password_hash` | TEXT | Nullable SHA-256 hash. `NULL` means public read/write board. |
| `board_admin_password_hash` | TEXT | Nullable SHA-256 hash for optional board-admin password |
| `created_at` | TEXT | Default `CURRENT_TIMESTAMP` |
| `updated_at` | TEXT | Auto-updated via trigger |
| `last_accessed_at` | TEXT | Updated when a board is loaded with a valid board session |

**`people`**
| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER | Primary key, autoincrement |
| `board_id` | INTEGER | FK → boards(id) ON DELETE CASCADE |
| `display_name` | TEXT | |
| `group_size` | INTEGER | >= 1, default 1 |
| `active` | INTEGER | 0 or 1, default 1 |
| `position` | INTEGER | Admin-controlled sort order within board |
| `created_at` | TEXT | Default `CURRENT_TIMESTAMP` |

**`meals`**
| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER | Primary key, autoincrement |
| `board_id` | INTEGER | FK → boards(id) ON DELETE CASCADE |
| `meal_date` | TEXT | `YYYY-MM-DD`, length 10 |
| `meal_type` | TEXT | `breakfast`, `lunch`, `dinner`, or `other`. Legacy `unset` allowed in existing rows. |
| `meal_name` | TEXT | Nullable |
| `cooks_text` | TEXT | Nullable |
| `notes` | TEXT | Nullable |
| `created_at` | TEXT | Default `CURRENT_TIMESTAMP` |
| `updated_at` | TEXT | Auto-updated via trigger |

**`meal_attendees`**
| Column | Type | Notes |
|---|---|---|
| `meal_id` | INTEGER | FK → meals(id) ON DELETE CASCADE |
| `person_id` | INTEGER | FK → people(id) ON DELETE CASCADE |
| — | — | Composite PK: `(meal_id, person_id)` |
| `created_at` | TEXT | Default `CURRENT_TIMESTAMP` |

### Indexes

- `idx_meals_board_date_type_id` on `meals(board_id, meal_date, meal_type, id)`
- `idx_people_board_active_name` on `people(board_id, active, display_name)`
- `idx_people_board_position` on `people(board_id, position)` (added in `0002_people_position.sql`)

### Constraints

- `people.group_size` must be `>= 1`.
- `people.active` must be `0` or `1`.
- `meals.meal_type` accepts `breakfast|lunch|dinner|other` for new writes. Legacy `unset` can still exist in persisted rows.
- `meals.meal_date` must be exactly 10 characters (`YYYY-MM-DD`).

## API

All endpoints follow these conventions:

- Success: `{ "ok": true, ...payload }`
- Error: `{ "ok": false, "error": "ERROR_CODE" }` with appropriate HTTP status (400/401/404).
- All `:id` params validated with `Number.isInteger(id) && id > 0`.
- No CORS headers. The app is intentionally same-origin only.

### Utility

- `GET /api/health` — returns `{ ok: true, service: "simple-meal-plan-api" }`

### SEO Discovery Files

- `GET /sitemap.xml` is handled by Pages Function `functions/sitemap.xml.ts`.
- Sitemap lists apex public URLs only (`/`, `/legal`).
- `GET /robots.txt` is handled by Pages Function `functions/robots.txt.ts`.
- Cloudflare managed robots content is prepended when enabled, then origin
  robots directives are included.
- `GET /api/admin/session` — admin session check, returns `{ ok: true }` or 401
- `GET /api/boards/:slug/session` — board session check

### Board access

- `POST /api/boards` — public board creation; requires Turnstile token
- `POST /api/boards/:slug/unlock` — for protected boards: verify password + set board cookie. For public boards: immediate success.
- `GET /api/boards/:slug/board` — return board columns, meals, attendees, attendee counts. Requires valid board cookie.
- `GET /api/boards/:slug/people` — return board people list, ordered by `position ASC, id ASC`. Requires valid board cookie.

### Board admin

- `POST /api/boards/:slug/admin/unlock` — verify board-admin password if set, otherwise board password; sets board-admin cookie
- `GET /api/boards/:slug/admin/session`
- `GET /api/boards/:slug/admin`
- `PUT /api/boards/:slug/admin` — update board name, board password, or admin password
- `DELETE /api/boards/:slug/admin` — delete current board
- `GET /api/boards/:slug/admin/people`
- `POST /api/boards/:slug/admin/people` — requires `display_name`, optional `group_size` (default 1)
- `PUT /api/boards/:slug/admin/people/:id`
- `DELETE /api/boards/:slug/admin/people/:id`
- `POST /api/boards/:slug/admin/people/:id/move` with `{ direction: "up" | "down" }`

### Meals

- `POST /api/boards/:slug/meals` — create meal on a board
- `PUT /api/meals/:id` — update meal
- `DELETE /api/meals/:id` — hard-delete meal and its attendees

### Attendees (single-item operations)

- `POST /api/meals/:id/attendees` with `{ personId }`
- `DELETE /api/meals/:id/attendees/:personId`

### Admin

- `POST /api/admin/login`
- `POST /api/admin/logout`
- `GET /api/admin/boards`
- `POST /api/admin/boards`
- `DELETE /api/admin/boards/:id`

### Security and Validation

- Session signatures are HMAC-SHA256 signed and verified.
- Signature comparison uses constant-time comparison.
- Auth cookies are `HttpOnly`, `SameSite=Lax`. `Secure` flag is conditional: set on HTTPS, omitted on local HTTP dev.
- Board attendee add endpoint rejects inactive people.
- Public board creation rejects requests without successful Turnstile siteverify.
- `ADMIN_PASSWORD` and `SESSION_SIGNING_KEY` are validated at runtime on login/unlock — missing secrets return a clear error instead of a cryptic crash.

## D1 Migrations and Seeds

- Migration directory: `db/migrations`
- File naming: `NNNN_description.sql` (zero-padded sequential number + snake_case).
- Every migration starts with `PRAGMA foreign_keys = ON;`.
- All statements are idempotent: `CREATE TABLE IF NOT EXISTS`, `INSERT OR IGNORE`.
- Uses `RETURNING` on INSERT/UPDATE to return created/updated rows.
- Initial migration: `db/migrations/0001_init.sql`
- People position migration: `db/migrations/0002_people_position.sql`
- Board admin/activity migration: `db/migrations/0003_board_admin_activity.sql`
- Demo board data migration: `db/migrations/0004_demo_board_meal_planner.sql`
- Public board password-null migration: `db/migrations/0005_public_boards_nullable_password.sql`
- Demo board reset seed script: `db/demo-board-reset.sql`
- Daily reset scheduler Worker: `workers/demo-reset/` (`0 3 * * *` UTC)
- `boards.updated_at` tracks board config/content changes; `boards.last_accessed_at` tracks successful board access and does not touch `updated_at`.
- `people`, `meals`, and `meal_attendees` changes touch parent `boards.updated_at` via triggers.
- Seed file: `db/seed.sql` — dev-only; do not run against production D1.
- Local commands: `npm run db:migrate:local`, `npm run db:seed:local`

## Testing

- Framework: Vitest. Files: `tests/*.test.ts`.
- Pure-function unit tests only — no component, integration, or API tests.
- Run tests: `npm run test`
- Current tests cover:
  - date range expansion (`MIN..MAX` with internal dates)
  - meal sorting order (date, type, id)
  - weighted attendee count (`sum(group_size)`)
  - slug format and reserved-slug checks

## Explicitly Rejected for MVP

- User identity tracking or edit attribution.
- Audit/change history.
- KV cache for attendees/board data.
- Fixed 7-day board.
- Continuous date range outside `MIN..MAX` meal dates.
- Attendee filtering UI on board page.

## Local Development

### First-time setup

```
npm install
npm run db:migrate:local
npm run db:seed:local
```

### `.dev.vars` (required)

Create a `.dev.vars` file in the project root (gitignored). This is the single
source for all local secrets and the Turnstile site key. Both `dev:cf` and
`deploy:preview` source this file before running the Vite build so that
`VITE_TURNSTILE_SITE_KEY` is baked into the bundle:

```
ADMIN_PASSWORD=admin
SESSION_SIGNING_KEY=dev-session-key
TURNSTILE_SECRET_KEY=your-turnstile-secret-key
VITE_TURNSTILE_SITE_KEY=your-turnstile-site-key
```

No `.env.local` or `.env.preview` files are needed. `.dev.vars` covers local
dev and manual preview deploys. Production Git-triggered builds read
`VITE_TURNSTILE_SITE_KEY` from `wrangler.toml [vars]` and secrets from the
Cloudflare Pages dashboard.

### Start

```
npm run dev:cf
```

Sources `.dev.vars`, builds the app (making `VITE_TURNSTILE_SITE_KEY` available to Vite), applies pending local D1 migrations and seed, then starts a local Cloudflare Pages emulator at `http://localhost:8788`. Wrangler reads `.dev.vars` automatically for Functions runtime secrets.

### Demo access

- Board: `http://localhost:8788/b/echo-harbor-amber`
- Board password: `demo123`
- Admin: `http://localhost:8788/admin`

### Local commands

| Command | Description |
|---|---|
| `npm run dev` | Vite hot-reload (frontend only, no Cloudflare) |
| `npm run dev:cf` | Full local Cloudflare stack |
| `npm run build` | Type-check and build |
| `npm run check` | Type-check only |
| `npm run test` | Run tests |
| `npm run db:migrate:local` | Apply migrations to local D1 |
| `npm run db:seed:local` | Seed local D1 |

## Deployment

| Environment | Branch | Deploy method | URL | Database |
|---|---|---|---|---|
| Local | — | `npm run dev:cf` | `localhost:8788` | Local D1 |
| Preview | `preview` | `npm run deploy:preview` (manual CLI) | `preview.simple-meal-plan.pages.dev` | `SimpleMealPlan-Preview` |
| Production | `main` | `git push origin main` (GitHub auto-deploy) | `simple-meal-plan.pages.dev` | `SimpleMealPlan-Production` |

### Cloudflare Dashboard setup

1. Connect GitHub repo in Workers & Pages → `simple-meal-plan` → Settings → Build & Deployments. Production branch: `main`. Build command: `npm run build`, output: `dist`. Do **not** add `preview` as a tracked branch.
2. Settings → Functions → D1 Database Bindings: map `DB` to `SimpleMealPlan-Production` (Production) and `SimpleMealPlan-Preview` (Preview).
3. Settings → Environment variables: set `VITE_TURNSTILE_SITE_KEY` as a plain variable for both environments. This is a public key baked into the JS bundle at build time — safe to set as a variable, not a secret. It is also committed to `wrangler.toml [vars]` as the canonical value for Git-triggered production builds.
4. Settings → Secrets: set `ADMIN_PASSWORD`, `SESSION_SIGNING_KEY`, and `TURNSTILE_SECRET_KEY` as secrets for both environments. Secrets are runtime-only and never exposed to the build or the browser.

### Migration workflow

D1 migrations are manual. For every schema change:

```
npm run db:migrate:preview   # apply to preview DB
npm run deploy:preview       # deploy preview
# test at preview.simple-meal-plan.pages.dev →
git checkout main && git merge preview
npm run db:migrate:prod      # apply to production DB
git push origin main         # auto-deploys production
```

Redeploy production without code changes:
```
git commit --allow-empty -m "redeploy" && git push origin main
```

### All npm scripts

| Script | Description |
|---|---|
| `npm run dev` | Vite hot-reload (frontend only) |
| `npm run dev:cf` | Full local Cloudflare stack |
| `npm run build` | Type-check and build |
| `npm run check` | Type-check only |
| `npm run test` | Run tests |
| `npm run db:migrate:local` | Local D1 migrations |
| `npm run db:seed:local` | Seed local D1 |
| `npm run db:migrate:preview` | Preview D1 migrations (remote) |
| `npm run db:migrate:prod` | Production D1 migrations (remote) |
| `npm run db:seed:preview` | Seed preview D1 |
| `npm run deploy:preview` | Build + deploy to preview |
