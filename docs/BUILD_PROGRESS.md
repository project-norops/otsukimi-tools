# Build Progress

- Current status: Mobile select, rank tier colors, weekday colors, and first-week SKIP regression coverage complete; commit, push, and Preview verification in progress
- Completed: Existing MVP and mobile fixes; native finite selects; shared rank-tier palette; actual-date Sunday/Saturday coloring shared with PNG; invalid SKIP distinction; valid first-week SKIP extension verified for month-mid/month-start/week-mid/month-crossing plus weekly/manual grants
- In progress: Commit, push, and updated Preview verification
- Next: Confirm native select behavior on a physical mobile device
- Tests: `npm run check` passed (46/46 unit tests, typecheck, lint, production build); weekday/month-start and SKIP timing regression tests pass
- Known issues: Automated visual browser review remains unavailable because no browser backend was present
- Blockers: None
- Vercel project: `otsukimi-tools` (`prj_sbH9SH1S7Vn8YiF7Ucf8mYL6iMIe`)
- Preview deployment: `dpl_12YNxiUEJT5HcEgR4ihfx5SJW9vc` (`READY`)
- Preview URL: https://otsukimi-tools-mper84pm4-norops.vercel.app
- Git deployment note: Vercel's existing Git settings automatically classify `main` pushes as Production; no manual `--prod` command was run.
- Last updated: 2026-07-14
