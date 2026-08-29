import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { extractRankBonus, weeklyBonusColors, weeklyDateColor, weeklyShareFilename } from "./liver-planner-image";

describe("weekly planner share image", () => {
  it("uses a recognizable Japanese filename with the first date", () => {
    expect(weeklyShareFilename("2026-08-25")).toBe("配信予定_2026-08-25.png");
  });
  it("extracts the plus value from an IRIAM plan", () => {
    expect(extractRankBonus("IRIAM (+6)")).toBe("6");
    expect(extractRankBonus("IRIAM（休み）")).toBeUndefined();
  });
  it("colors weekdays black, Saturdays blue, and Sundays or Japanese holidays red", () => {
    expect(weeklyDateColor("2026-07-24")).toBe("#35251f");
    expect(weeklyDateColor("2026-07-25")).toBe("#2f6fc2");
    expect(weeklyDateColor("2026-07-26")).toBe("#d94747");
    expect(weeklyDateColor("2026-08-11")).toBe("#d94747");
    expect(weeklyDateColor("2026-05-06")).toBe("#d94747");
  });
  it("uses the same bonus colors as the rank calendar", () => {
    expect(weeklyBonusColors("1")).toEqual({ background: "#ffe6a7", text: "#6b4700" });
    expect(weeklyBonusColors("2")).toEqual({ background: "#cfe4ff", text: "#234f7d" });
    expect(weeklyBonusColors("4")).toEqual({ background: "#ffb3d0", text: "#7d2345" });
    expect(weeklyBonusColors("6")).toEqual({ background: "#c72f5b", text: "#fff" });
  });
  it("keeps private liver tasks out of the weekly listener image", () => {
    const component = readFileSync(new URL("../components/liver-planner.tsx", import.meta.url), "utf8");
    const shareData = component.slice(component.indexOf("const shareDays"), component.indexOf("return <section"));
    expect(shareData).toContain("items: []");
    expect(shareData).not.toContain("eventsFor(date)");
    expect(shareData).not.toContain("tasksFor(date)");
    expect(component).toContain("ライバー手帳の予定・締切タスクは週間画像に反映されません");
    expect(component).toContain("IRIAMの配信予定はランク管理カレンダーに登録してください");
    expect(component).toContain("サーバーには送信されません");
  });
  it("fills the card with the thumbnail without rendering stream labels or background decoration", () => {
    const renderer = readFileSync(new URL("./liver-planner-image.ts", import.meta.url), "utf8");
    const component = readFileSync(new URL("../components/liver-planner.tsx", import.meta.url), "utf8");
    expect(renderer).toContain("Math.max(imageWidth / thumbnail.naturalWidth");
    expect(renderer).not.toContain("mainItem.title");
    expect(renderer).not.toContain("mainItem.kind");
    expect(component).not.toContain("背景の装飾画像");
    expect(component).not.toContain("decorationImage");
  });
  it("uses a native download link for the PNG", () => {
    const component = readFileSync(new URL("../components/liver-planner.tsx", import.meta.url), "utf8");
    expect(component).toContain("const [downloadUrl, setDownloadUrl]");
    expect(component).toContain("href={downloadUrl}");
    expect(component).toContain("download={weeklyShareFilename(weekStart)}");
    expect(component).toContain("aria-disabled={!downloadUrl}");
    expect(component).toContain('canvas.toBlob(resolve, "image/png")');
    expect(component).toContain("URL.createObjectURL(blob)");
  });
});
