import { describe, expect, it } from "vitest";
import { countInclusiveDays, getDisplayMonths, getDisplayRange, getSimulationRange, isSimulationDate } from "./simulation-range";

describe("rank calendar simulation ranges", () => {
  it.each([
    ["2026-07-01", 1, "2026-07-31", 1],
    ["2026-07-15", 1, "2026-08-14", 2],
    ["2026-07-01", 6, "2026-12-31", 6],
    ["2026-07-15", 6, "2027-01-14", 7],
    ["2026-01-31", 1, "2026-02-28", 2],
    ["2024-02-29", 6, "2024-08-28", 7],
  ] as const)("calculates %s for %i month(s)", (baseDate, months, expectedEnd, expectedMonths) => {
    const simulation = getSimulationRange(baseDate, months);
    expect(simulation).toEqual({ start: baseDate, end: expectedEnd });
    const display = getDisplayRange(simulation);
    expect(getDisplayMonths(display)).toHaveLength(expectedMonths);
    expect(display.start.endsWith("-01")).toBe(true);
    expect(display.end).toMatch(/-(28|29|30|31)$/);
  });

  it("counts inclusive dates across a year boundary", () => {
    expect(countInclusiveDays("2026-12-31", "2027-01-02")).toBe(3);
  });

  it("distinguishes simulation dates from display-only dates", () => {
    const range = getSimulationRange("2026-07-15", 1);
    expect(isSimulationDate("2026-07-14", range)).toBe(false);
    expect(isSimulationDate("2026-07-15", range)).toBe(true);
    expect(isSimulationDate("2026-08-14", range)).toBe(true);
    expect(isSimulationDate("2026-08-15", range)).toBe(false);
  });
});
