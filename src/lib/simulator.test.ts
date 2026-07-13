import { describe, expect, it } from "vitest";
import type { DayPlan, PlannerInput } from "@/types/planner";
import { simulate } from "./simulator";
import { remainingCalculationDays } from "./rank-rules";
import { applySkipPassGrants } from "./skip-pass";

const base: PlannerInput = { baseDate: "2026-07-14", rank: "S1", score: 0, remainingDaysDisplay: 6, skipPasses: 0 };
const scores = (...values: DayPlan["value"][]) => Object.fromEntries(values.map((value, i) => [`2026-07-${String(14 + i).padStart(2, "0")}`, { value }]));
describe("rank simulator", () => {
  it("treats あと6日 as seven calculation days", () => expect(remainingCalculationDays(6)).toBe(7));
  it("ranks up immediately at 18 and starts a new period", () => { const result = simulate(base, scores(6, 6, 6, 1), 4); expect(result.days[2].rankEvent?.type).toBe("up"); expect(result.days[3].scoreBefore).toBe(0); });
  it("keeps at 12 after seven days", () => expect(simulate(base, scores(2, 2, 2, 2, 2, 1, 1), 7).days[6].rankEvent?.type).toBe("keep"));
  it("drops at 11 after seven days", () => expect(simulate(base, scores(2, 2, 2, 2, 1, 1, 1), 7).days[6].rankEvent?.type).toBe("down"));
  it("extends a period for a valid skip", () => { const result = simulate({ ...base, skipPasses: 1 }, scores("skip", 2, 2, 2, 2, 2, 2, 2), 8); expect(result.days[7].periodEnds).toBe(true); });
  it("reports invalid skip at zero", () => expect(simulate(base, scores("skip"), 1).warnings[0].level).toBe("error"));
  it("grants weekly pass on Monday and caps at ten", () => { const monday = simulate({ ...base, baseDate: "2026-07-13" }, {}, 1); expect(monday.days[0].skipPasses).toBe(1); expect(applySkipPassGrants(10, true).total).toBe(10); });
  it("handles multiple rank outcomes over three months", () => { const plans: Record<string, DayPlan> = {}; const date = new Date(2026, 6, 14); for (let i=0;i<92;i++) { plans[date.toLocaleDateString("sv-SE")] = { value: i < 21 ? 6 : i < 49 ? 2 : "rest" }; date.setDate(date.getDate()+1); } const events = simulate({ ...base, rank: "B1" }, plans, 92).days.flatMap(d => d.rankEvent?.type ?? []); expect(events).toContain("up"); expect(events).toContain("keep"); expect(events).toContain("down"); });
  it("does not exceed S3 or drop below D", () => { expect(simulate({ ...base, rank: "S3", score: 17 }, scores(1), 1).days[0].rankAfter).toBe("S3"); expect(simulate({ ...base, rank: "D" }, {}, 7).days[6].rankAfter).toBe("D"); });
  it("combines weekly and manual grants and caps at ten", () => expect(applySkipPassGrants(8, true, 3)).toEqual({ total: 10, weeklyGrant: 1, manualGrant: 3 }));
});
