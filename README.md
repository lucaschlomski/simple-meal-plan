# Meal Planner MVP Decisions

This document records the agreed design and product decisions for the first version of the holiday meal planner. Update this file when decisions change.

## Product Scope

- Goal: simple meal planner for holidays with a Kanban-style board.
- Each day is one column.
- Meals are cards inside each day column.
- Card shows:
  - meal name (can be unset/empty)
  - meal type
  - cook text
  - attendees
  - attendee count (sum of attendee group sizes)

## Platform and Architecture

- Stack: Cloudflare Pages + Pages Functions + D1.
- No KV for attendees or board data in MVP.
- URL shape:
  - board: `/b/:slug`
  - admin: `/admin`

## Board Model

- Top-level planning unit: board (trip-like container).
- Board has:
  - name
  - slug (human-typable, three random words: `word-word-word`)
  - board password
- Multiple boards are supported.
- Slug is generated server-side and unique.

## Dates and Board Rendering

- Meal date storage: date-only string (`YYYY-MM-DD`), no timezone.
- Column span is dynamic per board:
  - start: `MIN(meal_date)`
  - end: `MAX(meal_date)`
  - include all internal dates between start and end
  - do not show leading/trailing dates outside that range
- If an internal date has no meals, show an empty column with a subtle add placeholder.

## Meal Types and Ordering

- Allowed meal types (selectable):
  - `breakfast`
  - `lunch`
  - `dinner`
  - `other`
- `unset` is legacy-only. It is not selectable and new writes must not create it; old rows are treated like `other` in the UI.
- New meal default type is chosen from the current day column: first missing `breakfast`, then `lunch`, then `dinner`, then `other`. If all types are already present, default to `other`.
- Sort order by type:
  1. `breakfast`
  2. `lunch`
  3. `dinner`
  4. `other` / legacy `unset`
- Within same type and date: stable `id ASC` ordering.
- No restriction on one meal per type per day; unlimited meals allowed.

## Card and Column UX

- Meal name is allowed to be empty/unset.
- Empty or new meal card displays a placeholder label (e.g. "Meal not set").
- Every column includes the same subtle `+ Add meal` placeholder card at the bottom.
- Empty columns use that same add placeholder.
- Each day column is headed by the weekday name in English (e.g. "Thursday") with the date below in European day-month-year order (`23 May 2026`).
- The column matching today carries a "Today" pill; non-today columns carry a relative label below the date (e.g. "In 3 days", "1 day ago").

## Attendees and People

- People list is board-global.
- Each person entry has a configurable `group_size` (integer >= 1).
- `group_size` supports single people, couples, families, etc. (e.g. `Luca = 1`, `Miller Family = 4`).
- No ad-hoc free-text attendees in meals.
- Attendee UI in meal modal: searchable dropdown multi-select with checkmarks. Selected attendees shown as removable chips below the input.
- No attendee filter control on the board page in MVP.
- Meal attendee counter is the sum of selected attendees' `group_size`, not just selected row count.
- People order within a board is admin-controlled via the `position` column. New people are appended (`MAX(position) + 1`); admin reorders via the manage modal. Both the public `/people` and the admin people list return rows ordered by `position ASC, id ASC`.

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
- Admin dashboard can manage all boards and all board properties.
- Admin dashboard manages board people lists.

### Board Area (`/b/:slug`)

- Protected by board-specific password.
- Unlock flow sets a board cookie session.
- Board cookie name pattern: `mp_board_<slug>`.
- Board cookie grants board read/write meal access.
- Board access does not grant admin capabilities.

Password and session details:

- Board passwords are stored as SHA-256 hashes in `boards.board_password_hash`.
- Session tokens are HMAC-SHA256 signed with `SESSION_SIGNING_KEY`.

## Data Model (D1)

Planned tables:

- `boards`
  - `id`
  - `slug` (unique)
  - `name`
  - `board_password_hash`
  - `created_at`
  - `updated_at`
- `people`
  - `id`
  - `board_id`
  - `display_name`
  - `group_size` (integer >= 1)
  - `active`
  - `position` (integer; admin-controlled sort order within a board)
  - `created_at`
