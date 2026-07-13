import { describe, expect, it } from "vitest";
import type { DayPlan, PlannerInput } from "@/types/planner";
import { simulate } from "./simulator";
import { createRankBandSegments } from "./rank-bands";

const input: PlannerInput = { baseDate: "2026-07-30", rank: "S1", score: 12, remainingDaysDisplay: 6, skipPasses: 0 };
const plan = (entries: Array<[string, DayPlan["value"]]>) => Object.fromEntries(entries.map(([date, value]) => [date, { value }]));

describe("rank band segments", () => {
  it("splits at a rank change", () => { const days = simulate({ ...input, baseDate: "2026-07-14", score: 12 }, plan([["2026-07-14", 6]]), 3).days; const bands = createRankBandSegments(days); expect(bands.map((band) => band.rank)).toEqual(["S1", "S2"]); expect(bands[0].continuesAfter).toBe(false); });
  it("splits at the end of a week and marks continuation", () => { const bands = createRankBandSegments(simulate({ ...input, baseDate: "2026-07-18", score: 0 }, {}, 3).days); expect(bands).toHaveLength(2); expect(bands[0]).toMatchObject({ startColumn: 7, span: 1, continuesAfter: true }); expect(bands[1]).toMatchObject({ startColumn: 1, span: 2, continuesBefore: true }); });
  it("splits at a month boundary and marks continuation", () => { const bands = createRankBandSegments(simulate(input, {}, 4).days); expect(bands[0].month).toBe("2026-07"); expect(bands[1].month).toBe("2026-08"); expect(new Set(bands.map((band) => band.month))).toEqual(new Set(["2026-07", "2026-08"])); expect(bands[0].continuesAfter).toBe(true); expect(bands[1].continuesBefore).toBe(true); });
});
