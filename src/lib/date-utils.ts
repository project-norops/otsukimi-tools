export function parseDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}
export function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function addDays(value: string, days: number): string {
  const date = parseDate(value); date.setDate(date.getDate() + days); return formatDate(date);
}
export function addMonthsClamped(value: string, months: number): string {
  const source = parseDate(value); const day = source.getDate();
  const target = new Date(source.getFullYear(), source.getMonth() + months, 1);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, last)); return formatDate(target);
}