- `meals`
  - `id`
  - `board_id`
  - `meal_date` (TEXT `YYYY-MM-DD`)
  - `meal_type`
  - `meal_name` (nullable)
  - `cooks_text` (nullable)
  - `notes` (nullable)
  - `created_at`
  - `updated_at`
- `meal_attendees`
  - `meal_id`
  - `person_id`
  - unique composite key `(meal_id, person_id)`

Planned indexes:

- `meals(board_id, meal_date, meal_type, id)`
- `people(board_id, active, display_name)`
- `people(board_id, position)` (added in `0002_people_position.sql`)

Data constraints:

- `people.group_size` must be `>= 1`.
- `people.active` must be `0` or `1`.
- `meals.meal_type` accepts `breakfast|lunch|dinner|other` for new writes. Legacy `unset` can still exist in persisted D1 rows because the initial schema allowed it.

## API Decisions (MVP)

### Board access

- `POST /api/boards/:slug/unlock`
  - verify board password
  - set board cookie
- `GET /api/boards/:slug/board`
  - return board columns, meals, attendees, attendee counts
  - requires valid board cookie

### Meals

- `POST /api/boards/:slug/meals`
- `PUT /api/meals/:id`
- `DELETE /api/meals/:id`

### Attendees (single-item operations)

- `POST /api/meals/:id/attendees` with `{ personId }`
- `DELETE /api/meals/:id/attendees/:personId`

### Admin

- `POST /api/admin/login`
- `POST /api/admin/logout`
- `GET /api/admin/boards`
- `POST /api/admin/boards`
- `PUT /api/admin/boards/:id`
- `GET /api/admin/boards/:id/people`
- `POST /api/admin/boards/:id/people` (requires `display_name`, optional `group_size`, default `1`)
- `PUT /api/admin/people/:id`
- `DELETE /api/admin/people/:id`
- `POST /api/admin/people/:id/move` with `{ direction: "up" | "down" }` — server transactionally swaps `position` with the adjacent neighbor on the same board. No-op if already at the edge.
- `DELETE /api/admin/boards/:id`

## Explicitly Rejected for MVP

- Per-board admin password separate from global admin area.
- User identity tracking or edit attribution.
- Audit/change history.
- KV cache for attendees/board data.
- Fixed 7-day board.
- Continuous date range outside `MIN..MAX` meal dates.
- Attendee filtering UI on board page.

## Change Control

- This file is the source of truth for implementation decisions.
- If implementation differs, update this file in the same change.

## D1 Migration and Seed Files

- Migration directory: `db/migrations`
- Initial migration: `db/migrations/0001_init.sql`
- Seed file: `db/seed.sql`
- Local commands:
  - `npm run db:migrate:local`
  - `npm run db:seed:local`

## Security and Validation Notes (Implemented)

- Session signatures are HMAC-SHA256 signed and verified.
- Signature comparison uses constant-time comparison.
- Auth cookies are `HttpOnly`, `SameSite=Lax`. `Secure` flag is conditional: set on HTTPS, omitted on local HTTP dev.
- Board attendee add endpoint rejects inactive people.
- `ADMIN_PASSWORD` and `SESSION_SIGNING_KEY` are validated at runtime on login/unlock — missing secrets return a clear error instead of a cryptic crash.
- Secrets for local dev live in `.dev.vars` (gitignored). Production secrets are set via `wrangler pages secret put`.

## Testing

- Run tests with `npm run test`.
- Current automated tests cover:
  - date range expansion (`MIN..MAX` with internal dates)
  - meal sorting order (date, type, id)
  - weighted attendee count (`sum(group_size)`)
  - slug format and reserved-slug checks

## Local Development Runbook

- Build app: `npm run build`
- Apply local DB migration: `npm run db:migrate:local`
- Seed local DB: `npm run db:seed:local`
- Start local Cloudflare instance:
  - `npm run dev:cf`
  - Local dev secrets are configured in `.dev.vars` (gitignored).
- Stop server:
  - press `Ctrl+C` in that terminal.
