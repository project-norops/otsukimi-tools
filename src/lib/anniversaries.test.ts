import { describe, expect, it } from "vitest";
import { generateAnniversaries } from "./anniversaries";
describe("anniversaries", () => {
  it("generates calendar and 100-day milestones", () => { const events = generateAnniversaries("2025-01-31", "2025-02-01", "2026-08-01"); expect(events).toContainEqual({ date: "2025-02-28", label: "1か月記念", kind: "calendar" }); expect(events.some(e => e.label === "100日記念")).toBe(true); expect(events.some(e => e.label === "1周年")).toBe(true); });
  it("keeps calendar and elapsed-day milestones as independent events", () => { const events = generateAnniversaries("2024-01-01", "2024-01-01", "2030-01-01"); expect(events.filter(event => event.kind === "calendar").length).toBeGreaterThan(5); expect(events.filter(event => event.kind === "days").length).toBeGreaterThan(10); expect(new Set(events.map(event => `${event.date}:${event.label}`)).size).toBe(events.length); });
  it("adds every three-or-more-digit repeated-day milestone in range", () => {
    const events = generateAnniversaries("2020-01-01", "2020-01-01", "2024-01-01");
    const dayLabels = events.filter(event => event.kind === "days").map(event => event.label);
    expect(dayLabels).toEqual(expect.arrayContaining([
      "111日記念",
      "222日記念",
      "999日記念",
      "1111日記念",
    ]));
    expect(dayLabels).not.toContain("11日記念");
    expect(dayLabels).not.toContain("2222日記念");
  });
});
