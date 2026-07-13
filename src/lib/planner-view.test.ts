import { describe, expect, it } from "vitest";
import type { DayPlan, PlannerInput } from "@/types/planner";
import { simulate } from "./simulator";
import { getActionErrors, getNextRankDecision, getRankProgress } from "./planner-view";

const base: PlannerInput = { baseDate: "2026-07-14", rank: "S1", score: 0, remainingDaysDisplay: 6, skipPasses: 0 };
const plans = (...values: DayPlan["value"][]) => Object.fromEntries(values.map((value, index) => [`2026-07-${String(14 + index).padStart(2, "0")}`, { value }]));

describe("planner daily rank display", () => {
  it("uses the old rank on an upgrade day and the new rank on the next day", () => { const result = simulate(base, plans(6, 6, 6, 1), 4); expect(result.days[2].rankBefore).toBe("S1"); expect(result.days[2].rankAfter).toBe("S2"); expect(result.days[3].rankBefore).toBe("S2"); });
  it("uses the same rank after a keep", () => { const result = simulate(base, plans(2, 2, 2, 2, 2, 1, 1, 1), 8); expect(result.days[6].rankEvent?.type).toBe("keep"); expect(result.days[7].rankBefore).toBe("S1"); });
  it("uses the lower rank on the day after a rank down", () => { const result = simulate(base, plans(2, 2, 2, 2, 1, 1, 1, 1), 8); expect(result.days[6].rankBefore).toBe("S1"); expect(result.days[6].rankAfter).toBe("A3"); expect(result.days[7].rankBefore).toBe("A3"); });
  it("selects only the nearest decision and preserves action errors", () => { const result = simulate(base, { ...plans(2, 2, 2, 2, 2, 1), "2026-07-20": { value: 1, weeklyGrant: false }, "2026-07-21": { value: "skip" } }, 15); expect(getNextRankDecision(result.days)?.date).toBe("2026-07-20"); expect(getActionErrors(result.warnings)).toHaveLength(1); });
  it("calculates keep and rank-up progress", () => { expect(getRankProgress(8)).toEqual({ currentScore: 8, keepRemaining: 4, upRemaining: 10, keepAchieved: false }); expect(getRankProgress(14)).toEqual({ currentScore: 14, keepRemaining: 0, upRemaining: 4, keepAchieved: true }); });
  it("shows a fresh period after reaching the upgrade threshold", () => expect(getRankProgress(18)).toEqual({ currentScore: 0, keepRemaining: 12, upRemaining: 18, keepAchieved: false }));
});