- Project uses Wrangler v4.
- Local URL: `http://localhost:8788`
- Demo board slug: `/b/echo-harbor-amber`
- Demo board password (from seed): `demo123`

## Production Deployment

### First-time Setup

```
# 1. Create the production D1 database
npx wrangler d1 create SimpleMealPlan-Prod

# 2. Copy the database_id into wrangler.toml → [[d1_databases]].database_id
#    The current id: eac8892f-1276-44ee-8121-a8368b58ca13

# 3. Create the Pages project
CLOUDFLARE_ACCOUNT_ID=8b1e9fa39a0d7a3b5e2663e613c78e2d npx wrangler pages project create simple-meal-plan --production-branch main

# 4. Apply migrations to production D1
npx wrangler d1 migrations apply SimpleMealPlan-Prod --remote

# 5. Set secrets (prompts interactively for each value)
npx wrangler pages secret put SESSION_SIGNING_KEY --project-name simple-meal-plan
npx wrangler pages secret put ADMIN_PASSWORD --project-name simple-meal-plan

# 6. Build + deploy
npm run build
CLOUDFLARE_ACCOUNT_ID=8b1e9fa39a0d7a3b5e2663e613c78e2d npx wrangler pages deploy dist --project-name simple-meal-plan --branch main
```

### Re-deploy (after changes)

```
npm run build
CLOUDFLARE_ACCOUNT_ID=8b1e9fa39a0d7a3b5e2663e613c78e2d npx wrangler pages deploy dist --project-name simple-meal-plan --branch main
```

### Custom Domain

Add `simple-meal-plan.schlomski.net` via Cloudflare Dashboard → Workers & Pages → `simple-meal-plan` → Custom domains. The zone is auto-managed by Cloudflare.

### Current wrangler.toml Production Config

```toml
name = "simple-meal-plan"
compatibility_date = "2026-05-06"
pages_build_output_dir = "dist"

[[d1_databases]]
binding = "DB"
database_name = "SimpleMealPlan-Prod"
database_id = "eac8892f-1276-44ee-8121-a8368b58ca13"
migrations_dir = "db/migrations"
```

### Live URLs

- Pages: `https://simple-meal-plan.pages.dev`
- Custom domain: `https://simple-meal-plan.schlomski.net` (after DNS setup)

## Desktop Layout

- Board view uses horizontal scroll + snap on all viewport sizes.
- Desktop shows day columns at a wider fixed width (320px) so multiple days are partially visible while maintaining swipe behaviour.
- Admin page uses the full available screen width.

## Night Mode

- Light and dark theme supported via `data-theme` attribute on the root element.
- Toggle available on the landing page, board unlock screen, board top bar, admin login, and admin top bar.
- Theme preference stored in `localStorage` and follows `prefers-color-scheme` on first visit.

## Admin Page UI

- Single cohesive panel layout (no split dashboard). `admin-stack` capped at 880px.
- Compact create-board form at the top (name, password, submit).
- Boards displayed as table rows with columns: Name, Slug, Actions (Manage / Open board).
- "Manage" opens `BoardManageModal` (popup), not inline beneath the row. The modal contains both settings and people management.
- Empty-state placeholder when zero boards exist.
- Inline rename uses `InlineEdit`. Group-size adjustments use `Stepper`. All deletes use `ConfirmInline` popover.
- Each person row carries a `.row-reorder` cell with stacked Up/Down chevron buttons (`btn icon ghost-quiet xs`). Buttons are disabled at the boundaries; one click swaps positions with the immediate neighbor via `POST /api/admin/people/:id/move`.
- No native `prompt` / `confirm` anywhere on admin.
- Accent is suppressed on admin: plain buttons, neutral inline-edit borders.

## Design System and UI Conventions

This is the source-of-truth styling contract. New UI must follow it. If implementation diverges, update this section in the same change.

### Tokens

All tokens defined in `src/styles.css`. Reference tokens — never hard-code colors, spacing, radii, or motion durations.

