# SimpleMealPlan — Design System

> Updated with brand identity (logo + lockups). Everything else preserved from your original spec.

## Brand

### Logo — "Crescent bowl"
A bowl viewed at an angle. The filled crescent is the bowl wall (`--fg`); the inner void is the bowl's mouth, traced with a thin **lilac** rim (`--accent`).

The accent is the **only** color the mark uses besides ink/paper, and it auto-swaps to the mode-appropriate lilac (`#8b6fd6` light → `#b29ef2` dark) so the logo follows the same `prefers-color-scheme` rules as the rest of the UI.

### Logo files
Every deliverable ships in explicit **`-light`** / **`-dark`** variants so they render reliably under any embedding (`<img>`, `<object>`, inline, CSS `background-image`).

| File | Use |
|---|---|
| `logo/crescent-light.svg` / `logo/crescent-dark.svg` | Primary mark |
| `logo/crescent-bold-light.svg` / `logo/crescent-bold-dark.svg` | Thicker rim variant · use for sizes ≤ 32px |
| `logo/favicon.svg` | Auto-mode favicon (`prefers-color-scheme` swap) · use only via `<link rel="icon">` |
| `logo/favicon-light.svg` / `logo/favicon-dark.svg` | Explicit favicons · use with `<link media="(prefers-color-scheme: light)">` |
| `logo/lockup-horizontal-light.svg` / `-dark.svg` | Mark + stacked wordmark beside it |
| `logo/lockup-inline-light.svg` / `-dark.svg` | Mark + one-line wordmark (navbar) |
| `logo/lockup-stacked-light.svg` / `-dark.svg` | Mark above wordmark (hero/marketing) |
| `logo/app-icon-light.svg` / `logo/app-icon-dark.svg` | 1024² rounded-square app icon |

> **Why no auto-mode versions for the marks and lockups?** SVGs loaded via `<img src>` are rendered in a strict mode where `@media (prefers-color-scheme)` queries are unreliable. Shipping explicit `-light` and `-dark` files removes ambiguity. Use them inside `<picture>` or swap with a CSS class.

### Logo construction
- **Mark geometry:** outer circle `r=42` at `(50,50)`, masked by an inner circle `r=34` at `(62,50)`. A 4-unit lilac stroke traces the inner circle.
- **Wordmark:** Inter Tight, "Simple" 600 + "MealPlan" 300, `letter-spacing: -0.01em`. Stacked or inline depending on lockup.
- **App icon:** rounded square, radius = 22% of canvas edge. Two variants — `app-icon-light.svg` (paper `#f7f8fa` bg, dark `#0f131c` crescent, lilac `#8b6fd6` rim) and `app-icon-dark.svg` (ink `#0c1018` bg, light `#f3f6fa` crescent, lilac `#b29ef2` rim). The dark variant is the primary/default; iOS 18+ and Android themed icons can serve both based on OS appearance.

### Logo rules
1. Never recolor the filled crescent — it is always `--fg`.
2. Never recolor the rim — it is always `--accent`.
3. Never place the mark on a lilac background (the rim disappears). Use ink fill app icon instead.
4. Minimum clear-space around the lockup: ½ the height of the crescent.
5. Below 32px, use the `crescent-bold-*` files. Below 20px, use the `favicon-*` files.

### HTML / CSS lockup
For text rendering at known font-load time, prefer HTML over the lockup SVGs:

```html
<a href="/" class="smp-logo">
  <picture>
    <source srcset="/brand/logo/crescent-dark.svg" media="(prefers-color-scheme: dark)" />
    <img src="/brand/logo/crescent-light.svg" alt="" width="28" height="28" />
  </picture>
  <span><strong>Simple</strong>MealPlan</span>
</a>
```

```css
.smp-logo { display: inline-flex; align-items: center; gap: 10px; color: var(--fg); text-decoration: none; }
.smp-logo span { font-family: 'Inter Tight', var(--font-sans); font-size: 17px; font-weight: 300; letter-spacing: -0.01em; }
.smp-logo strong { font-weight: 600; }
```

---

## Typography

| Token | Value |
|---|---|
| `--font-sans` | `'Inter Tight', ui-sans-serif, -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` |
| `--font-mono` | `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace` |

> Inter Tight is the brand wordmark face and is now the head of `--font-sans`. Load it from Google Fonts (`Inter+Tight:wght@300;400;500;600;700`) or self-host. The fallback chain keeps existing Inter installs working.

### Type Scale
| Token | Size |
|---|---|
| `--text-xs` | 12px |
| `--text-sm` | 13px |
| `--text-base` | 15px |
| `--text-md` | 17px |
| `--text-lg` | 20px |
| `--text-xl` | 24px |

### Letter Spacing
| Token | Value |
|---|---|
| `--tracking-tight` | `-0.01em` |
| `--tracking-normal` | `0` |
| `--tracking-wide` | `0.04em` |

