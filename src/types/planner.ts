export const RANKS = ["D", "C1", "C2", "C3", "C4", "C5", "B1", "B2", "B3", "A1", "A2", "A3", "S1", "S2", "S3"] as const;
export type Rank = (typeof RANKS)[number];
export type PlanValue = 1 | 2 | 4 | 6 | "skip" | "rest" | "unset";

export interface DayPlan { value: PlanValue; memo?: string; weeklyGrant?: boolean; manualGrant?: number; manualGrantMemo?: string }
export interface PlannerInput { baseDate: string; rank: Rank; score: number; remainingDaysDisplay: number; skipPasses: number; planName?: string; displayName?: string; debutDate?: string }
export interface RankEvent { type: "up" | "keep" | "down"; from: Rank; to: Rank; label: string }
export interface Warning { level: "error" | "warning"; date?: string; message: string }
export interface SimulationDay { date: string; plan: DayPlan; rankBefore: Rank; rankAfter: Rank; scoreBefore: number; scoreAfter: number; calculationDay: number; skipPasses: number; weeklyGrant: number; manualGrant: number; skipValid: boolean; periodEnds: boolean; rankEvent?: RankEvent }
export interface SimulationResult { days: SimulationDay[]; warnings: Warning[] }
export interface Anniversary { date: string; label: string; kind: "calendar" | "days" }
