# Build Progress

- Current status: Compact rank-planner usage guide complete and ready to push
- Completed: Existing MVP and QA fixes; iOS input-focus zoom prevention; initial planner screen now shows a compact three-step guide before current-state input, including automatic recalculation, `SP+1`, and unofficial-tool notes; mobile guide collapses to a compact shrinkable single column
- In progress: Commit and push
- Next: Confirm guide density and memo focus behavior on a physical iPhone
- Tests: `npm run check` passed (62/62 unit tests, typecheck, lint, production build); guide placement, required copy, and mobile layout regression tests pass; local `/tools/rank-calendar` returned HTTP 200
- Known issues: Automated visual browser review remains unavailable because no browser backend was present; mobile layout is covered by static regression guards pending physical-device review
- Blockers: None
- Vercel project: `otsukimi-tools` (`prj_sbH9SH1S7Vn8YiF7Ucf8mYL6iMIe`)
- Preview deployment: `dpl_H956theUzwCwfYC5bVqucwjsZxDP` (`READY`)
- Preview URL: https://otsukimi-tools-fevvjia5l-norops.vercel.app
- Git deployment note: Vercel's existing Git settings automatically classify `main` pushes as Production; no manual `--prod` command was run.
- Last updated: 2026-07-14
