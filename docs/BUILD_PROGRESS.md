# Build Progress

- Current status: Mobile compact event labels and two-line calendar memos complete; commit, push, and Preview verification in progress
- Completed: Existing MVP and QA fixes; fixed mobile event labels (`SP+N`, `アップ`, `キープ`, `ダウン`); full labels retained on wider screens; normalized two-line memo previews; matching compact events and memo excerpts in PNG
- In progress: Commit, push, and updated Preview verification
- Next: Confirm multiple events and memo rendering on a physical mobile device
- Tests: `npm run check` passed (53/53 unit tests, typecheck, lint, production build); compact labels, multiple events, blank/normalized memo, long two-line memo, and mobile CSS guards pass
- Known issues: Automated visual browser review remains unavailable because no browser backend was present
- Blockers: None
- Vercel project: `otsukimi-tools` (`prj_sbH9SH1S7Vn8YiF7Ucf8mYL6iMIe`)
- Preview deployment: `dpl_HChPtVhYwZK7Q574KUiafCVgMZ7v` (`READY`)
- Preview URL: https://otsukimi-tools-2ukvrl7d3-norops.vercel.app
- Git deployment note: Vercel's existing Git settings automatically classify `main` pushes as Production; no manual `--prod` command was run.
- Last updated: 2026-07-14
