# Build Progress

- Current status: MVP locally complete; dedicated GitHub remote confirmed; commit/push in progress
- Completed: Next.js scaffold; types; centralized rank and skip-pass rules; manual grants; anniversary generator; 3-month simulator; 12 unit tests; metadata-driven portal and category pages; planner setup, calendar, bottom sheet, warnings; ICS and monthly PNG export; disclaimer; manifest and dedicated icon
- In progress: Commit and push to `https://github.com/project-norops/otsukimi-tools.git`
- Next: Confirm or configure the dedicated Vercel project, then preview deploy
- Tests: `npm run check` passed (12/12 unit tests, typecheck, lint, production build); `/` and `/tools/rank-calendar` returned HTTP 200; automated visual browser review unavailable because no browser backend was present
- Known issues: Dedicated Vercel project is not configured
- Blockers: `.vercel/project.json` absent; preview deploy remains blocked until a dedicated Vercel project is safely confirmed.
- Last updated: 2026-07-14
