import { describe, expect, it } from "vitest";
import { availableTools, homeTools, memoryExperiences, tools } from "@/data/tools";

describe("tool portal", () => {
  it("shows only implemented tools", () => {
    expect(availableTools.length).toBeGreaterThan(0);
    expect(availableTools.every((tool) => tool.status === "available" && Boolean(tool.href))).toBe(true);
    expect(availableTools).not.toContainEqual(expect.objectContaining({ status: "in_development" }));
    expect(availableTools.length).toBeLessThan(tools.length);
  });

  it("keeps the four experiences in the separate For Memories category", () => {
    const expected = [
      ["oshi-passport", "/tools/oshi-passport"],
      ["fan-awards", "/tools/fan-awards"],
      ["project-relay", "/tools/project-relay"],
      ["reward-board", "/tools/reward-board"],
    ];

    expect(memoryExperiences.map((tool) => [tool.id, tool.href])).toEqual(expected);
    expect(homeTools.filter((tool) => expected.some(([id]) => id === tool.id))).toEqual([]);
    for (const [id, href] of expected) {
      expect(availableTools).toContainEqual(expect.objectContaining({ id, href, status: "available" }));
    }
  });
});
