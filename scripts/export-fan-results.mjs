import { writeFileSync } from "node:fs";
import { fanTools } from "../src/lib/fan-tools.ts";

const escapeCell = (value) => String(value ?? "").replaceAll("|", "\\|").replaceAll("\n", "<br>");
const lines = [
  "# 月乃美玲・つきみっこ向けミニコンテンツ 結果文言レビュー表",
  "",
  "> 公開前に人間が全件を確認してください。修正は `src/lib/fan-tools.ts` の各テキストテーブルで行います。",
  "",
];

for (const config of Object.values(fanTools)) {
  lines.push(`## ${config.name}`, "", `全 ${config.results.length} 件`, "", "| 結果ID | 条件・判定キー | 表示タイトル | 表示本文 | シェア文 | 重み | 特殊条件 |", "|---|---|---|---|---|---:|---|");
  for (const result of config.results) {
    lines.push(`| ${[result.id, result.key, result.title, result.body, result.share, result.weight, result.special].map(escapeCell).join(" | ")} |`);
  }
  lines.push("");
}

writeFileSync(new URL("../docs/FAN_RESULTS_REVIEW.md", import.meta.url), `${lines.join("\n")}\n`, "utf8");
console.log(`Exported ${Object.values(fanTools).reduce((sum, tool) => sum + tool.results.length, 0)} results.`);
