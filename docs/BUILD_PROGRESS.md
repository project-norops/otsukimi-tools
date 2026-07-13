# Build Progress

- Current status: Planner guide and current-state input copy refinements complete and pushed
- Completed: Existing MVP and QA fixes; iOS input-focus zoom prevention; compact three-step planner guide; guide step 1 now includes liver name and debut date; `表示名` is presented as `ライバー名`; debut-date input explains anniversary/calendar behavior with a mobile-safe wrapping note; simulation and anniversary calculations are unchanged
- In progress: None
- Next: Confirm guide density and memo focus behavior on a physical iPhone
- Tests: `npm run check` passed (63/63 unit tests, typecheck, lint, production build); guide placement/copy, debut-date note, and mobile wrapping regression tests pass
- Known issues: Automated visual browser review remains unavailable because no browser backend was present; mobile layout is covered by static regression guards pending physical-device review
- Blockers: None
- Vercel project: `otsukimi-tools` (`prj_sbH9SH1S7Vn8YiF7Ucf8mYL6iMIe`)
- Preview deployment: `dpl_H956theUzwCwfYC5bVqucwjsZxDP` (`READY`)
- Preview URL: https://otsukimi-tools-fevvjia5l-norops.vercel.app
- Git deployment note: Vercel's existing Git settings automatically classify `main` pushes as Production; no manual `--prod` command was run.
- Last updated: 2026-07-14
