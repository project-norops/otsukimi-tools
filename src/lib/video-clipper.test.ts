import { describe, expect, it } from "vitest";
import { captionOutlineColor, clampClipRange, clampEffectTime, clampTimedOverlay, clipPresets, completedVideoDuration, endingPresets, fitClipToEffect, fitClipToTemplate, formatClipTime, minimumTemplateDuration, presetVideoFilter, templateTiming, templateVideoFilter, validateVideoInput } from "./video-clipper";

describe("video clipper limits", () => {
  it("accepts a video at the MVP limits", () => {
    expect(validateVideoInput({ type: "video/mp4", size: 100 * 1024 * 1024 }, 180)).toBeNull();
  });
  it("rejects oversized and overlong videos", () => {
    expect(validateVideoInput({ type: "video/mp4", size: 100 * 1024 * 1024 + 1 }, 10)).toContain("100MB");
    expect(validateVideoInput({ type: "video/mp4", size: 1 }, 180.01)).toContain("3分");
  });
  it("rejects a video shorter than the minimum output", () => {
    expect(validateVideoInput({ type: "video/mp4", size: 1 }, 0.9)).toContain("1秒未満");
  });
  it("keeps output between one and fifteen seconds", () => {
    expect(clampClipRange(10, 40, 60)).toEqual({ start: 10, end: 25 });
    expect(clampClipRange(59.5, 60, 60)).toEqual({ start: 59, end: 60 });
  });
  it("formats time for the editor", () => expect(formatClipTime(65.25)).toBe("1:05.3"));
  it("maps each fixed preset to a local licensed sound", () => {
    expect(clipPresets.every((preset) => preset.soundPath.startsWith("/audio/clipper/"))).toBe(true);
    expect(clipPresets.every((preset) => preset.duration >= 1.9)).toBe(true);
    expect(endingPresets.map((preset) => preset.id)).toEqual(["chiin", "shakiin"]);
    expect(clipPresets.some((preset) => preset.id === "kyupiin")).toBe(true);
  });
  it("builds a fixed 9:16 effect filter", () => {
    expect(presetVideoFilter("kyupiin", 2)).toContain("scale=720:1280");
    expect(presetVideoFilter("kyupiin", 2)).toContain("between(t,2.000,5.000)");
  });
  it("keeps the entire effect inside the selected clip", () => {
    expect(clampEffectTime(9.8, 2, 10, 0.8)).toBe(9.2);
    expect(clampEffectTime(1, 2, 10, 0.8)).toBe(2);
  });
  it("expands a short clip so the selected effect is not cut", () => {
    expect(fitClipToEffect(4, 5, 10, 3.1)).toEqual({ start: 4, end: 7.1 });
    expect(fitClipToEffect(8, 9, 10, 3.1)).toEqual({ start: 6.9, end: 10 });
  });
  it("adds the opening and ending outside the selected video", () => {
    expect(minimumTemplateDuration(3.4)).toBe(5.4);
    expect(fitClipToTemplate(2, 3, 12, 3.4)).toEqual({ start: 2, end: 3 });
    expect(templateTiming(4, 12, 3.4)).toEqual({ introAt: 0, introEnd: 2, videoAt: 2, videoEnd: 10, endingAt: 10, endingEnd: 13.4 });
    expect(completedVideoDuration(15, 3.4)).toBe(20.4);
  });
  it("builds a template filter with ending zoom only when needed", () => {
    expect(templateVideoFilter("shakiin", 6)).toContain("zoompan");
    expect(templateVideoFilter("shakiin", 6)).not.toContain("brightness=0.18");
    expect(templateVideoFilter("chiin", 6)).not.toContain("zoompan");
  });
  it("keeps a timed caption inside the clip", () => {
    expect(clampTimedOverlay(9, 3, 2, 10)).toEqual({ at: 7, duration: 3 });
    expect(clampTimedOverlay(2, 20, 2, 10)).toEqual({ at: 2, duration: 8 });
  });
  it("selects the caption outline using deterministic contrast math", () => {
    expect(captionOutlineColor("#ffffff")).toBe("#000000");
    expect(captionOutlineColor("#ffe34d")).toBe("#000000");
    expect(captionOutlineColor("#111111")).toBe("#ffffff");
  });
});
