import { describe, expect, it } from "vitest";
import { decodePassportTemplate, encodePassportTemplate, getNextPassportGrade, getPassportGrade, stampsUntilNextGrade, summarizeRewards } from "./fan-guild";

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

  it("shares a Japanese mission template without listener progress", () => {
    const encoded = encodePassportTemplate({ hostName: "月見みれい", passportTitle: "月夜の王国", missions: ["挨拶する", "合言葉を見つける"] });
    expect(decodePassportTemplate(encoded)).toEqual({ hostName: "月見みれい", passportTitle: "月夜の王国", missions: ["挨拶する", "合言葉を見つける"] });
    expect(encoded).not.toContain("月見みれい");
  });

  it("rejects a broken passport share value", () => {
    expect(decodePassportTemplate("not-a-passport")).toBeNull();
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
