# Build Progress

- Current status: Bottom-sheet sticky action footer and decision-score display complete, pushed, and deployed to Vercel Preview
- Completed: Existing MVP and QA fixes; skip grant memo removed from type and UI; scrollable sheet body with dvh/safe-area sticky footer; simulation now exposes pre-reset decision totals; decision days show total/result and next-period score separately
- In progress: None
- Next: Confirm sticky save action with a short viewport and on-screen keyboard on physical iPhone
- Tests: `npm run check` passed (58/58 unit tests, typecheck, lint, production build); 18-point up, 12-point keep, 11-point down, and SKIP-extended decision total regressions pass
- Known issues: Automated visual browser review remains unavailable because no browser backend was present
- Blockers: None
- Vercel project: `otsukimi-tools` (`prj_sbH9SH1S7Vn8YiF7Ucf8mYL6iMIe`)
- Preview deployment: `dpl_22WXP7uuK8zj4yZsQxAFJcErRe5v` (`READY`)
- Preview URL: https://otsukimi-tools-hkm9cj7nd-norops.vercel.app
- Git deployment note: Vercel's existing Git settings automatically classify `main` pushes as Production; no manual `--prod` command was run.
- Last updated: 2026-07-14
