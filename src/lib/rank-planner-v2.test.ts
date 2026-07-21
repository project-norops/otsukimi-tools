import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const component = readFileSync(
  new URL("../components/rank-planner.tsx", import.meta.url),
  "utf8",
);

describe("IRIAM rank calendar v2 UI contract", () => {
  it("keeps settings on the same screen and exposes one to three months", () => {
    expect(component).toContain("IRIAMランク管理カレンダー");
    expect(component).toContain('className="planner-settings"');
    expect(component).toContain("[1, 2, 3]");
    expect(component).not.toContain("[1, 2, 3, 4, 5, 6]");
    expect(component).not.toContain("setStarted(false)");
  });

  it("keeps the existing skip-pass holding limit at 10", () => {
    expect(component).toContain("numberOptions(10).map((passes)");
    expect(component).not.toContain("numberOptions(20).map((passes)");
  });

  it("shows full display months while disabling dates outside the simulation", () => {
    expect(component).toContain("displayMonths.map");
    expect(component).toContain("disabled={!day}");
    expect(component).toContain("シミュレーション期間外");
  });

  it("requires confirmation and clears only daily plans", () => {
    expect(component).toContain('<h2 id="reset-warning-title">注意</h2>');
    expect(component).not.toContain("危険な操作");
    expect(component).toContain("カレンダーを一括リセット");
    expect(component).toContain("カレンダーをリセットしますか？");
    expect(component).toContain("setPlans({})");
    expect(component).not.toMatch(/resetCalendar[\s\S]{0,200}setInput/);
    expect(component).toContain("resetCancelRef");
  });
});
