import { describe, expect, it } from "vitest";
import { getCalendarEventLabels, getPngMemoLines, normalizeCalendarMemo } from "./calendar-content";

describe("mobile calendar content", () => {
  it("uses fixed compact labels for multiple events", () => { const events = getCalendarEventLabels({ weeklyGrant: 1, manualGrant: 2, rankEvent: { type: "up", from: "S1", to: "S2", label: "S1 → S2 ランクアップ" } }); expect(events.map((event) => event.compact)).toEqual(["SP+1", "SP+2", "アップ"]); });
  it.each([["up", "アップ"], ["keep", "キープ"], ["down", "ダウン"]] as const)("maps %s to %s", (type, label) => { const event = getCalendarEventLabels({ weeklyGrant: 0, manualGrant: 0, rankEvent: { type, from: "S1", to: "S1", label } })[0]; expect(event.compact).toBe(label); });
  it("removes empty memos and normalizes visible memos", () => { expect(normalizeCalendarMemo("   \n ")).toBeUndefined(); expect(normalizeCalendarMemo(" 配信後に  振り返り ")).toBe("配信後に 振り返り"); });
  it("limits long PNG memos to two seven-character lines", () => expect(getPngMemoLines("これはとても長いカレンダー用メモです")).toEqual(["これはとても長", "いカレンダー…"]));
});
