# smartfeed Project Instructions

## API & Environment

- **Backend API**: Use `NEXT_PUBLIC_API_URL` environment variable (NEVER hardcode URLs)
  - **Testing**: https://localhost:8000/docs (OpenAPI: https://localhost:8000/openapi.json)
  - **Production**: https://localhost:8000/docs (OpenAPI: https://localhost:8000/openapi.json)
- **Docs**: ALWAYS check the api docs before adding/editing endpoints — they might be updated recently

## UI/UX Standards

- **Design System**: ALWAYS use Shadcn/ui blocks/components (MCP available - search before building)
- **Colors**: ONLY use color variables from `@globals.css` (NEVER create new colors or hardcode hex values)
- **Components**: Do not duplicate components. Always reuse or extend existing ones (e.g. one login, one item card for all cases).

## Development Workflow

- **Dev Server**: Check if already running before executing `npm run dev` — if it's running on port 3000 and you really need to run it again (to check logs or something else), kill the port 3000 before running it.
- **E2E Testing**: ALWAYS check `@tests/README.md` before creating/validating E2E tests
- **Daily Progress**: After completing relevant tasks, update `DAILY_PROGRESS.md` with a short, non-technical summary for managers. Format: "Oct 24 - Today's Progress:" with bullet points. Most recent day first. Check if task exists for current day before adding/updating. Keep each item short, max 50 chars. Always check what is the current day in Madrid.

## Git & Version Control

- **Commits**: NEVER commit without user confirmation
- **Commit Messages**: ALWAYS use short 1-line messages
- **Story Corrections**: When using correct-course, NEVER edit existing stories (preserve history)

## Timezones

- **UTC**: ALWAYS send dates/times to the backend in UTC. Users see times in their local timezone; backend handles all times in UTC. Convert local time → UTC when sending, and UTC → local time when displaying.
