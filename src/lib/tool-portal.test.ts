import { describe, expect, it } from "vitest";
import { availableTools, tools } from "@/data/tools";

describe("tool portal", () => {
  it("shows only implemented tools", () => {
    expect(availableTools.length).toBeGreaterThan(0);
    expect(availableTools.every((tool) => tool.status === "available" && Boolean(tool.href))).toBe(true);
    expect(availableTools).not.toContainEqual(expect.objectContaining({ status: "in_development" }));
    expect(availableTools.length).toBeLessThan(tools.length);
  });
});
