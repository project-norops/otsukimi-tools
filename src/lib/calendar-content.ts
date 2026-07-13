import type { SimulationDay } from "@/types/planner";

export interface CalendarEventLabel { key: string; full: string; compact: string; className: string }

export function getCalendarEventLabels(day: Pick<SimulationDay, "weeklyGrant" | "manualGrant" | "rankEvent">): CalendarEventLabel[] {
  const events: CalendarEventLabel[] = [];
  if (day.weeklyGrant > 0) events.push({ key: "weekly-grant", full: `スキパ +${day.weeklyGrant}`, compact: `SP+${day.weeklyGrant}`, className: "grant-chip" });
  if (day.manualGrant > 0) events.push({ key: "manual-grant", full: `スキパ +${day.manualGrant}`, compact: `SP+${day.manualGrant}`, className: "grant-chip" });
  if (day.rankEvent) {
    const labels = { up: ["ランクアップ", "アップ"], keep: ["ランクキープ", "キープ"], down: ["ランクダウン", "ダウン"] } as const;
    const [full, compact] = labels[day.rankEvent.type];
    events.push({ key: "rank-event", full, compact, className: `rank-chip ${day.rankEvent.type}` });
  }
  return events;
}

export const normalizeCalendarMemo = (memo?: string) => memo?.trim().replace(/\s+/g, " ") || undefined;

export function getPngMemoLines(memo?: string, charactersPerLine = 7): string[] {
  const normalized = normalizeCalendarMemo(memo);
  if (!normalized) return [];
  const characters = Array.from(normalized);
  const first = characters.slice(0, charactersPerLine).join("");
  const secondSlice = characters.slice(charactersPerLine, charactersPerLine * 2);
  if (secondSlice.length === 0) return [first];
  const truncated = characters.length > charactersPerLine * 2;
  const second = secondSlice.slice(0, truncated ? charactersPerLine - 1 : charactersPerLine).join("") + (truncated ? "…" : "");
  return [first, second];
}
