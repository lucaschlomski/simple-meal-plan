# AGENTS.md

## Map

- Rules/behavior: `README.md` Design Decisions.
- Platform/API/auth/D1/deploy: `architecture.md`.
- Visual system: `ui.md`.

## Rules

- Ask before changing software design or README Design Decisions.
- Do not change component contracts, modal behavior, i18n, dialog/date/locale rules without approval.
- Remove stale code when refactoring.
- Run Gray Scribe after substantial changes.
- Verify with `npm run check && npm run build && npm run test`.

## Key Paths

- Frontend: `src/components/`, `src/hooks/`, `src/board/`, `src/admin/`, `src/styles.css`.
- Shared libs: `src/lib/types.ts`, `i18n.ts`, `dates.ts`, `api.ts`.
- Backend: `functions/api/`, `functions/lib/`, `db/migrations/`.
