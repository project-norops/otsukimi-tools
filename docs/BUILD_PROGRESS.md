# Build Progress

- Current status: Wisher承認済みの匿名ページ利用計測を実装し、公開前検証中
- Actor: AI agent（Codex）
- Target: `https://sushiusa.net`、特に `/tools/rank-calendar`
- Completed: Vercel Web Analytics v2のページビュー収集、全ページ共通の説明、`/privacy`、計画入力を送信しない静的境界テストを追加
- Changed artifacts: `package.json`、`package-lock.json`、`src/app/layout.tsx`、`src/app/privacy/page.tsx`、`src/app/globals.css`、`src/lib/analytics-privacy.test.ts`、`docs/BUILD_PROGRESS.md`
- Measurement baseline: 2026-08-20時点のランク管理カレンダー匿名訪問者数・閲覧数は未計測。Search Console 2026-07-23〜08-19は表示14・クリック0
- KPI / target: Production限定で14日間観測し、`/tools/rank-calendar`の匿名訪問者3以上を複数利用候補の最小基準とする
- Stop condition: 入力内容・ライバー名・共有URLの内容が送信される、Production以外が混入する、または費用が発生する場合は計測を停止する
- Privacy boundary: ページ、参照元、日時、地域、端末・OS・ブラウザの匿名集計だけ。計画、ランク、スコア、メモ、ライバー名、保存・共有・PNG・ICS操作は送信しない
- Cost / scope: Vercel Hobbyの無料枠内。カスタムイベント、GA4、Cookie、認証、データベース、広告、支出を追加しない
- Checks: `npm run check` passed (135 tests, typecheck, lint, production build); `git diff --check` passed
- Result: Local implementation complete; GitHub main、Vercel Production、公開URL確認はpending
- Owner: Sushiusa Team / Measurement Steward
- Next review: Production反映から14日後、または匿名訪問者3以上の確認時
- Vercel project: `otsukimi-tools` (`prj_sbH9SH1S7Vn8YiF7Ucf8mYL6iMIe`)
- Last updated: 2026-08-20T13:03:00+09:00
