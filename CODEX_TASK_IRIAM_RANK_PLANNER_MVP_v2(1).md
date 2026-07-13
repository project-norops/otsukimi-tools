# Codex Task — IRIAM Rank Planner MVP / Unattended Build

## Current
新規の小型Webサービス群「おつきみつーるず」を作る。
仕様は `IRIAM_RANK_PLANNER_MVP_SPEC.md` を唯一のMVP基準とする。

Repository root:
`C:\dev\otsukimi-tools`

Architecture:
- single repository
- single Next.js app
- monorepoにしない
- tool別repositoryに分けない
- mini productは`/tools/...` routeとして追加する

## Task
仕様書に従い、「おつきみつーるず」ポータルと、その第1弾であるスマホ優先のIRIAM非公式ランク計画シミュレーターMVPを、MVP完成条件を満たすまで自律実装する。

作業開始直後に `docs/BUILD_PROGRESS.md` を作成し、主要工程ごとに更新する。
利用上限・セッション中断・コンテキスト圧縮等から再開する場合は、仕様書・本タスク・`docs/BUILD_PROGRESS.md` を読み、repository実体を確認して未完了地点から続行する。

途中承認は不要。
P0 / P1で停止せず、実装・テスト・修正を継続する。

MVP完成・品質チェック成功後は、project boundaryを確認し、
おつきみつーるず専用Git repositoryへのcommit / push、
おつきみつーるず専用Vercel projectへのpreview deployまで自律実行する。

最終報告はpreview URL取得後に行う。
ただしGitHub remoteまたはVercel専用projectの未設定・未認証により安全に継続できない場合は、その地点でのみ停止して最終報告する。

## Execution order
1. `C:\dev\otsukimi-tools` をrepository rootとして確認
2. `docs/BUILD_PROGRESS.md` を作成または読み、現在地点を確認し、必要なら単一Next.js appの最小構成を作成
2. types
3. rank rules
4. skip-pass rules / manual skip-pass grant
5. anniversary generator
6. simulator
7. unit tests
8. tool metadata / audience category navigation
9. おつきみつーるず portal / tool cards
10. initial input UI
11. 3-month calendar
12. day edit bottom sheet
13. warnings
14. ICS export
15. monthly PNG/share image
16. disclaimer
17. PWA / manifest / app icon / standalone verification
18. mobile-first UI polish
19. full quality check
20. failing tests / type errors / lint errors / build errorsを修正
21. MVP完成条件を再確認
22. project boundary check
23. git repository / remote safety check
24. commit
25. dedicated GitHub remoteへpush
26. Vercel project link safety check
27. dedicated Vercel projectへpreview deploy
28. preview URL確認
29. 最終報告

## Hard rules
- 公式IRIAM連携を実装しない
- OCRを実装しない
- DBを追加しない
- 認証を追加しない
- 決済を追加しない
- AI/APIを追加しない
- IRIAM公式UI・ロゴ・背景を模倣しない
- オリジナルキャラクター・マスコットを追加しない
- 計算ロジックをUIコンポーネントに埋め込まない
- 仕様にない機能を勝手に追加しない
- tool別repositoryを作らない
- monorepo化しない
- 別Next.js appを追加しない
- `rankcalender` の綴りを使用しない。正式slugは `rank-calendar`
- 開発中ステータスのツール本体を実装しない
- 開発中カードから未実装routeへの壊れたリンクを作らない
- ライバー向け / リスナー向けのツール定義をUI内で二重管理しない
- 両対象ツールは共通metadataから両カテゴリーへ表示する
- ルール値は将来変更可能な形で集中管理する
- 3か月連続シミュレーションのテストを必ず作る
- 記念日生成ロジックを独立関数として実装し、テストする
- 通常の週次スキパ付与と臨時スキパ付与を別データとして保持する
- 臨時スキパ付与の同日加算・上限10枚・再計算をテストする
- production domain設定をしない
- paid serviceを追加しない
- 品質チェックを回避しない
- PWAはホーム画面追加とstandalone表示を目的とし、ネイティブアプリ化しない
- PWAのためだけに複雑なoffline-first実装を追加しない
- install導線でツール利用を妨げない
- app iconへIRIAM / NOROPS / CiteRootのブランド要素を流用しない
- `docs/BUILD_PROGRESS.md` を主要工程ごとに更新する
- 再開時は仕様書・本タスク・`docs/BUILD_PROGRESS.md` を読み、repository実体と照合する
- 中断後に最初から作り直さない
- 未確認項目を進捗上のCompletedにしない
- NOROPS / CiteRoot repositoryを変更しない
- `C:\dev\norops` 配下を編集しない
- NOROPS / CiteRootのgit remoteへpushしない
- NOROPS / CiteRootのVercel projectへlink / deployしない
- NOROPS / CiteRootのenvironment variablesを参照・転用しない
- Git / Vercel操作前にproject boundary checkを必ず行う
- dedicated GitHub remoteが安全に確認できない場合はpushしない
- dedicated Vercel projectが安全に確認できない場合はdeployしない
- production deployは行わない。preview deployのみ



