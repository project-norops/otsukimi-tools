import type { Rank } from "@/types/planner";

export type RankTier = "S" | "A" | "B" | "C" | "D";
export interface RankPalette { background: string; text: string; border: string }

export const RANK_PALETTES: Record<RankTier, RankPalette> = {
  S: { background: "#FCE3E4", text: "#9E2931", border: "#E7A9AD" },
  A: { background: "#FFE2EC", text: "#A43B61", border: "#EEB6C9" },
  B: { background: "#EEE5FA", text: "#694593", border: "#CDB8E6" },
  C: { background: "#E2EEFC", text: "#315F96", border: "#B5CEE9" },
  D: { background: "#DFF5F7", text: "#276F78", border: "#ACDDE2" },
};

export const getRankTier = (rank: Rank): RankTier => rank.charAt(0) as RankTier;
export const getRankPalette = (rank: Rank) => RANK_PALETTES[getRankTier(rank)];
