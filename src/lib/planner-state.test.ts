import { describe, expect, it } from "vitest";
import { decodePlannerState, encodePlannerState, LEGACY_PLANNER_STORAGE_KEY, normalizePlannerMemo, normalizePlannerState, PLANNER_MEMO_LIMIT, PLANNER_STATE_VERSION, PLANNER_STORAGE_KEY, readSharedPlannerState, type PlannerPersistedState } from "./planner-state";

const state: PlannerPersistedState = {
  version: 2,
  input: { baseDate: "2026-07-15", rank: "C1", score: 3, remainingDaysDisplay: 4, skipPasses: 2, simulationMonths: 6, displayName: "月乃美玲" },
  plans: { "2026-07-16": { value: 6, memo: "配信とてもたのしみです" } },
};

describe("planner persistence and sharing", () => {
  it("uses a new v2 key while leaving the legacy key distinct", () => {
    expect(PLANNER_STATE_VERSION).toBe(2);
    expect(PLANNER_STORAGE_KEY).toBe("sushiusa-tools:iriam-rank-calendar:v2");
    expect(LEGACY_PLANNER_STORAGE_KEY).toBe("otsukimi-tools:rank-planner");
  });

  it("migrates saved 4–6 month plans to the current 3 month limit", () => {
    const encoded = encodePlannerState(normalizePlannerState(state)!);
    expect(encoded).not.toMatch(/[+/=]/);
    expect(decodePlannerState(encoded)?.input).toMatchObject({ displayName: "月乃美玲", simulationMonths: 3 });
    expect(decodePlannerState(encoded)?.plans["2026-07-16"].memo).toBe("配信とてもたのしみです".slice(0, PLANNER_MEMO_LIMIT));
    expect(readSharedPlannerState(`#plan=${encoded}`)).toEqual(decodePlannerState(encoded));
  });

  it("rejects corrupt, legacy, and unsupported data without throwing", () => {
    expect(decodePlannerState("not-valid")).toBeUndefined();
    expect(normalizePlannerState({ ...state, version: 1 })).toBeUndefined();
    expect(normalizePlannerState({ ...state, input: { ...state.input, simulationMonths: 7 } })).toBeUndefined();
    expect(normalizePlannerState({ ...state, input: { rank: "X" } })).toBeUndefined();
  });

  it("normalizes imported memos to ten characters", () => {
    expect(Array.from(normalizePlannerMemo("1234567890ABC")!)).toHaveLength(10);
  });
});
