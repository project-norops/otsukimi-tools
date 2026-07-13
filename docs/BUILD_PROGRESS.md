# Build Progress

- Current status: Mobile width/overflow and calendar sharing fixes complete, pushed, and deployed to Vercel Preview
- Completed: Existing MVP; mobile bottom-sheet fix; daily rank chips and rank progress; viewport-safe shrinkable grid/flex layout; 320/375/390/430px CSS regression guards; user-facing calendar add action with Web Share file support and download fallback
- In progress: None
- Next: Review the updated Preview on physical iPhone at 320–430px widths
- Tests: `npm run check` passed (26/26 unit tests, typecheck, lint, production build); local `/`, `/liver`, `/listener`, `/tools/rank-calendar` all returned HTTP 200
- Known issues: Automated visual browser review remains unavailable because no browser backend was present
- Blockers: None
- Vercel project: `otsukimi-tools` (`prj_sbH9SH1S7Vn8YiF7Ucf8mYL6iMIe`)
- Preview deployment: `dpl_6foUUTsTV9Th8eMaRkzQv8fVhAv7` (`READY`)
- Preview URL: https://otsukimi-tools-93li6m2vz-norops.vercel.app
- Git deployment note: Vercel's existing Git settings automatically classify `main` pushes as Production; no manual `--prod` command was run.
- Last updated: 2026-07-14
