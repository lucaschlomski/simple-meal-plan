# AGENTS.md

## Documentation Map

| What | Where |
|---|---|
| Behavioral rules — component contracts, modal behaviour, i18n, dialogs | `README.md` — Design Decisions |
| Platform, data model, API endpoints, auth, deployments, D1 | `architecture.md` |
| Visual design — tokens, colors, buttons, typography, layout, z-index | `ui.md` |

## Rules

### Ask before changing software design

Any change to a rule in `README.md` Design Decisions requires explicit approval. Do not modify component contracts, modal behaviour, i18n architecture, the native dialog ban, or date/locale handling without asking first.

### Remove stale code

When refactoring, delete functions, variables, CSS classes, and imports that are no longer referenced anywhere. Leave nothing behind.

### Keep documentation current

Periodically run Gray Scribe to sync documentation with the codebase. After substantial changes, let it update `README.md`, `architecture.md`, and `ui.md` so they stay accurate.

## Verification

Before considering any change complete, run:

```
npm run check && npm run build && npm run test
```

All three must pass.

## Key Paths

| Path | Purpose |
|---|---|
| `src/lib/types.ts` | Shared types |
| `src/lib/i18n.ts` | All user-facing strings (`t()`, `mealTypeLabel()`) |
| `src/lib/dates.ts` | Date formatting and locale utilities |
| `src/lib/api.ts` | API call helper |
| `src/styles.css` | All CSS tokens and styles |
| `src/components/` | Reusable components |
| `src/hooks/` | Shared hooks |
| `src/board/` | Board page and sub-components |
| `src/admin/` | Admin page and manage modal |
| `functions/api/` | API endpoints |
| `functions/lib/` | Backend utilities |
| `db/migrations/` | D1 schema migrations |
