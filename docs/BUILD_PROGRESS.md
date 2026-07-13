# Build Progress

- Current status: iOS WebKit input-focus zoom prevention complete, pushed, and deployed to Vercel Preview
- Completed: Existing MVP and QA fixes; skip grant memo removed from type and UI; scrollable sheet body with dvh/safe-area sticky footer; simulation decision totals; editable mobile `input` and `textarea` fields use a 16px font size to prevent focus zoom in iOS Safari/Chrome
- In progress: None
- Next: Confirm memo focus behavior on physical iPhone in Safari and Chrome
- Tests: `npm run check` passed (59/59 unit tests, typecheck, lint, production build); mobile CSS regression verifies editable `input` and `textarea` font size is at least 16px
- Known issues: Automated visual browser review remains unavailable because no browser backend was present
- Blockers: None
- Vercel project: `otsukimi-tools` (`prj_sbH9SH1S7Vn8YiF7Ucf8mYL6iMIe`)
- Preview deployment: `dpl_H956theUzwCwfYC5bVqucwjsZxDP` (`READY`)
- Preview URL: https://otsukimi-tools-fevvjia5l-norops.vercel.app
- Git deployment note: Vercel's existing Git settings automatically classify `main` pushes as Production; no manual `--prod` command was run.
- Last updated: 2026-07-14
