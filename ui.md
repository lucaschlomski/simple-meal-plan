# UI Design System

This file defines the visual design language of the app. All new UI must follow these rules. If implementation diverges, update this file in the same change.

## Product Scope

- Goal: Simple Meal Plan — shared meal planning for trips and holidays with a Kanban-style board.
- Each day is one column.
- Meals are cards inside each day column.
- Card shows: meal name (can be empty), meal type badge, cook text, attendee chips, attendee count (sum of group sizes). Count is hidden when 0.

## Screen Layout Patterns

### Theme and Language Toggle Placement

- **Lock/login/landing screens**: both toggles in `.corner-actions` (absolute top-right of the center shell).
- **Authenticated pages (board, admin)**: both toggles in the `Topbar` right-side slot.
- The pair always appears together, never separately.

### Edge Masks

- Left/right gradient masks on the day rail that fade in when content exists off-screen.
- Desktop: 36px wide, opacity 1 when visible.
- Mobile: 20px wide, opacity 0.45 when visible.
- Triggered when `scrollLeft > 4px` (left) or `scrollLeft < max - 4px` (right).
- Transition: `--d-mid` (180ms) ease-out.

### Toast

- Position: `fixed` bottom-center, `--s-6` (32px) from bottom.
- Style: glass-accent with `backdrop-filter: blur(12px)`, transparent background.
- Icons: `CheckCircle2` (success/info) and `AlertCircle` (error).
- Container: `role="status"`, `aria-live="polite"`.
- No close button — auto-dismiss only.

## Layout Conventions

### Board View

- Horizontal snap-scroll rail on all viewport sizes.
- Desktop: day columns at 320px fixed width (`grid-auto-columns`) — multiple days partially visible.
- Mobile: columns at 100% width. Horizontal scrollbar hidden (`scrollbar-width: none` + `-webkit-scrollbar` display none). Pagination dots provide navigation affordance.

### Admin Page

- Single cohesive panel layout (no split dashboard). `admin-stack` capped at 880px.
- Compact create-board form at top (name, password, submit).
- Boards displayed as table rows: Name, Slug, Actions (Manage / Open).
- "Manage" opens `BoardManageModal` as a popover, not inline.
- Empty-state placeholder when zero boards exist.
- Person rows use stacked Up/Down chevron buttons for reorder.
- Accent suppressed on admin: plain buttons, neutral inline-edit borders.

### Landing Screen (root `/`)

Brand-led hero, not a panel:

- Eyebrow row with accent dot and uppercase product name (**Simple Meal Plan**).
- Localized large title.
- Localized one-sentence product summary.
- CTA hint: pill-styled `<code>/b/<slug></code>`.
- Brand attribution: "Simple Meal Plan by **Luca Schlomski**" (localized connector).
- Soft accent radial glow behind hero. Subtle fade-up entrance animation.

This is the only screen where accent is allowed decoratively. Do not propagate this exception to other pages.

### Login Screens

Minimal: panel + slug pill (board only) + password field + plain submit. Do not surface the board name pre-auth.

### Column Headers

- Weekday name (e.g. "Thursday") with date below in European day-month-year order (`23 May 2026`).
- Today's column carries a "Today" pill. Non-today columns show a relative label ("In 3 days", "1 day ago").

### Day Rail and Pagination

- Horizontal snap rail with edge gradient masks that fade in when content exists off-screen.
- Mobile-only pagination dots below the rail. Active dot uses `--fg` (not accent) with slight scale-up. Dots `6×6px`, gap `6px`. Hidden on `min-width: 700px`.
- `.board-foot` container: pagination row + small localized attribution line. Attribution is intentionally low-contrast (~11px, opacity 0.5, `user-select: none`).
- Desktop: `.board-foot` positioned `absolute` at bottom so the rail extends to screen edge and the horizontal scrollbar sits at the very bottom. Rail gets `padding-bottom: var(--s-5)` so column borders clear the attribution text.
- Mobile: `.board-foot` stays in normal flow (scrollbar hidden). Dots and attribution are tiny and faint — dots `6×6px`, attribution `9px`.

## Night Mode

- Light/dark theme via `data-theme` attribute on `:root`.
- Toggle on landing page, board unlock, board topbar, admin login, admin topbar.
- Theme stored in `localStorage`. Default follows `prefers-color-scheme` on first visit.

## Design Tokens

All tokens defined in `src/styles.css`. Reference tokens — never hard-code colors, spacing, radii, or motion durations.

### Type Scale

- `--text-xs` (0.75rem) through `--text-xl` (1.5rem)
- `--font-sans`: system UI font stack
- `--font-mono`: system monospace stack
- No web fonts.

### Spacing

`--s-1` (4px), `--s-2` (8px), `--s-3` (12px), `--s-4` (16px), `--s-5` (24px), `--s-6` (32px), `--s-7` (48px)

### Radii

`--r-sm` (8px), `--r-md` (12px), `--r-lg` (16px), `--r-pill` (999px)

### Motion

`--d-fast` (120ms), `--d-mid` (180ms), `--d-slow` (240ms). Ease: `--ease-out`. All animation respects `prefers-reduced-motion`.

### Color Ramps

**Neutrals**: `--gray-50` through `--gray-900`. Semantic aliases:
- `--bg`, `--fg`, `--fg-muted`
- `--panel`, `--panel-soft`, `--surface`
- `--border`, `--border-strong`

**Accent (lilac)**: `--accent-50` through `--accent-700`. Semantic:
- `--accent`, `--accent-fg`, `--accent-soft`

**Danger**: `--danger` and `--danger-soft` — used for destructive actions and error states.

**Type tints**: per-meal-type bg/fg pairs (`--type-breakfast-*`, `--type-lunch-*`, `--type-dinner-*`, `--type-other-*`) drive badges and segmented controls.

