import { describe, expect, it, vi } from "vitest";
import { shareOrDownloadCalendar } from "./calendar-share";
const file = { name: "rank-plan.ics" } as File;
describe("calendar file sharing", () => {
  it("uses device file sharing when supported", async () => { const share = vi.fn().mockResolvedValue(undefined); const fallback = vi.fn(); await expect(shareOrDownloadCalendar(file, { canShare: () => true, share }, fallback)).resolves.toBe("shared"); expect(share).toHaveBeenCalledWith(expect.objectContaining({ files: [file] })); expect(fallback).not.toHaveBeenCalled(); });
  it("downloads when file sharing is unavailable", async () => { const fallback = vi.fn(); await expect(shareOrDownloadCalendar(file, { canShare: () => false }, fallback)).resolves.toBe("downloaded"); expect(fallback).toHaveBeenCalledOnce(); });
});
