export const MAX_INPUT_BYTES = 100 * 1024 * 1024;
export const MAX_INPUT_SECONDS = 180;
export const MIN_CLIP_SECONDS = 1;
export const MAX_CLIP_SECONDS = 15;

export type ClipPreset = "deden" | "chiin" | "kyupiin" | "shakiin";
export type EndingPreset = Exclude<ClipPreset, "deden">;

export const clipPresets: ReadonlyArray<{ id: ClipPreset; name: string; description: string; duration: number; soundPath: string; soundName: string }> = [
  { id: "deden", name: "ドドン！", description: "先頭画面を2秒静止してタイトル字幕", duration: 2, soundPath: "/audio/clipper/intro-dodon.mp3", soundName: "Onoma Impact03-2" },
  { id: "chiin", name: "チーン", description: "長い余韻に合わせて暗転", duration: 3.4, soundPath: "/audio/clipper/chiin.mp3", soundName: "Onoma Ding02-1 (Low-Long)" },
  { id: "kyupiin", name: "キュピーン", description: "発光と大きなスパーク", duration: 3, soundPath: "/audio/clipper/kyupiin.mp3", soundName: "Retro Anime Accent03-1 (High)" },
  { id: "shakiin", name: "シャキーン！", description: "静止画を3秒かけてズーム", duration: 3, soundPath: "/audio/clipper/shakiin.mp3", soundName: "Onoma Syakiin02-1 (Dry)" },
];

export const introPreset = clipPresets[0];
export const endingPresets = clipPresets.filter((preset) => preset.id === "chiin" || preset.id === "shakiin") as ReadonlyArray<(typeof clipPresets)[number] & { id: EndingPreset }>;

export function getClipPreset(preset: ClipPreset) {
  return clipPresets.find((item) => item.id === preset)!;
}

export function validateVideoInput(file: Pick<File, "type" | "size">, duration: number): string | null {
  if (!file.type.startsWith("video/")) return "動画ファイルを選択してください。";
  if (file.size > MAX_INPUT_BYTES) return "100MBを超える動画は読み込めません。";
  if (!Number.isFinite(duration) || duration <= 0) return "動画の長さを確認できませんでした。";
  if (duration < MIN_CLIP_SECONDS) return "1秒未満の動画は切り抜けません。";
  if (duration > MAX_INPUT_SECONDS) return "3分を超える動画は読み込めません。";
  return null;
}

export function clampClipRange(start: number, end: number, duration: number) {
  const safeDuration = Math.max(0, duration);
  const safeStart = Math.min(Math.max(0, start), Math.max(0, safeDuration - MIN_CLIP_SECONDS));
  const safeEnd = Math.min(Math.max(safeStart + MIN_CLIP_SECONDS, end), Math.min(safeDuration, safeStart + MAX_CLIP_SECONDS));
  return { start: safeStart, end: safeEnd };
}

export function formatClipTime(seconds: number) {
  const value = Math.max(0, seconds);
  const minutes = Math.floor(value / 60);
  return `${minutes}:${(value % 60).toFixed(1).padStart(4, "0")}`;
}

export function clampEffectTime(effectAt: number, start: number, end: number, duration: number) {
  return Math.min(Math.max(start, effectAt), Math.max(start, end - duration));
}

export function fitClipToEffect(start: number, end: number, sourceDuration: number, effectDuration: number) {
  const range = clampClipRange(start, end, sourceDuration);
  if (sourceDuration < effectDuration || range.end - range.start >= effectDuration) return range;
  const expandedEnd = Math.min(sourceDuration, range.start + effectDuration);
  return { start: Number(Math.max(0, expandedEnd - effectDuration).toFixed(3)), end: Number(expandedEnd.toFixed(3)) };
}

export function minimumTemplateDuration(endingDuration: number) {
  return Number((introPreset.duration + endingDuration).toFixed(3));
}

export function fitClipToTemplate(start: number, end: number, sourceDuration: number, endingDuration: number) {
  void endingDuration;
  return clampClipRange(start, end, sourceDuration);
}

export function templateTiming(start: number, end: number, endingDuration: number) {
  const videoDuration = Math.max(0, end - start);
  return {
    introAt: 0,
    introEnd: introPreset.duration,
    videoAt: introPreset.duration,
    videoEnd: introPreset.duration + videoDuration,
    endingAt: introPreset.duration + videoDuration,
    endingEnd: introPreset.duration + videoDuration + endingDuration,
  };
}

export function completedVideoDuration(videoDuration: number, endingDuration: number) {
  return Number((introPreset.duration + Math.max(0, videoDuration) + endingDuration).toFixed(3));
}