- **Type scale**: `--text-xs` (0.75rem) through `--text-xl` (1.5rem). System font stack via `--font-sans`; mono via `--font-mono`. No web fonts.
- **Spacing**: `--s-1` (4px) through `--s-7` (48px).
- **Radii**: `--r-sm` (8), `--r-md` (12), `--r-lg` (16), `--r-pill`.
- **Motion**: `--d-fast` (120ms), `--d-mid` (180ms), `--d-slow` (240ms); ease `--ease-out`. All animation respects `prefers-reduced-motion`.
- **Neutrals**: `--gray-50`..`--gray-900` ramp + semantic aliases `--bg`, `--fg`, `--fg-muted`, `--panel`, `--panel-soft`, `--surface`, `--border`, `--border-strong`.
- **Accent (lilac)**: `--accent-50`..`--accent-700` + `--accent`, `--accent-fg`, `--accent-soft`.
- **Type tints**: per-meal-type bg/fg pairs (`--type-breakfast-*`, `--type-lunch-*`, `--type-dinner-*`, `--type-other-*`) drive badges and segmented controls.
- **Dark mode**: triggered by `:root[data-theme="dark"]`; all tokens swap under the same names.

### Accent Strategy

The accent (lilac) is a state signal, not a default fill. Reserved surfaces:

- `:focus-visible` outline
- localized current-day pill on the day column
- `.person-row.selected` row + checkmark
- `.add-card` hover
- `.toast` glass-accent border for status feedback (errors switch to danger)
- Landing screen brand mark (`.landing-dot`) and soft background glow (`.landing-glow`) — the only purely decorative accent use, scoped to the root path

Buttons must not use accent fills. Card chrome, headers, body, default buttons, and inline-edit borders are all neutral. Adding a new accent surface requires approval.

### Buttons

- `.btn` (default) is plain: transparent background, `--border-strong` border, `--fg` text, `--panel-soft` hover. Use this for almost every button (login, admin create/save/manage, attendee picker close, etc.).
- `.btn.primary` is the only emphasis variant: filled with `--fg` background, `--bg` text. Reserved for the single most prominent action of a flow. Currently applied only to **MealModal Save**. Adding a second `.primary` per screen requires approval.
- `.btn.danger` is reserved for destructive confirms (`ConfirmInline` red action).
- `.btn.icon` and `.btn.icon.ghost-quiet` are icon-only controls; transparent base, panel-soft hover.
- `.btn.ghost` is a no-op alias retained for legacy markup (identical to default `.btn`).

### Iconography and Typography

- Icons: `lucide-react` only. No inline SVG, no other icon libraries.
- Font: system sans-serif stack. Do not introduce Inter or any web font.
- Headings use `--tracking-tight`. Body line-height 1.5.
- On mobile (`max-width: 699px`), `.field` and `.inline-edit-input` clamp to `font-size: 16px` to suppress iOS focus-zoom.

### Internationalization

- Whole-app language switching supports English (`en`) and German (`de`). English is the default.
- Language preference is stored in `localStorage` under `mp_language`; the root `<html lang="...">` attribute is updated on change.
- `LanguageToggle` appears beside `ThemeToggle` everywhere theme controls appear (root, admin login, admin topbar, board unlock, board topbar). It uses the lucide `Languages` icon plus active code (`EN` / `DE`) and toggles directly — no dropdown.
- Source of truth for user-facing strings is `src/lib/i18n.ts`. Use `t(language, key, params?)` and `mealTypeLabel(language, type)`; do not inline visible UI text in components.
- Components that render visible text receive `language` as a prop unless they can read it from an immediate parent wrapper. No global context is used beyond `useLanguage` in `App.tsx`.

### Locale and Dates

