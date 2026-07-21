import { generateAnniversaries } from "@/lib/anniversaries";
import { simulate } from "@/lib/simulator";
import { countInclusiveDays, getSimulationRange } from "@/lib/simulation-range";
import type { PlannerPersistedState } from "@/lib/planner-state";

export const LIVER_PLANNER_STORAGE_KEY = "sushiusa-tools:liver-planner:v1";
export const LIVER_PLANNER_VERSION = 1;

export const EVENT_CATEGORIES = ["配信", "作業", "連絡", "打合せ", "交流", "プライベート", "その他"] as const;
export const TASK_CATEGORIES = ["申込", "発注", "問合せ", "提出", "交流", "その他"] as const;
export type EventCategory = (typeof EVENT_CATEGORIES)[number];
export type TaskCategory = (typeof TASK_CATEGORIES)[number];
export type LiverEvent = { id: string; title: string; date: string; startTime?: string; endTime?: string; allDay: boolean; category: EventCategory; memo?: string };
export type LiverTask = { id: string; title: string; scheduledDate?: string; dueDate?: string; time?: string; category: TaskCategory; memo?: string; completed: boolean };
export type LiverPlannerState = { version: 1; events: LiverEvent[]; tasks: LiverTask[] };

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const isDate = (value: unknown): value is string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
const isTime = (value: unknown): value is string => typeof value === "string" && /^\d{2}:\d{2}$/.test(value);
const text = (value: unknown, max: number) => typeof value === "string" ? Array.from(value).slice(0, max).join("").trim() : "";
const eventCategory = (value: unknown): EventCategory => {
  if (EVENT_CATEGORIES.includes(value as EventCategory)) return value as EventCategory;
  return ({ "案件": "打合せ", "締切": "作業", "制作": "作業", "告知": "連絡", "発送": "作業" } as Record<string, EventCategory>)[String(value)] ?? "その他";
};
const taskCategory = (value: unknown): TaskCategory => {
  if (TASK_CATEGORIES.includes(value as TaskCategory)) return value as TaskCategory;
  return ({ "案件": "問合せ", "締切": "提出", "制作": "提出", "告知": "問合せ", "発送": "発注" } as Record<string, TaskCategory>)[String(value)] ?? "その他";
};

export const emptyLiverPlannerState = (): LiverPlannerState => ({ version: LIVER_PLANNER_VERSION, events: [], tasks: [] });

export function normalizeLiverPlannerState(value: unknown): LiverPlannerState | undefined {
  if (!isRecord(value) || value.version !== LIVER_PLANNER_VERSION || !Array.isArray(value.events) || !Array.isArray(value.tasks)) return undefined;
  const events = value.events.flatMap((raw): LiverEvent[] => {
    if (!isRecord(raw) || !isDate(raw.date)) return [];
    const title = text(raw.title, 80); if (!title) return [];
    return [{ id: text(raw.id, 100) || cryptoSafeId(), title, date: raw.date, startTime: isTime(raw.startTime) ? raw.startTime : undefined, endTime: isTime(raw.endTime) ? raw.endTime : undefined, allDay: Boolean(raw.allDay), category: eventCategory(raw.category), memo: text(raw.memo, 500) || undefined }];
  });
  const tasks = value.tasks.flatMap((raw): LiverTask[] => {
    if (!isRecord(raw)) return [];
    const title = text(raw.title, 80); if (!title) return [];
    const scheduledDate = isDate(raw.scheduledDate) ? raw.scheduledDate : undefined, dueDate = isDate(raw.dueDate) ? raw.dueDate : undefined;
    if (!scheduledDate && !dueDate) return [];
    return [{ id: text(raw.id, 100) || cryptoSafeId(), title, scheduledDate, dueDate, time: isTime(raw.time) ? raw.time : undefined, category: taskCategory(raw.category), memo: text(raw.memo, 500) || undefined, completed: Boolean(raw.completed) }];
  });
  return { version: LIVER_PLANNER_VERSION, events, tasks };
}

export function readLiverPlannerState(raw: string | null): LiverPlannerState {
  try { return normalizeLiverPlannerState(JSON.parse(raw ?? "")) ?? emptyLiverPlannerState(); } catch { return emptyLiverPlannerState(); }
}
export function makeLiverId() { return cryptoSafeId(); }
function cryptoSafeId() { return `lp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`; }
export function addDays(date: string, count: number) { const value = new Date(`${date}T12:00:00`); value.setDate(value.getDate() + count); return formatDate(value); }
export function formatDate(value: Date) { return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`; }
export function datesBetween(start: string, count: number) { return Array.from({ length: count }, (_, index) => addDays(start, index)); }
export function labelDate(date: string) { return new Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric", weekday: "short" }).format(new Date(`${date}T12:00:00`)); }

export type RankCalendarItem = { date: string; title: string; memo?: string };

const rankPlanLabel = (value: unknown) => typeof value === "number" ? `IRIAM (+${value})` : value === "skip" ? "IRIAM (SKIP)" : value === "rest" ? "IRIAM（休み）" : "IRIAM (+1)";

/**
 * ランク管理カレンダーと同じシミュレーションを読み取り専用で展開する。
 * 未入力日はランク管理カレンダー本体と同じく +1 として扱う。
 */
export function rankCalendarItems(state?: PlannerPersistedState): RankCalendarItem[] {
  if (!state) return [];
  const range = getSimulationRange(state.input.baseDate, state.input.simulationMonths);
  const result = simulate(state.input, state.plans, countInclusiveDays(range.start, range.end), 1);
  const anniversaries = state.input.debutDate ? generateAnniversaries(state.input.debutDate, range.start, range.end) : [];
  const anniversaryMap = Object.groupBy(anniversaries, (item) => item.date);

  return result.days.flatMap((day) => {
    const items: RankCalendarItem[] = [{ date: day.date, title: rankPlanLabel(day.plan.value), memo: day.plan.memo }];
    const grants = day.weeklyGrant + day.manualGrant;
    if (grants) items.push({ date: day.date, title: `IRIAM（SP+${grants}）` });
    if (day.rankEvent) items.push({ date: day.date, title: `IRIAM（${day.rankEvent.label}）` });
    for (const anniversary of anniversaryMap[day.date] ?? []) items.push({ date: day.date, title: `IRIAM（記念日：${anniversary.label}）` });
    return items;
  });
}
