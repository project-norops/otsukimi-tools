import { describe, expect, it } from "vitest";
import type { DayPlan, PlannerInput } from "@/types/planner";
import { simulate } from "./simulator";
import { remainingCalculationDays } from "./rank-rules";
import { applySkipPassGrants } from "./skip-pass";
import { addDays } from "./date-utils";

const base: PlannerInput = { baseDate: "2026-07-14", rank: "S1", score: 0, remainingDaysDisplay: 6, skipPasses: 0 };
const scores = (...values: DayPlan["value"][]) => Object.fromEntries(values.map((value, i) => [`2026-07-${String(14 + i).padStart(2, "0")}`, { value }]));
describe("rank simulator", () => {
  it("treats あと6日 as seven calculation days", () => expect(remainingCalculationDays(6)).toBe(7));
  it("ranks up immediately at 18 and exposes the pre-reset total", () => { const result = simulate(base, scores(6, 6, 6, 1), 4); expect(result.days[2]).toMatchObject({ decisionScore: 18, scoreAfter: 0, rankEvent: { type: "up" } }); expect(result.days[3].scoreBefore).toBe(0); });
  it("keeps at 12 and exposes the pre-reset total", () => expect(simulate(base, scores(2, 2, 2, 2, 2, 1, 1), 7).days[6]).toMatchObject({ decisionScore: 12, scoreAfter: 0, rankEvent: { type: "keep" } }));
  it("drops at 11 and exposes the pre-reset total", () => expect(simulate(base, scores(2, 2, 2, 2, 1, 1, 1), 7).days[6]).toMatchObject({ decisionScore: 11, scoreAfter: 0, rankEvent: { type: "down" } }));
  it("extends a period for a valid skip", () => { const result = simulate({ ...base, skipPasses: 1 }, scores("skip", 2, 2, 2, 2, 2, 2, 2), 8); expect(result.days[7].periodEnds).toBe(true); });
  it("reports invalid skip at zero", () => expect(simulate(base, scores("skip"), 1).warnings[0].level).toBe("error"));
  it("grants weekly pass on Monday and caps at ten", () => { const monday = simulate({ ...base, baseDate: "2026-07-13" }, {}, 1); expect(monday.days[0].skipPasses).toBe(1); expect(applySkipPassGrants(10, true).total).toBe(10); });
  it("handles multiple rank outcomes over three months", () => { const plans: Record<string, DayPlan> = {}; const date = new Date(2026, 6, 14); for (let i=0;i<92;i++) { plans[date.toLocaleDateString("sv-SE")] = { value: i < 21 ? 6 : i < 49 ? 2 : "rest" }; date.setDate(date.getDate()+1); } const events = simulate({ ...base, rank: "B1" }, plans, 92).days.flatMap(d => d.rankEvent?.type ?? []); expect(events).toContain("up"); expect(events).toContain("keep"); expect(events).toContain("down"); });
  it("does not exceed S3 or drop below D", () => { expect(simulate({ ...base, rank: "S3", score: 17 }, scores(1), 1).days[0].rankAfter).toBe("S3"); expect(simulate({ ...base, rank: "D" }, {}, 7).days[6].rankAfter).toBe("D"); });
  it("combines weekly and manual grants and caps at ten", () => expect(applySkipPassGrants(8, true, 3)).toEqual({ total: 10, weeklyGrant: 1, manualGrant: 3 }));
  it.each(["2026-07-14", "2026-08-01", "2026-07-15", "2026-07-28"])("extends the decision date for a valid SKIP from %s", (baseDate) => {
    const input = { ...base, baseDate, skipPasses: 1 };
    const normal = simulate(input, {}, 10).days.find((day) => day.periodEnds)?.date;
    const skipped = simulate(input, { [baseDate]: { value: "skip" } }, 10).days.find((day) => day.periodEnds)?.date;
    expect(skipped).toBe(addDays(normal!, 1));
  });
  it("applies a same-day manual grant before a first-week SKIP", () => { const result = simulate(base, { [base.baseDate]: { value: "skip", manualGrant: 1 } }, 9); expect(result.days[0].skipValid).toBe(true); expect(result.days.find((day) => day.periodEnds)?.date).toBe("2026-07-21"); });
  it("applies a Monday weekly grant before a same-day SKIP", () => { const input = { ...base, baseDate: "2026-07-13" }; const result = simulate(input, { [input.baseDate]: { value: "skip" } }, 9); expect(result.days[0]).toMatchObject({ skipValid: true, weeklyGrant: 1 }); expect(result.days.find((day) => day.periodEnds)?.date).toBe("2026-07-20"); });
  it("does not extend an invalid SKIP without a pass", () => { const result = simulate(base, { [base.baseDate]: { value: "skip" } }, 8); expect(result.days[0].skipValid).toBe(false); expect(result.days.find((day) => day.periodEnds)?.date).toBe("2026-07-20"); expect(result.warnings.some((warning) => warning.level === "error")).toBe(true); });
  it("exposes the extended decision total after a SKIP", () => { const input = { ...base, skipPasses: 1 }; const result = simulate(input, { [input.baseDate]: { value: "skip" }, "2026-07-15": { value: 2 }, "2026-07-16": { value: 2 }, "2026-07-17": { value: 2 }, "2026-07-18": { value: 2 }, "2026-07-19": { value: 2 }, "2026-07-20": { value: 1 }, "2026-07-21": { value: 1 } }, 8); expect(result.days[7]).toMatchObject({ date: "2026-07-21", decisionScore: 12, scoreAfter: 0, rankEvent: { type: "keep" } }); });
});
