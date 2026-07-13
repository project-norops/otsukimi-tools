# Build Progress

- Current status: Cross-cell rank period bands complete, pushed, and deployed to Vercel Preview
- Completed: Existing MVP and mobile fixes; daily rank chips replaced by cross-cell rank period bands; rank bands split on rank changes, week boundaries, and month boundaries; continuation edge styling; matching PNG band rendering
- In progress: None
- Next: Confirm rank period band appearance on a physical mobile device
- Tests: `npm run check` passed (29/29 unit tests, typecheck, lint, production build); rank change/week crossing/month crossing band tests pass; local `/`, `/liver`, `/listener`, `/tools/rank-calendar` all returned HTTP 200
- Known issues: Automated visual browser review remains unavailable because no browser backend was present
- Blockers: None
- Vercel project: `otsukimi-tools` (`prj_sbH9SH1S7Vn8YiF7Ucf8mYL6iMIe`)
- Preview deployment: `dpl_12YNxiUEJT5HcEgR4ihfx5SJW9vc` (`READY`)
- Preview URL: https://otsukimi-tools-mper84pm4-norops.vercel.app
- Git deployment note: Vercel's existing Git settings automatically classify `main` pushes as Production; no manual `--prod` command was run.
- Last updated: 2026-07-14
