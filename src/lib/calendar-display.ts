import { parseDate } from "./date-utils";

export type WeekdayKind = "sunday" | "weekday" | "saturday";
export const WEEKDAY_HEADERS = [
  { label: "日", kind: "sunday" }, { label: "月", kind: "weekday" }, { label: "火", kind: "weekday" },
  { label: "水", kind: "weekday" }, { label: "木", kind: "weekday" }, { label: "金", kind: "weekday" }, { label: "土", kind: "saturday" },
] as const;
export const WEEKDAY_COLORS: Record<WeekdayKind, string> = { sunday: "#D83E68", weekday: "#333333", saturday: "#3986A8" };

export const getWeekdayKind = (date: string): WeekdayKind => { const day = parseDate(date).getDay(); return day === 0 ? "sunday" : day === 6 ? "saturday" : "weekday"; };
export const getCalendarCell = (date: string) => { const parsed = parseDate(date); const first = new Date(parsed.getFullYear(), parsed.getMonth(), 1).getDay(); const cell = first + parsed.getDate() - 1; return { column: (cell % 7) + 1, row: Math.floor(cell / 7) + 1 }; };