export function clampTimedOverlay(at: number, duration: number, start: number, end: number) {
  const available = Math.max(0.1, end - start);
  const safeDuration = Math.min(Math.max(0.1, duration), available);
  return {
    at: Math.min(Math.max(start, at), end - safeDuration),
    duration: safeDuration,
  };
}

export function captionOutlineColor(hexColor: string): "#000000" | "#ffffff" {
  const value = hexColor.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(value)) return "#000000";
  const channels = [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16) / 255)
    .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  const contrastWithBlack = (luminance + 0.05) / 0.05;
  const contrastWithWhite = 1.05 / (luminance + 0.05);
  return contrastWithBlack >= contrastWithWhite ? "#000000" : "#ffffff";
}

export function createPresetSound(preset: ClipPreset, duration = getClipPreset(preset).duration, sampleRate = 44100) {
  const sampleCount = Math.floor(duration * sampleRate);
  const bytes = new Uint8Array(44 + sampleCount * 2);
  const view = new DataView(bytes.buffer);
  const text = (offset: number, value: string) => [...value].forEach((character, index) => view.setUint8(offset + index, character.charCodeAt(0)));
  text(0, "RIFF"); view.setUint32(4, 36 + sampleCount * 2, true); text(8, "WAVE"); text(12, "fmt ");
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true); text(36, "data"); view.setUint32(40, sampleCount * 2, true);
  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / sampleRate;
    const fade = Math.max(0, 1 - time / duration);
    let sample = 0;
    if (preset === "chiin") {
      const bell = Math.sin(Math.PI * 2 * 1320 * time) + Math.sin(Math.PI * 2 * 1980 * time) * 0.5 + Math.sin(Math.PI * 2 * 2640 * time) * 0.22;
      sample = bell * Math.exp(-4.5 * time) * 0.38;
    } else if (preset === "kyupiin") {
      const frequency = 520 + 1750 * Math.pow(time / duration, 1.35);
      const sparkle = Math.sin(Math.PI * 2 * frequency * time) + Math.sin(Math.PI * 2 * (frequency * 1.5) * time) * 0.32;
      sample = sparkle * Math.sin(Math.min(1, time / 0.08) * Math.PI / 2) * fade * 0.38;
    } else {
      const firstHit = Math.sin(Math.PI * 2 * (155 - time * 180) * time) * Math.exp(-15 * time);
      const secondTime = Math.max(0, time - 0.22);
      const secondHit = time >= 0.22 ? Math.sin(Math.PI * 2 * (115 - secondTime * 100) * secondTime) * Math.exp(-10 * secondTime) : 0;
      sample = (firstHit + secondHit * 0.9) * 0.7;
    }
    sample = Math.max(-1, Math.min(1, sample));
    view.setInt16(44 + index * 2, sample * 32767, true);
  }
  return bytes;
}

export function presetVideoFilter(preset: ClipPreset, effectSeconds: number) {
  const duration = getClipPreset(preset).duration;
  const window = `between(t,${effectSeconds.toFixed(3)},${(effectSeconds + duration).toFixed(3)})`;
  if (preset === "shakiin") return "scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2,setsar=1";
  const effect = preset === "chiin"
    ? `eq=saturation=0.15:brightness=-0.22:enable='${window}'`
    : preset === "kyupiin"
      ? `eq=saturation=1.35:brightness=0.18:contrast=1.12:enable='${window}'`
      : `eq=contrast=1.35:saturation=1.15:enable='${window}',unsharp=5:5:1.2:5:5:0:enable='${window}'`;
  return `scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2,setsar=1,${effect}`;
}

export function templateVideoFilter(ending: EndingPreset, endingSeconds: number) {
  const endingDuration = getClipPreset(ending).duration;
  const endingWindow = `between(t,${endingSeconds.toFixed(3)},${(endingSeconds + endingDuration).toFixed(3)})`;
  const endingEffect = ending === "chiin"
    ? `eq=saturation=0.15:brightness=-0.22:enable='${endingWindow}'`
    : ending === "kyupiin" ? `eq=saturation=1.35:brightness=0.18:contrast=1.12:enable='${endingWindow}'` : "null";
  const zoom = ending === "shakiin"
    ? `,zoompan=z='min(1+on*0.00135,1.12)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=720x1280:fps=30`
    : ending === "kyupiin" ? `,zoompan=z=1.07:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=720x1280:fps=30` : "";
  return `scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2,setsar=1,${endingEffect}${zoom}`;
}
