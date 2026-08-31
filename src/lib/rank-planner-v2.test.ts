import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const component = readFileSync(
  new URL("../components/rank-planner.tsx", import.meta.url),
  "utf8",
);
const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

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

  it("uses the on-screen badge colors for monthly PNG plan and rank-event labels", () => {
    expect(component).toContain('1: { background: "#ffe6a7", text: "#6b4700" }');
    expect(component).toContain('2: { background: "#cfe4ff", text: "#234f7d" }');
    expect(component).toContain('4: { background: "#ffb3d0", text: "#7d2345" }');
    expect(component).toContain('6: { background: "#c72f5b", text: "#fff" }');
    expect(component).toContain('skip: { background: "#e4f0eb", text: "#276837" }');
    expect(component).toContain('"rank-chip up": { background: "#fce2e8", text: "#b62e54" }');
    expect(component).toContain('"rank-chip keep": { background: "#e4f0eb", text: "#276837" }');
    expect(component).toContain('"rank-chip down": { background: "#fff0df", text: "#9c5618" }');
    expect(component).toContain("drawPngBadge(ctx, planLabel");
    expect(component).toContain("drawPngBadge(ctx, event.compact");
    expect(component).toContain('if (event.className === "grant-chip")');
    expect(component).toContain('ctx.fillStyle = "#555"');
    expect(component).toContain("PNG_PRIMARY_LABEL_FONT_SIZE = 20");
    expect(component).toContain("PNG_RANK_BAND_HEIGHT = 28");
    expect(css).toMatch(/\.value-1\s*\{[^}]*#ffe6a7[^}]*#6b4700/);
    expect(css).toMatch(/\.value-2\s*\{[^}]*#cfe4ff[^}]*#234f7d/);
    expect(css).toMatch(/\.value-4\s*\{[^}]*#ffb3d0[^}]*#7d2345/);
    expect(css).toMatch(/\.value-6\s*\{[^}]*#c72f5b[^}]*#fff/);
    expect(css).toMatch(/\.value-skip\s*\{[^}]*var\(--light-green\)[^}]*#276837/);
    expect(css).toMatch(/\.rank-chip\.up\s*\{[^}]*var\(--soft-pink\)[^}]*#b62e54/);
    expect(css).toMatch(/\.rank-chip\.keep\s*\{[^}]*var\(--light-green\)[^}]*#276837/);
    expect(css).toMatch(/\.rank-chip\.down\s*\{[^}]*#fff0df[^}]*#9c5618/);
  });
});
