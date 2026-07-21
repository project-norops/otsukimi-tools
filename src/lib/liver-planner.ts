export const LIVER_PLANNER_STORAGE_KEY = "sushiusa-tools:liver-planner:v1";
export const LIVER_PLANNER_VERSION = 1;

export const LIVER_CATEGORIES = ["配信", "案件", "締切", "制作", "告知", "発送", "プライベート", "その他"] as const;
export type LiverCategory = (typeof LIVER_CATEGORIES)[number];
export type LiverPriority = "高" | "中" | "低";
export type LiverEvent = { id: string; title: string; date: string; startTime?: string; endTime?: string; allDay: boolean; category: LiverCategory; memo?: string };
export type LiverTask = { id: string; title: string; scheduledDate?: string; dueDate?: string; time?: string; category: LiverCategory; priority: LiverPriority; memo?: string; completed: boolean };
export type LiverPlannerState = { version: 1; events: LiverEvent[]; tasks: LiverTask[] };

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const isDate = (value: unknown): value is string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
const isTime = (value: unknown): value is string => typeof value === "string" && /^\d{2}:\d{2}$/.test(value);
const text = (value: unknown, max: number) => typeof value === "string" ? Array.from(value).slice(0, max).join("").trim() : "";
const category = (value: unknown): LiverCategory => LIVER_CATEGORIES.includes(value as LiverCategory) ? value as LiverCategory : "その他";
const priority = (value: unknown): LiverPriority => value === "高" || value === "低" ? value : "中";

export const emptyLiverPlannerState = (): LiverPlannerState => ({ version: LIVER_PLANNER_VERSION, events: [], tasks: [] });

export function normalizeLiverPlannerState(value: unknown): LiverPlannerState | undefined {
  if (!isRecord(value) || value.version !== LIVER_PLANNER_VERSION || !Array.isArray(value.events) || !Array.isArray(value.tasks)) return undefined;
  const events = value.events.flatMap((raw): LiverEvent[] => {
    if (!isRecord(raw) || !isDate(raw.date)) return [];
    const title = text(raw.title, 80); if (!title) return [];
    return [{ id: text(raw.id, 100) || cryptoSafeId(), title, date: raw.date, startTime: isTime(raw.startTime) ? raw.startTime : undefined, endTime: isTime(raw.endTime) ? raw.endTime : undefined, allDay: Boolean(raw.allDay), category: category(raw.category), memo: text(raw.memo, 500) || undefined }];
  });
  const tasks = value.tasks.flatMap((raw): LiverTask[] => {
    if (!isRecord(raw)) return [];
    const title = text(raw.title, 80); if (!title) return [];
    const scheduledDate = isDate(raw.scheduledDate) ? raw.scheduledDate : undefined, dueDate = isDate(raw.dueDate) ? raw.dueDate : undefined;
    if (!scheduledDate && !dueDate) return [];
    return [{ id: text(raw.id, 100) || cryptoSafeId(), title, scheduledDate, dueDate, time: isTime(raw.time) ? raw.time : undefined, category: category(raw.category), priority: priority(raw.priority), memo: text(raw.memo, 500) || undefined, completed: Boolean(raw.completed) }];
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
