import { describe, expect, it } from "vitest";
import { LIVER_PLANNER_VERSION, addDays, normalizeLiverPlannerState, rankCalendarItems, readLiverPlannerState } from "@/lib/liver-planner";

describe("liver planner storage", () => {
  it("normalizes valid saved data and ignores malformed entries", () => {
    const state = normalizeLiverPlannerState({ version: LIVER_PLANNER_VERSION, events: [{ id: "e", title: "通院", date: "2026-07-22", allDay: false, category: "プライベート" }, { title: "", date: "bad" }], tasks: [{ id: "t", title: "告知", dueDate: "2026-07-23", category: "告知", completed: false }] });
    expect(state?.events).toHaveLength(1); expect(state?.tasks[0].category).toBe("問合せ");
  });
  it("returns an empty state for corrupt JSON", () => {
    expect(readLiverPlannerState("not json").events).toEqual([]);
    expect(addDays("2026-07-31", 1)).toBe("2026-08-01");
  });
  it("mirrors default +1, SP grants, rank decisions, and anniversaries from the rank calendar", () => {
    const items = rankCalendarItems({ version: 2, input: { baseDate: "2026-07-20", rank: "C1", score: 11, remainingDaysDisplay: 0, skipPasses: 0, simulationMonths: 1, debutDate: "2026-04-20" }, plans: {} });
    const labels = items.filter((item) => item.date === "2026-07-20").map((item) => item.title);
    expect(labels).toContain("IRIAM (+1)");
    expect(labels).toContain("IRIAM（SP+1）");
    expect(labels.some((label) => label.includes("キープ"))).toBe(true);
    expect(labels.some((label) => label.includes("記念日：3か月記念"))).toBe(true);
  });
  it("mirrors a rank-down decision from the rank calendar", () => {
    const items = rankCalendarItems({ version: 2, input: { baseDate: "2026-07-20", rank: "C1", score: 0, remainingDaysDisplay: 0, skipPasses: 0, simulationMonths: 1 }, plans: {} });
    expect(items.some((item) => item.title.includes("ランクダウン"))).toBe(true);
  });
});
