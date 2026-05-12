# Simple Meal Plan

Shared meal-planning board for trips and holidays. Each day is a column, meals are cards.

Stack: Cloudflare Pages + Functions + D1. React 18, TypeScript, Vite 5.

## Quick Start

```
npm install
npm run db:migrate:local
npm run db:seed:local
npm run dev:cf
```

Create a `.dev.vars` file (gitignored):

```
ADMIN_PASSWORD=admin
SESSION_SIGNING_KEY=dev-session-key
TURNSTILE_SECRET_KEY=dev-secret
```

Create a `.env.local` file for Vite-exposed build-time values:

```
VITE_TURNSTILE_SITE_KEY=dev-site-key
```

Local server at `http://localhost:8788`. Demo board: `/b/echo-harbor-amber` (password: `demo123`).

## Documentation

| File | Purpose |
|---|---|
| **[architecture.md](architecture.md)** | Platform, data model, API endpoints, authentication, D1 migrations, deployment workflow. |
| **[ui.md](ui.md)** | Visual design system: tokens, colors, spacing, accent strategy, buttons, typography, iconography, layout conventions. |

## Deployment

| Environment | Command | URL |
|---|---|---|
| Local | `npm run dev:cf` | `localhost:8788` |
| Preview | `npm run deploy:preview` | `preview.simple-meal-plan.pages.dev` |
| Production | `git push origin main` | `simple-meal-plan.pages.dev` |

## Key Scripts

| Script | Purpose |
|---|---|
| `npm run dev:cf` | Full local Cloudflare stack |
| `npm run build` | TypeScript + Vite production build |
| `npm run check` | Type-check only |
| `npm run test` | Run tests |
| `npm run deploy:preview` | Build and deploy to preview |
| `npm run db:migrate:local` | Apply D1 migrations locally |
| `npm run db:migrate:preview` | Apply D1 migrations to preview (remote) |
| `npm run db:migrate:prod` | Apply D1 migrations to production (remote) |

---

## Design Decisions

Rules that must not be changed without updating this file.

### Native Dialog Ban

Do not call `window.alert`, `window.confirm`, or `window.prompt`. Always use `Toast`, `ConfirmInline`, and `InlineEdit` respectively. Keeps interactions theme-consistent and testable.

### i18n Architecture

- Whole-app language switching: English (`en`, default) and German (`de`).
- Persisted in `localStorage` under `mp_language`. Root `<html lang>` attribute updated on change.
- Source of truth for all user-facing strings: `src/lib/i18n.ts`.
  - Use `t(language, key, params?)` for raw strings.
  - Use `mealTypeLabel(language, type)` for meal type labels.
  - Do not inline visible UI text in components.
- Components that render visible text receive `language` as a prop. No global i18n context beyond `useLanguage` in `App.tsx`.
- `LanguageToggle` appears beside `ThemeToggle` everywhere theme controls appear. One-click EN/DE toggle, no dropdown.

### Locale and Dates

- Dates use `en-GB` for English and `de-DE` for German. Both keep European day-month-year order.
- Storage format: `YYYY-MM-DD`, no timezone.
- `fmtDate` and friends in `src/lib/dates.ts` accept `language` and use `timeZone: "UTC"` so date-only values stay stable across DST.
- `relativeDayLabel(date, language)` provides language-aware relative labels (today/tomorrow/yesterday/in-N-days).
- `DatePicker` component is hybrid: touch devices use native `<input type="date">`, desktop renders a typed field + portalled `react-day-picker` calendar with locale and Monday-first weeks. Always speaks `YYYY-MM-DD` to parent.

### Component Contracts

Reusable building blocks in `src/components/`. Reuse before creating new components.

| Component | Contract |
|---|---|
| `Toast` + `ToastProvider` | `useToast()` exposes `showSuccess` / `showError`. Replaces `alert()`. Auto-dismiss: success/info 2s, error 4s. No close button. |
| `InlineEdit` | Click-to-edit text. Replaces `prompt()`. Auto-focus, blur commits, Esc cancels. |
| `ConfirmInline` | Popover destructive confirm. Replaces `confirm()`. |
| `Stepper` | Numeric +/− control for `group_size`. |
| `SegmentedControl` | Type-tinted segmented selector for meal types. |
| `DatePicker` | Hybrid touch/desktop date picker. Keyboard accepts `dd/mm/yyyy`, `dd.mm.yyyy`, `dd-mm-yyyy`, or `ddmmyyyy`. Enter commits, blur commits. Invalid input left in place. |
| `Topbar` | Sticky top bar with scroll-aware bottom border. Title + right-side actions. |
| `ThemeToggle` | Icon-only light/dark toggle, language-aware labels. |
| `LanguageToggle` | One-click EN/DE toggle. |

Hooks in `src/hooks/`:

