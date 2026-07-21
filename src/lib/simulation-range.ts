import type { SimulationMonths } from "@/types/planner";
import { addDays, endOfMonth, formatDate, parseDate, startOfMonth } from "./date-utils";

export type DateRange = { start: string; end: string };
export type DisplayMonth = { month: string; dates: string[] };

export function getSimulationRange(baseDate: string, months: SimulationMonths): DateRange {
  const base = parseDate(baseDate);
  const targetMonth = new Date(base.getFullYear(), base.getMonth() + months, 1);
  if (base.getDate() === 1) {
    return { start: baseDate, end: formatDate(new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 0)) };
  }
  const targetMonthLastDay = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();
  const endDay = Math.min(base.getDate() - 1, targetMonthLastDay);
  return { start: baseDate, end: formatDate(new Date(targetMonth.getFullYear(), targetMonth.getMonth(), endDay)) };
}

export function getDisplayRange(simulationRange: DateRange): DateRange {
  return { start: startOfMonth(simulationRange.start), end: endOfMonth(simulationRange.end) };
}

export function countInclusiveDays(start: string, end: string): number {
  const [startYear, startMonth, startDay] = start.split("-").map(Number);
  const [endYear, endMonth, endDay] = end.split("-").map(Number);
  return Math.floor((Date.UTC(endYear, endMonth - 1, endDay) - Date.UTC(startYear, startMonth - 1, startDay)) / 86_400_000) + 1;
}

export function isSimulationDate(date: string, range: DateRange) {
  return date >= range.start && date <= range.end;
}

export function getDisplayMonths(displayRange: DateRange): DisplayMonth[] {
  const months: DisplayMonth[] = [];
  let cursor = displayRange.start;
  while (cursor <= displayRange.end) {
    const month = cursor.slice(0, 7);
    const last = endOfMonth(cursor);
    const dates: string[] = [];
    for (let date = cursor; date <= last; date = addDays(date, 1)) dates.push(date);
    months.push({ month, dates });
    cursor = addDays(last, 1);
  }
  return months;
}
