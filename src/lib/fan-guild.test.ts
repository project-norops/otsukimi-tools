import { describe, expect, it } from "vitest";
import { getNextPassportGrade, getPassportGrade, stampsUntilNextGrade, summarizeRewards } from "./fan-guild";

describe("fan guild passport", () => {
  it("changes grade at each threshold", () => {
    expect(getPassportGrade(0).id).toBe("bronze");
    expect(getPassportGrade(3).id).toBe("silver");
    expect(getPassportGrade(6).id).toBe("gold");
    expect(getPassportGrade(10).id).toBe("aurora");
  });

  it("shows the next collectible grade and remaining stamps", () => {
    expect(getNextPassportGrade(4)?.id).toBe("gold");
    expect(stampsUntilNextGrade(4)).toBe(2);
    expect(getNextPassportGrade(12)).toBeNull();
    expect(stampsUntilNextGrade(12)).toBe(0);
  });
});

describe("reward board", () => {
  it("counts every workflow status", () => {
    expect(summarizeRewards([{ status: "todo" }, { status: "making" }, { status: "making" }, { status: "sent" }])).toEqual({
      todo: 1,
      making: 2,
      checking: 0,
      sent: 1,
    });
  });
});
