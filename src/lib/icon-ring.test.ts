import { describe, expect, it } from "vitest";
import { canvasDelta, clampZoom, createCoverTransform, getIconDrawRect, ICON_OUTPUT_SIZE } from "./icon-ring";

describe("icon ring image transform", () => {
  it("covers the square output while preserving aspect ratio", () => {
    const landscape = getIconDrawRect(1200, 600, createCoverTransform(1200, 600));
    expect(landscape.height).toBe(ICON_OUTPUT_SIZE);
    expect(landscape.width).toBe(ICON_OUTPUT_SIZE * 2);
    expect(landscape.x).toBe(-ICON_OUTPUT_SIZE / 2);
    const portrait = getIconDrawRect(600, 1200, createCoverTransform(600, 1200));
    expect(portrait.width).toBe(ICON_OUTPUT_SIZE);
    expect(portrait.height).toBe(ICON_OUTPUT_SIZE * 2);
  });
  it("clamps zoom to the supported range", () => {
    expect(clampZoom(0.2)).toBe(0.5);
    expect(clampZoom(1.25)).toBe(1.25);
    expect(clampZoom(8)).toBe(1.5);
  });
  it("converts pointer movement from preview pixels to output pixels", () => {
    expect(canvasDelta(30, 342)).toBe(45);
    expect(canvasDelta(30, 0)).toBe(0);
  });
});
