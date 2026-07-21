import { describe, expect, it } from "vitest";
import { LIVER_PLANNER_VERSION, addDays, normalizeLiverPlannerState, readLiverPlannerState } from "@/lib/liver-planner";

describe("liver planner storage", () => {
  it("normalizes valid saved data and ignores malformed entries", () => {
    const state = normalizeLiverPlannerState({ version: LIVER_PLANNER_VERSION, events: [{ id: "e", title: "通院", date: "2026-07-22", allDay: false, category: "プライベート" }, { title: "", date: "bad" }], tasks: [{ id: "t", title: "告知", dueDate: "2026-07-23", category: "告知", priority: "高", completed: false }] });
    expect(state?.events).toHaveLength(1); expect(state?.tasks[0].priority).toBe("高");
  });
  it("returns an empty state for corrupt JSON", () => {
    expect(readLiverPlannerState("not json").events).toEqual([]);
    expect(addDays("2026-07-31", 1)).toBe("2026-08-01");
  });
});
