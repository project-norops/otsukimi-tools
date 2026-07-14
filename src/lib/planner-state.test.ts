import { describe, expect, it } from "vitest";
import { decodePlannerState, encodePlannerState, normalizePlannerMemo, normalizePlannerState, PLANNER_MEMO_LIMIT, readSharedPlannerState, type PlannerPersistedState } from "./planner-state";

const state: PlannerPersistedState = { version: 1, input: { baseDate: "2026-07-15", rank: "C1", score: 3, remainingDaysDisplay: 4, skipPasses: 2, displayName: "月乃美玲" }, draft: { baseDate: "2026-07-15", rank: "C1", score: 3, remainingDaysDisplay: 4, skipPasses: 2, displayName: "月乃美玲" }, started: true, plans: { "2026-07-16": { value: 6, memo: "配信とてもたのしみです" } } };

describe("planner persistence and sharing", () => {
  it("round trips Japanese state through a URL-safe encoding", () => {
    const encoded = encodePlannerState(normalizePlannerState(state)!);
    expect(encoded).not.toMatch(/[+/=]/);
    expect(decodePlannerState(encoded)?.input.displayName).toBe("月乃美玲");
    expect(decodePlannerState(encoded)?.plans["2026-07-16"].memo).toBe("配信とてもたのしみです".slice(0, PLANNER_MEMO_LIMIT));
    expect(readSharedPlannerState(`#plan=${encoded}`)).toEqual(decodePlannerState(encoded));
  });
  it("rejects corrupt and unsupported data without throwing", () => {
    expect(decodePlannerState("not-valid")) .toBeUndefined();
    expect(normalizePlannerState({ ...state, version: 2 })).toBeUndefined();
    expect(normalizePlannerState({ ...state, input: { rank: "X" } })).toBeUndefined();
  });
  it("normalizes imported memos to ten characters", () => {
    expect(Array.from(normalizePlannerMemo("1234567890ABC")!)).toHaveLength(10);
  });
});
