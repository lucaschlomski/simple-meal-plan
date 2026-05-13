# Simple Meal Plan

Shared meal-planning board for trips and holidays. Each day is a column, meals are cards — everyone with the link and password can add, edit, and organise meals together.

**Live:** [simple-meal-plan.com](https://simple-meal-plan.com)

## Stack

Cloudflare Pages + Functions + D1 · React 18 · TypeScript · Vite 5

## Self-hosting

```sh
npm install
npm run db:migrate:local
npm run db:seed:local
npm run dev:cf          # → http://localhost:8788
```

Create `.dev.vars` in the project root (gitignored):

```
ADMIN_PASSWORD=admin
SESSION_SIGNING_KEY=dev-session-key
TURNSTILE_SECRET_KEY=your-turnstile-secret-key
VITE_TURNSTILE_SITE_KEY=your-turnstile-site-key
```

Demo boards:
- `http://localhost:8788/b/echo-harbor-amber` · password `demo123` (seed data)
- `http://localhost:8788/b/demo-meal-planner` · no password (public read/write, reset data)

Demo board settings are immutable: board name, board password, admin password,
and board deletion are blocked. People/groups and meals remain editable.

Daily demo reset is handled by a dedicated scheduled Worker in
`workers/demo-reset/` (cron: `0 3 * * *` UTC).

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev:cf` | Full local Cloudflare stack |
| `npm run build` | Type-check + build |
| `npm run test` | Run tests |
| `npm run deploy:preview` | Build + deploy to preview |
| `npm run db:migrate:local` | Apply migrations to local D1 |
| `npm run db:migrate:preview` | Apply migrations to preview D1 |
| `npm run db:migrate:prod` | Apply migrations to production D1 |
| `npm run db:demo:local` | Reset demo board on local D1 |
| `npm run db:demo:preview` | Reset demo board on preview D1 |
| `npm run db:demo:prod` | Reset demo board on production D1 |
| `npm run demo-reset:deploy:prod` | Deploy daily demo reset worker (prod) |

Full deployment workflow in [architecture.md](architecture.md).

## Docs

| File | Contents |
|---|---|
| [architecture.md](architecture.md) | Platform, data model, API, auth, i18n, deployment |
| [ui.md](ui.md) | Design system, tokens, components, layout patterns |
| [design.md](design.md) | Brand identity, logo, color tokens |

## License

MIT © 2026 Luca Schlomski
