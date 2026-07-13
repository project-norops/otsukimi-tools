# Build Progress

- Current status: MVP complete and pushed to dedicated GitHub repository; Vercel preview blocked by missing project link
- Completed: Next.js scaffold; types; centralized rank and skip-pass rules; manual grants; anniversary generator; 3-month simulator; 12 unit tests; metadata-driven portal and category pages; planner setup, calendar, bottom sheet, warnings; ICS and monthly PNG export; disclaimer; manifest and dedicated icon
- In progress: None
- Next: Confirm or configure the dedicated `otsukimi-tools` Vercel project, then preview deploy
- Tests: `npm run check` passed (12/12 unit tests, typecheck, lint, production build); `/` and `/tools/rank-calendar` returned HTTP 200; automated visual browser review unavailable because no browser backend was present
- Known issues: Dedicated Vercel project is not configured
- Blockers: `.vercel/project.json` absent; preview deploy remains blocked until a dedicated Vercel project is safely confirmed.
- Last updated: 2026-07-14
