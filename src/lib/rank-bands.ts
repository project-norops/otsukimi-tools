import type { Rank, SimulationDay } from "@/types/planner";
import { addDays } from "./date-utils";
import { getCalendarCell } from "./calendar-display";

export interface RankBandSegment {
  month: string;
  row: number;
  startColumn: number;
  span: number;
  rank: Rank;
  continuesBefore: boolean;
  continuesAfter: boolean;
}

const position = (date: string) => {
  const cell = getCalendarCell(date);
  return { month: date.slice(0, 7), row: cell.row, column: cell.column };
};

export function createRankBandSegments(days: SimulationDay[]): RankBandSegment[] {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const segments: RankBandSegment[] = [];
  let start = 0;
  const flush = (end: number) => {
    const first = sorted[start];
    if (!first) return;
    const firstPosition = position(first.date);
    const previous = sorted[start - 1];
    const next = sorted[end + 1];
    segments.push({
      month: firstPosition.month,
      row: firstPosition.row,
      startColumn: firstPosition.column,
      span: end - start + 1,
      rank: first.rankBefore,
      continuesBefore: Boolean(previous && addDays(previous.date, 1) === first.date && previous.rankBefore === first.rankBefore),
      continuesAfter: Boolean(next && addDays(sorted[end].date, 1) === next.date && next.rankBefore === first.rankBefore),
    });
  };
  for (let index = 1; index <= sorted.length; index++) {
    const previous = sorted[index - 1];
    const current = sorted[index];
    if (!current) { flush(index - 1); break; }
    const before = position(previous.date);
    const now = position(current.date);
    const continuous = addDays(previous.date, 1) === current.date && previous.rankBefore === current.rankBefore && before.month === now.month && before.row === now.row;
    if (!continuous) { flush(index - 1); start = index; }
  }
  return segments;
}
