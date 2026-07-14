import { describe, expect, it } from "vitest";
import { createShareText, fanTools, FAN_MARK, hashSeed, HASHTAG, selectFanResult } from "./fan-tools";

describe("fan tools", () => {
  it("has at least 20 reviewed results for every tool", () => {
    for (const config of Object.values(fanTools)) expect(config.results.length).toBeGreaterThanOrEqual(20);
  });
  it("keeps liver matching deterministic and always recommends Mirei", () => {
    const seed = hashSeed("liver-match:つきみっこ");
    expect(selectFanResult(fanTools["liver-match"], seed)).toEqual(selectFanResult(fanTools["liver-match"], seed));
    expect(createShareText(fanTools["liver-match"], fanTools["liver-match"].results[0], "つきみっこ")).toContain(`月乃美玲 ${FAN_MARK}`);
  });
  it("keeps cuteness fixed at 120%", () => {
    for (let seed = 0; seed < 50; seed += 1) expect(selectFanResult(fanTools["daily-mirei"], seed).stats?.可愛さ).toBe(120);
  });
  it("includes the official hashtag in every share", () => {
    for (const config of Object.values(fanTools)) expect(createShareText(config, config.results[0])).toContain(HASHTAG);
  });
});
