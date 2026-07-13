# Build Progress

- Current status: Mobile width/overflow and calendar sharing fixes complete; commit, push, and Vercel verification in progress
- Completed: Existing MVP; mobile bottom-sheet fix; daily rank chips and rank progress; viewport-safe shrinkable grid/flex layout; 320/375/390/430px CSS regression guards; user-facing calendar add action with Web Share file support and download fallback
- In progress: Commit, push, and updated Preview verification
- Next: Confirm the updated Preview is READY and review on physical iPhone
- Tests: `npm run check` passed (26/26 unit tests, typecheck, lint, production build); local `/`, `/liver`, `/listener`, `/tools/rank-calendar` all returned HTTP 200
- Known issues: Automated visual browser review remains unavailable because no browser backend was present
- Blockers: None
- Vercel project: `otsukimi-tools` (`prj_sbH9SH1S7Vn8YiF7Ucf8mYL6iMIe`)
- Preview deployment: `dpl_GU1QF3BfRkvbHAdG8c5WM8NeMBuH` (`READY`)
- Preview URL: https://otsukimi-tools-p7w6f65z6-norops.vercel.app
- Git deployment note: Vercel's existing Git settings automatically classify `main` pushes as Production; no manual `--prod` command was run.
- Last updated: 2026-07-14
