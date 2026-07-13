# Build Progress

- Current status: Mobile UI fixes and rank progress enhancements complete, pushed, and deployed to Vercel Preview
- Completed: Next.js scaffold; centralized rules and 3-month simulator; metadata-driven portal; planner and exports; PWA; mobile bottom-sheet weekly grant setting fix; daily start-of-day rank chips; nearest rank-decision summary; simplified action errors; current rank and keep/up progress cards; 18 unit tests
- In progress: None
- Next: Human review at 375px on the updated Preview URL
- Tests: `npm run check` passed (18/18 unit tests, typecheck, lint, production build); 375px mobile constraints reviewed in CSS (`min-width`, fixed checkbox width, `88dvh` scroll area, single-column manual grants)
- Known issues: Automated visual browser review remains unavailable because no browser backend was present
- Blockers: None
- Vercel project: `otsukimi-tools` (`prj_sbH9SH1S7Vn8YiF7Ucf8mYL6iMIe`)
- Preview deployment: `dpl_GU1QF3BfRkvbHAdG8c5WM8NeMBuH` (`READY`)
- Preview URL: https://otsukimi-tools-p7w6f65z6-norops.vercel.app
- Git deployment note: Vercel's existing Git settings automatically classify `main` pushes as Production; no manual `--prod` command was run.
- Last updated: 2026-07-14