- UI strings follow the selected language. Dates use `en-GB` for English and `de-DE` for German so both languages keep European day-month-year order.
- `fmtDate` and friends in `src/lib/dates.ts` accept `language` and use `timeZone: "UTC"` so date-only values stay stable across DST and timezones.
- The desktop date picker (in the meal modal) uses `react-day-picker` with locale `enGB` / `de` and Monday-first weeks. Touch devices keep the native `<input type="date">` (preserves iOS/Android wheels and follows the device's locale on those surfaces).
- Relative day labels are language-aware (for example today/tomorrow equivalents) and provided by `relativeDayLabel(date, language)`.
- Storage format remains `YYYY-MM-DD`, no timezone (unchanged).
- Date entry: the `DatePicker` component is hybrid. Touch devices (`(pointer: coarse)`) keep the native `<input type="date">`. Desktop renders a typed `dd/mm/yyyy` field plus a portalled `react-day-picker` calendar centered in the viewport. The native control is intentionally not used on desktop because its rendered format is browser/OS-dependent and cannot be forced to DMY.

### Component Catalogue

Reusable building blocks live in `src/components/`. Reuse before creating new components.

- `Topbar` — sticky top bar with scroll-aware bottom border. Title + right-side actions.
- `ThemeToggle` — icon-only light/dark toggle, language-aware labels.
- `LanguageToggle` — one-click EN/DE toggle, stored via `useLanguage`.
- `Toast` + `ToastProvider` — fire-and-forget notifications via `useToast()` (`showSuccess`, `showError`). Replaces `alert()`.
- `InlineEdit` — click-to-edit text. Replaces `prompt()`. Auto-focus, blur to commit, Esc to cancel.
- `Stepper` — numeric +/− control (used for `group_size`).
- `SegmentedControl` — type-tinted segmented selector.
- `ConfirmInline` — popover-style destructive confirm. Replaces `confirm()`.
- `DatePicker` — hybrid date picker. Touch devices fall back to the native `<input type="date">`; desktop renders a typed `dd/mm/yyyy` field plus a portalled, viewport-centered `react-day-picker` calendar with its own backdrop (locale `enGB` / `de`, Monday week start). Always speaks `YYYY-MM-DD` to the parent. Keyboard input accepts `dd/mm/yyyy`, `dd.mm.yyyy`, `dd-mm-yyyy`, or `ddmmyyyy`; Enter commits, blur commits, invalid input is left in place for correction.

Hooks in `src/hooks/`:

- `useTheme` — light/dark with localStorage + `prefers-color-scheme`.
- `useFocusTrap` — traps Tab focus inside an element (used in modals).
- `useOutsideClick` — closes popovers / dropdowns on outside click.

### Native Dialog Ban

Do not call `window.alert`, `window.confirm`, or `window.prompt`. Always use `Toast`, `ConfirmInline`, and `InlineEdit` respectively. Keeps interactions theme-consistent and testable.

### Modal Behaviour

- All modals trap focus via `useFocusTrap`.
- Esc closes. In the meal modal, Cmd/Ctrl+Enter submits; plain Enter inside any single-line field submits the form.
- Nested popovers (attendee dropdown, confirm popover, date picker calendar) intercept Esc and call `stopPropagation()` so closing them does not also close the surrounding modal. Press Esc twice to exit modal entirely from a nested popover.
- `.modal-content` enforces `overflow-x: hidden` plus `min-width: 0` on itself and on direct children — long content cannot push horizontal scroll.
- Meal modal renders all fields by default. No progressive disclosure.
- Meal modal field order (top to bottom): meal name, type, cook, date, attendees, notes. Match this order in `src/board/MealModal.tsx`.
- Cook and date sit on a single row at `min-width: 700px` via `.form-row.two-col` (single column on mobile). Use this class to pair other narrow fields when you need horizontal density.
- The native iOS `<input type="date">` has an intrinsic min-width that can blow the modal column wider than the viewport. `.modal-content input[type="date"]` and `.modal-content label > *` are pinned to `min-width: 0` to keep the field flush with the modal edge.
- Destructive actions inside modals use `ConfirmInline`, never native `confirm`.
- Backdrop dim is desktop-only. On mobile (`max-width: 699px`) the backdrop is transparent — the dim clashes with browser/OS header bars. The modal's own panel and `--shadow-pop` keep it visually distinct without a dim layer.

### Meal Card Structure

- Head row: meal-type `.badge` (left) + attendee `.count` (right).
- Title group: meal name (`--text-lg`, prominent) + cook subtitle below with the lucide `ChefHat` icon. The cook is a subtitle, not a separate row.
- Chips at the bottom in `.chips.chips-sm` (smaller variant). Cap is 20 chips per card; overflow renders as a `+N` chip. Chip labels never display `×N` group counts.

### Attendee Picker

- Chevron toggle inside the input opens the dropdown.
- The localized close action button closes the dropdown.
- The localized bulk toggle (select all / clear all) operates on the entire person list, not the current search filter — the user explicitly asked for "all attendees".
- Keyboard: ↑ / ↓ navigate, Enter toggles, Esc closes.
- Outside-click closes via `useOutsideClick`.
- The visible counter is the weighted sum of `group_size` of all selected people, never the raw row count.
- Selected attendees render below the input as removable `.chip.removable` (X to remove).

### Day Rail and Pagination

- Horizontal snap rail. Edge gradient masks fade in when more content exists left/right of the viewport.
- Mobile only: pagination dots below the rail. The active dot uses `--fg` (not accent) and scales slightly. Hidden on `min-width: 700px`.
- Mobile column width = 100%; desktop column width = 320px (`grid-auto-columns`).
- Mobile hides the horizontal scrollbar on `.day-rail` (`scrollbar-width: none` + WebKit display none) — pagination dots are the navigation affordance there. Desktop keeps the thin scrollbar.
- A `.board-foot` container holds the pagination row and a small localized `.board-attribution` line with Luca Schlomski credit. The attribution is intentionally low-contrast (font-size ~11px, opacity 0.5, `user-select: none`) — present on every board view but never demanding attention.
- Desktop layout: `.board-foot` is taken out of grid flow (`position: absolute; bottom: 10px; pointer-events: none`) so the rail extends to the screen edge and the horizontal scrollbar sits at the very bottom; the attribution floats just above the scrollbar. `.day-rail` gets `padding-bottom: var(--s-5)` so the column's `.meal-list` bottom border clears the attribution text (padding inside `.meal-list` would only push content, not the border).
- Mobile layout: `.board-foot` stays in normal grid flow (rail scrollbar is hidden there). Pagination dots and attribution are intentionally small and faint — dots `6×6px` (`var(--border)` inactive, `var(--fg-muted)` active with `scale(1.2)`), gap `6px`, attribution font-size `9px`, with symmetric compact spacing — so they read as a faint position indicator, not chrome.

### Mobile Zoom Policy

Pinch and double-tap zoom are explicitly disabled across the app:

- Viewport meta in `index.html` sets `maximum-scale=1.0, user-scalable=no`.
- iOS Safari ignores the meta, so `src/main.tsx` also blocks `gesturestart` / `gesturechange` / `gestureend`, sub-300ms repeated `touchend` (double-tap), and `wheel` events with `ctrlKey`.
- `touch-action: manipulation` on `html` and `body`.
- Inputs ≥16px on mobile to suppress iOS focus-zoom.

This violates **WCAG 1.4.4 (Resize text)**. Accepted trade-off, recorded here. If accessibility audits become a requirement, drop `user-scalable=no` and rely on layout overflow handling alone.

### Landing Screen (root `/`)

The root path renders a brand-led hero, not a panel:

- Eyebrow row with an accent dot and the uppercase product name.
- Localized large title.
- Localized one-sentence product summary.
- CTA hint: pill-styled `<code>/b/&lt;slug&gt;</code>` showing how to open a board.
- Localized attribution line with **Luca Schlomski**.
- Soft accent radial glow behind the hero. Subtle fade-up entrance animation.

This is the only screen where accent is allowed decoratively. Do not propagate this exception to other pages.

### Login Screens

Login screens (board unlock, admin login) stay neutral and minimal: panel + slug pill (board only) + password field + plain submit. Do not surface the board name pre-auth — keeps the human-readable label behind the password and avoids leaking it past the slug already visible in the URL.

### Iconography Examples (current usage)

- `ChefHat` — cook subtitle on meal cards.
- `Sun` / `Moon` — theme toggle.
- `ChevronDown` — attendee picker open affordance.
- `X` — chip remove and modal close.
- `Plus` / `Minus` — stepper.
- `Trash2` — destructive triggers.

Stick to lucide icons. If a needed icon is missing, prefer composing from existing lucide primitives over importing another library.
