import { RANKS, type Rank } from "@/types/planner";

export const RANK_RULES = { periodDays: 7, upScore: 18, keepScore: 12 } as const;
export const remainingCalculationDays = (displayDays: number) => displayDays + 1;
export function moveRank(rank: Rank, delta: -1 | 1): Rank {
  const index = RANKS.indexOf(rank);
  return RANKS[Math.max(0, Math.min(RANKS.length - 1, index + delta))];
}