**Dark mode**: triggered by `:root[data-theme="dark"]`. All tokens swap under the same variable names.

### Shadows

| Token | Usage |
|---|---|
| `--shadow-sm` | Subtle elevation (cards, tooltips) |
| `--shadow-md` | Medium elevation (panels) |
| `--shadow-pop` | High elevation (modals, popovers) |

Dark mode provides heavier shadow values.

### Z-Index Layering

New overlay components must pick a tier from this stack:

| Layer | Z-index |
|---|---|
| Topbar | 5 |
| Edge mask, board attribution | 2–3 |
| Confirm popover | 30 |
| Modal backdrop | 50 |
| Picker dropdown | 60 |
| Date picker backdrop | 70 |
| Toast region | 100 |

### Touch Targets

All `.btn`, `.field`, and `.add-card` use `min-height: 44px` — the WCAG minimum touch target (2.5.5). New interactive elements must follow this.

### Reduced Motion

When the user's OS requests reduced motion (`prefers-reduced-motion: reduce`), all CSS transitions and animations are zeroed to 0.001ms, effectively disabling them. Every animation must be defined with a `@media (prefers-reduced-motion: no-preference)` guard or equivalent.

## Accent Strategy

The accent (lilac) is a state signal, not a default fill. Reserved surfaces:

- `:focus-visible` outline
- Localized current-day pill on day column
- `.person-row.selected` row + checkmark
- `.add-card` hover
- `.toast` glass-accent border (errors switch to danger)
- Landing screen `.landing-dot` and `.landing-glow` (root path only)

Buttons must not use accent fills. Card chrome, headers, body, default buttons, and inline-edit borders are all neutral. Adding a new accent surface requires approval.

## Buttons

### `.btn` (default)
Transparent background, `--border-strong` border, `--fg` text, `--panel-soft` hover. Use for almost every button.

### `.btn.primary`
Filled with `--fg` background, `--bg` text. The only emphasis variant. Reserved for the single most prominent action of a flow. Currently only on **MealModal Save**. Adding a second `.primary` per screen requires approval.

### `.btn.danger`
Reserved for destructive confirms (`ConfirmInline` red action).

### `.btn.icon` / `.btn.icon.ghost-quiet`
Icon-only controls. Transparent base, panel-soft hover. `.ghost-quiet` removes the border.

### `.btn.ghost`
No-op alias retained for legacy markup (identical to default `.btn`).

## Iconography

- **Library**: `lucide-react` only. No inline SVG, no other icon libraries.
- If a needed icon is missing, compose from existing lucide primitives.

**Current icon assignments:**

| Icon | Usage |
|---|---|
| `ChefHat` | Cook subtitle on meal cards |
| `Sun` / `Moon` | Theme toggle |
| `Languages` | Language toggle |
| `ChevronDown` | Attendee picker open affordance |
| `X` | Chip remove, modal close |
| `Plus` / `Minus` | Stepper controls |
| `Trash2` | Destructive triggers |

## Typography

- Font: system sans-serif stack. Do not introduce Inter or any web font.
- Headings: `--tracking-tight`.
- Body: `line-height: 1.5`.
- Mobile (`max-width: 699px`): `.field` and `.inline-edit-input` clamped to `font-size: 16px` to suppress iOS focus-zoom.

## Modal Visual Specs

- `.modal-backdrop`: fixed fullscreen, `rgba(7, 12, 22, 0.5)` dim. On mobile (`max-width: 699px`) backdrop is transparent — dim clashes with browser/OS header bars.
- `.modal`: `width: min(640px, 100%)`, `max-height: calc(100dvh - var(--s-5))`, panel background, `--shadow-pop`.
- `.modal-content`: `overflow-x: hidden`, `min-width: 0` on itself and direct children — prevents horizontal scroll.
- Field order in meal modal (top to bottom): meal name, type, cook + date (two-col row), attendees, notes.
- Cook and date: single row at `min-width: 700px` via `.form-row.two-col` (single column on mobile).
- iOS `<input type="date">`: intrinsic min-width handled via `appearance: none`, `-webkit-min-logical-width: 0`, `min-width: 0`.

## Meal Card Visual Structure

- Head row: meal-type `.badge` (left) + attendee `.count` (right).
- Title group: meal name (`--text-lg`, prominent) + cook subtitle with `ChefHat` icon (inline with name, not separate row).
- Attendee chips at bottom: `.chips.chips-sm` variant. Cap 20 chips per card; overflow renders as `+N` chip. Chip labels never display `×N` group counts.

## Attendee Picker Visual

- Chevron toggle inside the input opens the picker dropdown.
- Selected attendees render below the input as removable `.chip.removable` (X to remove).
- Person rows: grid with checkmark box + name + group size.
- Checkmark box: `18×18px`, border `1.5px solid var(--border-strong)`. Selected: filled with accent.
- The visible counter displays the weighted sum of `group_size` of all selected people.
- Label row shows attendee count pill: `--accent-soft` background, `--accent-600`/`--accent-700` text.

## Mobile Zoom Policy

Pinch and double-tap zoom are explicitly disabled:

- Viewport meta: `maximum-scale=1.0, user-scalable=no`.
- iOS Safari: `gesturestart`/`gesturechange`/`gestureend` blocked, sub-300ms `touchend` blocked, `wheel` with `ctrlKey` blocked.
- `touch-action: manipulation` on `html` and `body`.
- Inputs ≥16px on mobile to suppress iOS focus-zoom.

This violates **WCAG 1.4.4 (Resize text)**. Accepted trade-off. If accessibility audits become a requirement, drop `user-scalable=no` and rely on layout overflow handling alone.
