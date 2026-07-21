import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const component = readFileSync(new URL("../components/gacha-planner.tsx", import.meta.url), "utf8");

describe("listener announcement PNG", () => {
  it("uses an X-friendly 16:9 canvas and a Japanese filename", () => {
    expect(component).toContain("canvas.width = 1200; canvas.height = 675");
    expect(component).toContain('link.download = "ガチャ告知用パネル.png"');
  });

  it("compresses twelve prizes into two columns without listener-facing costs", () => {
    expect(component).toContain("draft.prizes.slice(0, 12)");
    expect(component).toContain("displayedPrizes.length > 6");
    expect(component).toContain("twoColumns ? 540 : 1120");
    expect(component).toContain("Math.floor(index / 6)");
    expect(component).toContain("index % 6");
    expect(component).toContain("ほか${remaining}景品");
    const listenerFunction = component.slice(component.indexOf("function downloadListenerPng"), component.indexOf("export function GachaPlanner"));
    expect(listenerFunction).not.toContain("prize.cost");
    expect(listenerFunction).not.toContain("expectedMargin");
    expect(listenerFunction).not.toContain("expectedCostPerDraw");
  });
});
