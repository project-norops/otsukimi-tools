import type { DayPlan, PlannerInput, PlanValue, RankEvent, SimulationResult, Warning } from "@/types/planner";
import { addDays, parseDate } from "./date-utils";
import { moveRank, RANK_RULES, remainingCalculationDays } from "./rank-rules";
import { applySkipPassGrants } from "./skip-pass";

const emptyPlan = (defaultValue: PlanValue): DayPlan => ({ value: defaultValue });
export function validateInput(input: PlannerInput): Warning[] {
  const warnings: Warning[] = [];
  if (input.score < 0 || input.score > 17) warnings.push({ level: "error", message: "累計スコアは0〜17で入力してください。" });
  if (input.remainingDaysDisplay < 0 || input.remainingDaysDisplay > 6) warnings.push({ level: "error", message: "あとN日は0〜6で入力してください。" });
  if (input.skipPasses < 0 || input.skipPasses > 10) warnings.push({ level: "error", message: "スキップパスは0〜10枚で入力してください。" });
  return warnings;
}
export function simulate(input: PlannerInput, plans: Record<string, DayPlan>, totalDays = 92, defaultValue: PlanValue = "unset"): SimulationResult {
  const days: SimulationResult["days"] = []; const warnings = validateInput(input);
  let rank = input.rank, score = input.score, skipPasses = input.skipPasses;
  let periodRemaining = remainingCalculationDays(input.remainingDaysDisplay);
  for (let offset = 0; offset < totalDays; offset++) {
    const date = addDays(input.baseDate, offset); const plan = plans[date] ?? emptyPlan(defaultValue); const rankBefore = rank; const scoreBefore = score;
    const isMonday = parseDate(date).getDay() === 1;
    const grants = applySkipPassGrants(skipPasses, isMonday && (plan.weeklyGrant ?? true), plan.manualGrant ?? 0);
    skipPasses = grants.total;
    let skipValid = true, periodEnds = false, rankEvent: RankEvent | undefined, decisionScore: number | undefined;
    if (plan.value === "skip" && skipPasses > 0) {
      skipPasses -= 1;
    } else {
      if (plan.value === "skip") { skipValid = false; warnings.push({ level: "error", date, message: "スキップパスがないためSKIPを使用できません。" }); }
      if (typeof plan.value === "number") score += plan.value;
      periodRemaining -= 1;
      if (score >= RANK_RULES.upScore) {
        decisionScore = score;
        rank = moveRank(rank, 1); rankEvent = { type: "up", from: rankBefore, to: rank, label: rankBefore === rank ? `${rank} 上限キープ` : `${rankBefore} → ${rank} ランクアップ` };
        score = 0; periodRemaining = RANK_RULES.periodDays; periodEnds = true;
      } else if (periodRemaining === 0) {
        decisionScore = score;
        periodEnds = true;
        if (score >= RANK_RULES.keepScore) rankEvent = { type: "keep", from: rank, to: rank, label: `${rank} キープ` };
        else { const next = moveRank(rank, -1); rankEvent = { type: "down", from: rank, to: next, label: rank === next ? `${rank} 下限キープ` : `${rank} → ${next} ランクダウン` }; rank = next; warnings.push({ level: "warning", date, message: `${rankEvent.label}見込みです。` }); }
        score = 0; periodRemaining = RANK_RULES.periodDays;
      }
    }
    days.push({ date, plan, rankBefore, rankAfter: rank, scoreBefore, scoreAfter: score, decisionScore, calculationDay: RANK_RULES.periodDays - periodRemaining + 1, skipPasses, weeklyGrant: grants.weeklyGrant, manualGrant: grants.manualGrant, skipValid, periodEnds, rankEvent });
  }
  return { days, warnings };
}