## Resume protocol
このタスクが新規セッションまたは中断後に再実行された場合：

1. `IRIAM_RANK_PLANNER_MVP_SPEC.md` を読む
2. `CODEX_TASK_IRIAM_RANK_PLANNER_MVP.md` を読む
3. `docs/BUILD_PROGRESS.md` を読む
4. git status / current files / package scripts / testsを確認
5. `BUILD_PROGRESS.md` とrepository実体を照合
6. 完了済み工程を飛ばし、未完了地点から続行

`BUILD_PROGRESS.md` が存在しない場合は新規作成する。
進捗ファイルよりrepository実体とテスト結果を優先する。

## Project boundary check
Git / Vercel操作前に必ず以下を確認する。

1. current working directory
2. `git rev-parse --show-toplevel`
3. `git remote -v`
4. Vercel project link information

期待値：
- repository root: `C:\dev\otsukimi-tools`
- GitHub repository: おつきみつーるず専用repository
- Vercel project: おつきみつーるず専用project

推奨名：
- GitHub repository: `otsukimi-tools`
- Vercel project: `otsukimi-tools`

NOROPS / CiteRootを示すrepository、remote、project、pathが1つでも検出された場合：
- commitしない
- pushしない
- deployしない
- NOROPS / CiteRoot側を修正しない
- 最終報告でblocking issueとして明示する

専用GitHub remoteまたは専用Vercel projectが未設定・未認証の場合も、
別projectを推測して流用せず、安全に停止する。

## Autonomous behavior
実装中に軽微な技術判断が必要な場合は、以下の優先順位で自律判断する。

1. 仕様書
2. 正しい計算
3. mobile-first usability
4. 保守性
5. 実装の単純さ

仕様の意味を変えない範囲のUI・内部設計判断は自律実行してよい。

依存パッケージ追加は必要最小限とする。
同等の機能を標準APIまたは既存依存で実装できる場合、新規依存を追加しない。

問題が発生した場合：
- 原因を調査
- 最小修正
- 再テスト

を繰り返す。

重大な仕様矛盾により実装不能な場合のみ停止する。
単なる実装難易度・テスト失敗・型エラーでは停止しない。

## Acceptance

PWA acceptance:
- Web App Manifestが有効
- `display: standalone`
- おつきみつーるず専用app icon設定済み
- portal / liver / listener / rank-calendarがPWA起動時も利用可能
- PWA設定を含めtest / typecheck / lint / build成功

Preview deployment acceptance:
- NOROPS / CiteRootとrepository / remote / Vercel projectが完全分離されている
- dedicated GitHub repositoryへpush済み、または未設定理由を明示
- dedicated Vercel projectへpreview deploy済み、または未設定理由を明示
- production deployは未実施
- production domain設定は未実施

Repository / route acceptance:
- repository rootは `C:\dev\otsukimi-tools`
- `/` はportal
- `/liver` はライバー向け一覧
- `/listener` はリスナー向け一覧
- `/tools/rank-calendar` は第1弾tool
- tool metadataは共通data sourceから管理
- 未開発tool routeは作成しない

`IRIAM_RANK_PLANNER_MVP_SPEC.md` の以下を全て満たすこと。

- 必須テスト
- MVP完成条件
- UI・ビジュアルデザイン方針
- 非公式サービス表記

少なくとも以下を成功させる。
- test
- typecheck
- lint
- production build

既存project script名が異なる場合は、package.jsonを確認して同等チェックを実行する。

## Final report
MVP完成後のみ、以下の形式で簡潔に報告する。

### Result
完成 / 未完成

### Preview
preview URL
取得できない場合は理由

### Implemented
主要実装のみ

### Tests
実行コマンドと結果

### Files changed
主要ファイルのみ

### Known issues
なければ `None`

### Progress file
`docs/BUILD_PROGRESS.md` の最終status

### Manual review
人間がスマホで確認すべき項目を最大5件

### Next recommendation
1件のみ

完成条件を満たすまで、途中報告のために停止しない。
preview URL取得まで自律実行する。
ただしproject分離、安全なGit remote、安全なVercel projectを確認できない場合のみ停止する。
