import type { SimulationDay, Warning } from "@/types/planner";

export const getNextRankDecision = (days: SimulationDay[]) => days.find((day) => day.rankEvent !== undefined);
export const getActionErrors = (warnings: Warning[]) => warnings.filter((warning) => warning.level === "error");

export function getRankProgress(score: number) {
  const currentScore = score >= 18 ? 0 : Math.max(0, score);
  return {
    currentScore,
    keepRemaining: Math.max(12 - currentScore, 0),
    upRemaining: Math.max(18 - currentScore, 0),
    keepAchieved: currentScore >= 12,
  };
}
