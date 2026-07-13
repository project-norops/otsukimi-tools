import type { SimulationDay } from "@/types/planner";
const escape = (value: string) => value.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
export function createIcs(days: SimulationDay[], title = "IRIAMランク計画") {
  const events = days.filter((day) => day.plan.value !== "unset" || day.rankEvent).map((day) => {
    const date = day.date.replaceAll("-", "");
    const plan = typeof day.plan.value === "number" ? `+${day.plan.value}` : day.plan.value === "skip" ? "SKIP" : day.plan.value === "rest" ? "休み" : "";
    const summary = `[IRIAM] ${[plan, day.rankEvent?.label].filter(Boolean).join(" / ")}`;
    return ["BEGIN:VEVENT", `UID:${date}-${day.rankBefore}@otsukimi-tools`, `DTSTART;VALUE=DATE:${date}`, `SUMMARY:${escape(summary)}`, day.plan.memo ? `DESCRIPTION:${escape(day.plan.memo)}` : "", "END:VEVENT"].filter(Boolean).join("\r\n");
  });
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Otsukimi Tools//Rank Planner//JA", `X-WR-CALNAME:${escape(title)}`, ...events, "END:VCALENDAR", ""].join("\r\n");
}
