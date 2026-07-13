import { describe, expect, it } from "vitest";
import { getCalendarCell, getWeekdayKind, WEEKDAY_HEADERS } from "./calendar-display";

describe("calendar weekday display", () => {
  it("marks Sunday red, Saturday blue, and weekdays neutral", () => { expect(getWeekdayKind("2026-07-12")).toBe("sunday"); expect(getWeekdayKind("2026-07-18")).toBe("saturday"); expect(getWeekdayKind("2026-07-13")).toBe("weekday"); expect(WEEKDAY_HEADERS.map((item) => item.kind)).toEqual(["sunday", "weekday", "weekday", "weekday", "weekday", "weekday", "saturday"]); });
  it.each([["2026-02-01", 1], ["2026-07-01", 4], ["2026-08-01", 7]] as const)("places %s in display column %i regardless of leading blanks", (date, column) => expect(getCalendarCell(date).column).toBe(column));
});