---

## Colors

### Neutral Ramp
| Token | Light | Dark |
|---|---|---|
| `--gray-50` | `#f7f8fa` | `#11151c` |
| `--gray-100` | `#f0f2f6` | `#161b25` |
| `--gray-200` | `#e4e8ee` | `#232a37` |
| `--gray-300` | `#d4dae3` | `#303949` |
| `--gray-400` | `#a3acba` | `#515c70` |
| `--gray-500` | `#6c7686` | `#8a96aa` |
| `--gray-600` | `#4b5363` | `#b3becf` |
| `--gray-700` | `#323a48` | `#d2dae5` |
| `--gray-800` | `#1f2532` | `#e6ecf3` |
| `--gray-900` | `#0f131c` | `#f3f6fa` |

### Accent Ramp (Lilac)
| Token | Light | Dark |
|---|---|---|
| `--accent-50` | `#f3efff` | `#20183a` |
| `--accent-100` | `#e3daff` | `#2c2349` |
| `--accent-300` | `#c0aef5` | `#c0aff7` |
| `--accent-500` | `#8b6fd6` | `#b29ef2` |
| `--accent-600` | `#6e54b8` | `#c5b5f7` |
| `--accent-700` | `#4f3b8c` | `#d6cbfa` |

### Semantic Tokens
| Token | Light | Dark |
|---|---|---|
| `--bg` | `#f7f8fa` | `#0c1018` |
| `--fg` | `#0f131c` | `#f3f6fa` |
| `--fg-muted` | `#6c7686` | `#8a96aa` |
| `--panel` | `#ffffff` | `#1d2433` |
| `--panel-soft` | `#f0f2f6` | `#232b3d` |
| `--surface` | `#f0f2f6` | `#11151e` |
| `--border` | `#e4e8ee` | `#262e3d` |
| `--border-strong` | `#d4dae3` | `#34405a` |
| `--accent` | `#8b6fd6` | `#b29ef2` |
| `--accent-fg` | `#ffffff` | `#1b1235` |
| `--accent-soft` | `#f3efff` | `rgba(178,158,242,0.14)` |
| `--danger` | `#c0314c` | `#ff8499` |
| `--danger-soft` | `#fdecef` | `rgba(255,132,153,0.12)` |

### Meal Type Tints
| Type | Background | Foreground |
|---|---|---|
| Breakfast | `#fff0c7` / `rgba(245,166,35,0.24)` | `#7c3f00` / `#ffd27a` |
| Lunch | `#d4f4df` / `rgba(34,197,94,0.24)` | `#075f3c` / `#86efac` |
| Dinner | `#d7e8ff` / `rgba(59,130,246,0.34)` | `#174aa6` / `#bfdbfe` |
| Other | `#fde0ef` / `rgba(236,72,153,0.26)` | `#842356` / `#f9a8d4` |

---

## Spacing
| Token | Value |
|---|---|
| `--s-1` | 4px |
| `--s-2` | 8px |
| `--s-3` | 12px |
| `--s-4` | 16px |
| `--s-5` | 24px |
| `--s-6` | 32px |
| `--s-7` | 48px |

---

## Border Radius
| Token | Value |
|---|---|
| `--r-sm` | 8px |
| `--r-md` | 12px |
| `--r-lg` | 16px |
| `--r-pill` | 999px |

---

## Motion
| Token | Value |
|---|---|
| `--ease-out` | `cubic-bezier(0.2, 0.8, 0.2, 1)` |
| `--d-fast` | 120ms |
| `--d-mid` | 180ms |
| `--d-slow` | 240ms |

---

## Shadows
| Token | Value |
|---|---|
| `--shadow-sm` | `0 1px 2px rgba(15,19,28,.04), 0 1px 1px rgba(15,19,28,.03)` |
| `--shadow-md` | `0 4px 12px rgba(15,19,28,.06), 0 1px 3px rgba(15,19,28,.04)` |
| `--shadow-pop` | `0 12px 32px rgba(15,19,28,.10), 0 2px 6px rgba(15,19,28,.06)` |

---

## Principles

**Accent is a state signal, not a brand color.** On functional surfaces it is reserved for focus rings, selected state, "today" indicators, and **the logo rim**. The landing page is the only other surface where it appears decoratively (glow, dot, CTA border).

**Primary action = neutral filled.** `.btn.primary` uses `--fg` background and `--bg` text — not accent. This keeps accent meaningful as a state signal.

**Touch targets minimum 44px.** All interactive elements (buttons, inputs, stepper, person rows) enforce `min-height: 44px`.

**Mobile breakpoint: 700px.** Below this: single-column layout, no backdrop dim on modals, static topbar, scrollbar hidden on day rail (pagination dots replace it).
