import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const component = readFileSync(
  new URL("../components/rank-planner.tsx", import.meta.url),
  "utf8",
);
const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

describe("planner guide", () => {
  it("appears between the page introduction and current-state form", () => {
    const introduction = component.indexOf('className="tool-intro"');
    const guide = component.indexOf('className="planner-guide"');
    const setup = component.indexOf('className="setup-card"');

    expect(introduction).toBeGreaterThan(-1);
    expect(guide).toBeGreaterThan(introduction);
    expect(setup).toBeGreaterThan(guide);
  });

  it("includes the three steps and brief supporting notes", () => {
    expect(component).toContain("現在のランク・累計スコア・スキパ所持数を入力");
    expect(component).toContain("予定スコア・SKIP・記念日・メモを設定");
    expect(component).toContain("PNG保存またはカレンダーへ追加");
    expect(component).toContain("入力変更後はランク推移を自動再計算します。");
    expect(component).toContain("「SP+1」はスキパ付与を表します。");
    expect(component).toContain("IRIAM公式とは関係ありません。");
  });

  it("uses shrinkable columns and a compact single-column mobile layout", () => {
    expect(css).toContain(".planner-guide");
    expect(css).toContain("repeat(3, minmax(0, 1fr))");
    expect(css).toMatch(
      /@media \(max-width: 560px\)[\s\S]*?\.planner-guide ol\s*\{[\s\S]*?grid-template-columns: minmax\(0, 1fr\)/,
    );
  });
});
