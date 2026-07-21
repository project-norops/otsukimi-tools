import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const component = readFileSync(
  new URL("../components/rank-planner.tsx", import.meta.url),
  "utf8",
);
const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

describe("planner guide", () => {
  it("appears between the page introduction and current-state form", () => {
    const introduction = component.indexOf('className="planner-intro"');
    const guide = component.indexOf('className="planner-guide"');
    const setup = component.indexOf('className="planner-settings"');

    expect(introduction).toBeGreaterThan(-1);
    expect(guide).toBeGreaterThan(introduction);
    expect(setup).toBeGreaterThan(guide);
  });

  it("includes the three steps and brief supporting notes", () => {
    expect(component).toContain(
      "現在のランク・スコア・スキパ数等を入力",
    );
    expect(component).toContain("カレンダーの日付をタップして、スコアやスキパの予定、メモを入力");
    expect(component).toContain("PNG保存またはカレンダーへ追加");
    expect(component).toContain("入力変更後はランク推移を自動再計算します。");
    expect(component).toContain("「スキパ+1、SP+1」は定期的に自動で付与されるスキップパスの増加を表しています。");
    expect(component).not.toContain("毎日配信する想定の初期値");
    expect(component).toContain("IRIAM運営会社とは関係ありません。");
  });

  it("keeps settings visible and explains future optional plans", () => {
    expect(component).toContain("ライバー名");
    expect(component).toContain("デビュー日（任意）");
    expect(component).toContain("シミュレーション期間");
    expect(component).toContain("simulationMonthOptions");
    expect(component).toContain("現在はすべて無料");
    expect(component).toContain("有料オプション（プレミアムプラン等）");
    expect(component).not.toContain("ベータ期間中");
    expect(component).toContain("あと0日（当日）");
    expect(component).toContain("`あと${days}日`");
    expect(component).toContain("入力するとアニバーサリーやゾロ目日（デビュー100日目、111日目）等の記念日が表示されます。");
  });

  it("uses shrinkable columns and a compact single-column mobile layout", () => {
    expect(css).toContain(".planner-guide");
    expect(css).toContain("repeat(3, minmax(0, 1fr))");
    expect(css).toMatch(/\.planner-guide ol\s*\{[\s\S]*?list-style: none;/);
    expect(css).toMatch(/\.planner-guide li\s*\{[\s\S]*?display: flex;/);
    expect(css).toMatch(
      /@media \(max-width: 560px\)[\s\S]*?\.planner-guide ol\s*\{[\s\S]*?grid-template-columns: minmax\(0, 1fr\)/,
    );
  });
});
