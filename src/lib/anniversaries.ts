import type { Anniversary } from "@/types/planner";
import { addDays, addMonthsClamped, parseDate } from "./date-utils";

function calendarLabel(months: number) {
  if (months === 1) return "1か月記念";
  if (months === 3) return "3か月記念";
  if (months === 6) return "半年記念";
  if (months % 12 === 0) return `${months / 12}周年`;
  return `${Math.floor(months / 12)}年6か月記念`;
}
export function generateAnniversaries(debutDate: string, startDate: string, endDate: string): Anniversary[] {
  const results: Anniversary[] = [];
  const inRange = (date: string) => date >= startDate && date <= endDate;
  for (const months of [1, 3, 6]) { const date = addMonthsClamped(debutDate, months); if (inRange(date)) results.push({ date, label: calendarLabel(months), kind: "calendar" }); }
  for (let months = 12; ; months += 6) { const date = addMonthsClamped(debutDate, months); if (date > endDate) break; if (inRange(date)) results.push({ date, label: calendarLabel(months), kind: "calendar" }); }
  const endDays = Math.ceil((parseDate(endDate).getTime() - parseDate(debutDate).getTime()) / 86400000);
  for (let days = 100; days <= endDays; days += 100) { const date = addDays(debutDate, days); if (inRange(date)) results.push({ date, label: `${days}日記念`, kind: "days" }); }
  return results.sort((a, b) => a.date.localeCompare(b.date));
}
