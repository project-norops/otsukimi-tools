import { describe, expect, it } from "vitest";
import { getRankPalette, getRankTier, RANK_PALETTES } from "./rank-colors";

describe("rank tier colors", () => {
  it.each([["S3", "S"], ["A1", "A"], ["B2", "B"], ["C5", "C"], ["D", "D"]] as const)("maps %s to the %s tier", (rank, tier) => { expect(getRankTier(rank)).toBe(tier); expect(getRankPalette(rank)).toBe(RANK_PALETTES[tier]); });
  it("defines distinct accessible UI tokens for every tier", () => { const palettes = Object.values(RANK_PALETTES); expect(new Set(palettes.map((item) => item.background))).toHaveLength(5); for (const palette of palettes) expect(new Set(Object.values(palette))).toHaveLength(3); });
});
