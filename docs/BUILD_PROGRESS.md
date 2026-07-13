# Build Progress

- Current status: Cross-cell rank period bands complete; commit, push, and Preview verification in progress
- Completed: Existing MVP and mobile fixes; daily rank chips replaced by cross-cell rank period bands; rank bands split on rank changes, week boundaries, and month boundaries; continuation edge styling; matching PNG band rendering
- In progress: Commit, push, and updated Preview verification
- Next: Confirm rank period bands on the updated mobile Preview
- Tests: `npm run check` passed (29/29 unit tests, typecheck, lint, production build); rank change/week crossing/month crossing band tests pass; local `/`, `/liver`, `/listener`, `/tools/rank-calendar` all returned HTTP 200
- Known issues: Automated visual browser review remains unavailable because no browser backend was present
- Blockers: None
- Vercel project: `otsukimi-tools` (`prj_sbH9SH1S7Vn8YiF7Ucf8mYL6iMIe`)
- Preview deployment: `dpl_6foUUTsTV9Th8eMaRkzQv8fVhAv7` (`READY`)
- Preview URL: https://otsukimi-tools-93li6m2vz-norops.vercel.app
- Git deployment note: Vercel's existing Git settings automatically classify `main` pushes as Production; no manual `--prod` command was run.
- Last updated: 2026-07-14
