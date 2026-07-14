import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createShareText, fanTools, FAN_MARK, hashSeed, HASHTAG, selectDailyResult, selectFanResult } from "./fan-tools";

describe("fan tools", () => {
  it("has at least 20 reviewed results for every tool", () => {
    for (const config of Object.values(fanTools)) expect(config.results.length).toBeGreaterThanOrEqual(20);
  });
  it("keeps liver matching deterministic and always recommends Mirei", () => {
    const seed = hashSeed("liver-match:つきみっこ");
    expect(selectFanResult(fanTools["liver-match"], seed)).toEqual(selectFanResult(fanTools["liver-match"], seed));
    const share = createShareText(fanTools["liver-match"], fanTools["liver-match"].results[0], "つきみっこ");
    expect(share).toContain(`月乃美玲 ${FAN_MARK}`);
    expect(share).toContain("つきみっこさんに合うライバー像");
    expect(share).not.toContain("あなたに合うライバー像");
  });
  it("keeps cuteness fixed at 120%", () => {
    for (let seed = 0; seed < 50; seed += 1) expect(selectFanResult(fanTools["daily-mirei"], seed).stats?.可愛さ).toBe(120);
  });
  it("selects daily copy from the displayed parameter values", () => {
    const results = fanTools["daily-mirei"].results;
    expect(selectDailyResult(results, { やる気度: 10, 清楚度: 55, 強がり度: 50, 甘え度: 45, 毒舌度: 50 }).id).toBe("daily-02");
    expect(selectDailyResult(results, { やる気度: 55, 清楚度: 10, 強がり度: 85, 甘え度: 45, 毒舌度: 50 }).id).toBe("daily-12");
    expect(selectDailyResult(results, { やる気度: 55, 清楚度: 65, 強がり度: 20, 甘え度: 90, 毒舌度: 50 }).id).toBe("daily-13");
    expect(selectDailyResult(results, { やる気度: 90, 清楚度: 90, 強がり度: 90, 甘え度: 90, 毒舌度: 90 }).id).toBe("daily-10");
    expect(selectDailyResult(results, { やる気度: 10, 清楚度: 10, 強がり度: 10, 甘え度: 10, 毒舌度: 10 }).id).toBe("daily-01");
  });
  it("never returns copy that contradicts its defining extreme", () => {
    for (let seed = 0; seed < 500; seed += 1) {
      const result = selectFanResult(fanTools["daily-mirei"], seed);
      const stats = result.stats!;
      if (result.id === "daily-02") expect(stats.やる気度).toBeLessThanOrEqual(22);
      if (result.id === "daily-03") expect(stats.清楚度).toBeLessThanOrEqual(22);
      if (result.id === "daily-04") expect(stats.強がり度).toBeGreaterThanOrEqual(80);
      if (result.id === "daily-05") expect(stats.甘え度).toBeGreaterThanOrEqual(80);
      if (result.id === "daily-06") expect(stats.毒舌度).toBeGreaterThanOrEqual(80);
      if (result.id === "daily-10") expect(Object.values(stats).slice(0, 5).reduce((sum, value) => sum + value, 0) / 5).toBeGreaterThanOrEqual(78);
    }
  });
  it("includes the official hashtag in every share", () => {
    for (const config of Object.values(fanTools)) expect(createShareText(config, config.results[0])).toContain(HASHTAG);
  });
  it("matches every human-reviewed display title and body", () => {
    const reviewed = readFileSync("docs/FAN_RESULTS_REVIEWED.md", "utf8");
    const reviewedRows = reviewed.split(/\r?\n/).filter((line) => /^\| (daily|fortune|alert|match)-\d+ \|/.test(line));
    const implemented = Object.values(fanTools).flatMap((config) => config.results);
    expect(reviewedRows).toHaveLength(implemented.length);
    reviewedRows.forEach((line, index) => {
      const cells = line.slice(2, -2).split(" | ").map((cell) => cell.trim().replaceAll("\\|", "|").replaceAll("<br>", "\n"));
      expect({ id: implemented[index].id, title: implemented[index].title, body: implemented[index].body, share: implemented[index].share }).toEqual({ id: cells[0], title: cells[2], body: cells[3], share: cells[4] });
    });
  });
});