| Hook | Purpose |
|---|---|
| `useTheme` | Light/dark with localStorage + `prefers-color-scheme` |
| `useLanguage` | EN/DE with localStorage + `<html lang>` update |
| `useFocusTrap` | Traps Tab focus inside an element (modals) |
| `useOutsideClick` | Closes popovers/dropdowns on outside click |

### Modal Behaviour

- All modals trap focus via `useFocusTrap`.
- Modals close via backdrop click or the footer Cancel/Done button. No X button in the header.
- Exception: the board admin modal uses a top-right X and no footer because its content is long and not a submit-once flow.
- Esc closes the modal. Cmd/Ctrl+Enter submits. Plain Enter inside any single-line field submits.
- Nested popovers (attendee dropdown, confirm popover, date picker calendar) intercept Esc with `stopPropagation()`. Closing a nested popover must not close the surrounding modal. Press Esc twice to exit the modal from a nested popover.
- Meal modal renders all fields by default. No progressive disclosure.
- Meal modal field order (top to bottom): meal name, type, cook, date, attendees, notes.
- Destructive actions inside modals use `ConfirmInline`, never native `confirm`.

### Board Creation and Admin

- Root `/` starts invisible Turnstile verification on page load. Public board creation opens in a modal and stays disabled until verification returns a token.
- Public board creation requires Turnstile verification. Root `/admin` board creation is protected by global admin auth and does not use Turnstile.
- `/admin` is overview-only after login: create, open, metadata, delete. It does not edit board properties or people.
- The board gear button opens a board admin modal from an unlocked board. It edits board name, board password, optional board-admin password, people, and can delete the board.
- Board admin access uses the board cookie until a board-admin password is set; after that it requires both the board cookie and the board-admin cookie.

### Meal Card Behaviour

- Head row: meal-type badge (left) + attendee count (right). Count is hidden when 0.
- Title: meal name + cook subtitle with `ChefHat` icon (same row).
- Attendee chips: cap 20 per card. Overflow renders as `+N` chip. Never display `×N` group counts.
- Empty meal name shows localized placeholder text.

### Attendee Picker Behaviour

- Multi-select with searchable dropdown and checkmarks.
- Keyboard: ↑/↓ navigate, Enter toggles selection, Esc closes.
- Select all / Clear all toggle operates on the entire person list, not the current search filter.
- Visible attendee count is the weighted sum of `group_size`.
- Selected attendees shown as removable chips below the input.
- Outside-click closes via `useOutsideClick`.

### Toast Behaviour

- Rendered via `ToastProvider` wrapping the app in `src/main.tsx`. All components access it via `useToast()`.
- API: `showSuccess(message)`, `showError(message)`, and low-level `show(kind, message)`.
- Auto-dismiss: success/info 2s, error 4s. No close button.
- Position: fixed bottom-center, glass-accent style with `backdrop-filter: blur(12px)`.
- Icons: `CheckCircle2` for success/info, `AlertCircle` for error.
- Container element uses `role="status"` and `aria-live="polite"`.

### `api()` Helper Contract

- All API calls use the `api<T>(path, init?)` helper in `src/lib/api.ts`.
- Always sets `Content-Type: application/json` and `credentials: "include"`.
- Throws `Error` on non-ok response, with the server's `error` field as the message.
- Generic: returns `Promise<T>`. Callers type the expected response shape.

### Hook Contracts

| Hook | Detail |
|---|---|
| `useTheme` | Persists to `localStorage` key `mp_theme`. Follows `prefers-color-scheme` on first visit. |
| `useLanguage` | Persists to `localStorage` key `mp_language`. Updates `<html lang>`. |
| `useFocusTrap` | Skips elements with `data-focus-skip` attribute. Restores focus to the active element from before the trap activated on unmount. |
| `useOutsideClick` | Registers on `mousedown` (not `click`), so it fires before other click handlers. |

### Theme and Language Toggle Placement

- On lock/login/landing screens: toggles go in `.corner-actions` (absolute top-right).
- On authenticated pages (board, admin): toggles go in `Topbar` right side.
- The pair always appears together, never separately.

### `ConfirmInline` Behaviour

- Accepts `popDir?: "up" | "down"`. Use `"up"` in modal footers to avoid clipping against `overflow: hidden`.
- On open, focuses the Cancel button, not the destructive action.
- Esc handler calls `e.stopPropagation()` — closing the confirm does not close the surrounding modal.

### `MealModal` Key Remount Pattern

The modal uses `key={editing?.id || createDate || "new"}` to force React to unmount and remount when switching between create and edit. Any new modal that switches between create/edit modes must follow this pattern.

### Board Page Empty State

When a board has no meals, `visibleDays` falls back to `[{ date: todayIsoDate(), meals: [] }]` — showing a single empty today column. This ensures new boards always render something.
