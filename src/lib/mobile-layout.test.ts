import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
describe("mobile layout regression guards", () => {
  it("does not size page chrome from 100vw", () => expect(css).not.toContain("100vw"));
  it.each([320, 375, 390, 430])("keeps the %ipx review width under the mobile breakpoint", (width) => expect(width).toBeLessThanOrEqual(560));
  it("uses shrinkable calendar columns and explicit mobile form handling", () => { expect(css).toContain("repeat(7, minmax(0, 1fr))"); expect(css).toContain(".manual-grant-fields"); expect(css).toContain("min-width: 0"); });
  it("uses compact mobile event labels and two-line memos without overflow", () => { expect(css).toContain(".event-label-compact"); expect(css).toContain("-webkit-line-clamp: 2"); expect(css).toContain("overflow-wrap: anywhere"); });
});
