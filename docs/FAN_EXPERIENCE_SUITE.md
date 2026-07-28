# ファン体験スイート 実装記録

## 公開情報

- 本番サイト: https://sushiusa.net
- 初回公開PR: https://github.com/project-norops/otsukimi-tools/pull/13
- 初回マージコミット: `8d668600621e36bb4ebb5bf4b21a61760c339101`
- 初回公開日: 2026-07-29

## サービスと固定ルート

| サービス | ルート | 役割 |
| --- | --- | --- |
| 推し枠パスポート | `/tools/oshi-passport` | 思い出ミッションとグレード進化 |
| 月末ファン表彰式 | `/tools/fan-awards` | 表彰カード作成とPNG保存 |
| IRIAM企画リレー | `/tools/project-relay` | 走者・日程・完走状態の管理 |
| 返礼・特典かんばん | `/tools/reward-board` | 返礼の進行管理 |

4サービスは `src/data/tools.ts` の `homeToolIds` 先頭に、この順序で掲載する。
トップページから外したり、`in_development` に戻したりしない。

## パスポートのグレード契約

| グレード | 必要な達成数 | 次のグレード |
| --- | ---: | --- |
| BRONZE | 0 | 3 |
| SILVER | 3 | 6 |
| GOLD | 6 | 10 |
| AURORA | 10 | 最高グレード |

現在のカードに加えて、次グレードの実物プレビューと残り達成数を表示する。
この「次が見える」導線は継続利用の中核仕様として維持する。

## データとプライバシー

- 入力内容は `sushiusa:fan-guild:v1` のキーでブラウザの `localStorage` に保存する。
- IRIAM API、外部API、独自サーバーへ入力内容を送信しない。
- パスポートと表彰カードのPNGはブラウザ内のCanvasで生成する。

## 主な実装ファイル

- `src/components/fan-guild-suite.tsx`
- `src/app/fan-guild.css`
- `src/lib/fan-guild.ts`
- `src/lib/fan-guild.test.ts`
- `src/data/tools.ts`

## デグレ防止

`src/lib/tool-portal.test.ts` で、次の条件を固定する。

1. 4サービスすべてが `available` であること。
2. 各サービスの公開ルートが変わっていないこと。
3. トップページの先頭4枠に指定順で残っていること。
