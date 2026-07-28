import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import sitemap from "@/app/sitemap";
import { availableTools, homeTools, memoryExperiences, tools } from "@/data/tools";

const homePage = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");

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

  it("keeps unlisted fan content out of the portal and sitemap source", () => {
    const hiddenIds = ["daily-mirei", "mirei-alert", "liver-match"];

    expect(tools.filter((tool) => hiddenIds.includes(tool.id)).every((tool) => tool.listed === false)).toBe(true);
    expect(availableTools.filter((tool) => hiddenIds.includes(tool.id))).toEqual([]);
    expect(homeTools.filter((tool) => hiddenIds.includes(tool.id))).toEqual([]);
    expect(sitemap().map((entry) => entry.url)).not.toEqual(expect.arrayContaining(hiddenIds.map((id) => `https://sushiusa.net/tools/${id}`)));
  });

  it("places For Memories after the activity tools on the home page", () => {
    expect(homePage.indexOf('id="tools"')).toBeLessThan(homePage.indexOf('id="memories"'));
  });
});
