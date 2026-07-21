"use client";

import { useEffect, useRef, useState } from "react";
import { captionOutlineColor, clampTimedOverlay, completedVideoDuration, endingPresets, fitClipToTemplate, formatClipTime, getClipPreset, introPreset, MAX_CLIP_SECONDS, MIN_CLIP_SECONDS, type ClipPreset, type EndingPreset, validateVideoInput } from "@/lib/video-clipper";

type VideoSource = { url: string; name: string; duration: number };

function canvasPng(draw: (context: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = 720; canvas.height = 1280;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("演出画像を作成できませんでした。");
  draw(context);
  return new Promise<Uint8Array>((resolve, reject) => canvas.toBlob(async (blob) => {
    if (!blob) reject(new Error("演出画像を作成できませんでした。"));
    else resolve(new Uint8Array(await blob.arrayBuffer()));
  }, "image/png"));
}

function createEffectOverlay(preset: ClipPreset) {
  return canvasPng((context) => {
    if (preset === "kyupiin") {
      const stars = [[150,230,54],[560,330,34],[260,540,28],[515,690,58],[150,880,32],[420,1030,42]];
      context.shadowColor = "rgba(130,245,255,.95)"; context.shadowBlur = 24;
      for (const [x, y, radius] of stars) {
        context.beginPath();
        for (let point = 0; point < 16; point += 1) {
          const angle = -Math.PI / 2 + point * Math.PI / 8;
          const distance = point % 4 === 0 ? radius : point % 2 === 0 ? radius * .28 : radius * .12;
          const px = x + Math.cos(angle) * distance; const py = y + Math.sin(angle) * distance;
          if (point === 0) context.moveTo(px, py); else context.lineTo(px, py);
        }
        context.closePath(); context.fillStyle = "rgba(255,255,255,.96)"; context.fill();
      }
    }
    if (preset === "shakiin") {
      context.save(); context.translate(360, 640); context.rotate(-Math.PI / 5);
      const gradient = context.createLinearGradient(-520, 0, 520, 0);
      gradient.addColorStop(0, "rgba(255,255,255,0)"); gradient.addColorStop(.42, "rgba(115,239,255,.55)"); gradient.addColorStop(.5, "rgba(255,255,255,1)"); gradient.addColorStop(.58, "rgba(255,244,139,.7)"); gradient.addColorStop(1, "rgba(255,255,255,0)");
      context.shadowColor = "rgba(135,240,255,.95)"; context.shadowBlur = 42;
      context.fillStyle = gradient; context.fillRect(-560, -17, 1120, 34);
      context.fillStyle = "rgba(255,255,255,.9)"; context.fillRect(-440, -4, 880, 8);
      context.restore();
    }
  });
}

function createCreditOverlay() {
  return canvasPng((context) => {
    context.font = "600 18px sans-serif"; context.textAlign = "right";
    const label = "SE: OtoLogic (CC BY 4.0)";
    const width = context.measureText(label).width + 24;
    context.fillStyle = "rgba(0,0,0,.58)"; context.fillRect(720 - width - 12, 1238, width, 30);
    context.fillStyle = "rgba(255,255,255,.92)"; context.fillText(label, 696, 1260);
  });
}

async function createCaptionOverlay(text: string, color: string, position: "upper" | "lower" = "lower") {
  const fontFamily = '"Noto Sans JP Caption"';
  await document.fonts.load(`900 58px ${fontFamily}`, text);
  return canvasPng((context) => {
    const normalized = text.trim();
    if (!normalized) return;
    context.font = `900 58px ${fontFamily}, sans-serif`; context.textAlign = "center"; context.textBaseline = "middle";
    context.lineJoin = "round"; context.miterLimit = 2;
    const maxWidth = 620; const lines: string[] = [];
    for (const paragraph of normalized.split(/\r?\n/)) {
      let line = "";
      for (const character of paragraph) {
        if (context.measureText(line + character).width > maxWidth && line) { lines.push(line); line = character; }
        else line += character;
      }
      if (line) lines.push(line);
    }
    const visibleLines = lines.slice(0, 3); const lineHeight = 72;
    const centerY = position === "upper" ? 300 : 1050;
    const firstY = centerY - ((visibleLines.length - 1) * lineHeight) / 2;
    context.strokeStyle = captionOutlineColor(color); context.lineWidth = 13;
    context.fillStyle = color;
    visibleLines.forEach((line, index) => {
      const y = firstY + index * lineHeight;
      context.strokeText(line, 360, y, maxWidth); context.fillText(line, 360, y, maxWidth);
    });
  });
}

function SecondsInput({ label, value, min, max, onCommit }: { label: string; value: number; min: number; max: number; onCommit: (value: number) => void }) {
  const [draft, setDraft] = useState(value.toFixed(1));
  function commit() {
    const parsed = Number(draft);
    if (Number.isFinite(parsed)) onCommit(Math.min(max, Math.max(min, parsed)));
    else setDraft(value.toFixed(1));
  }
  return <span className="clipper-seconds"><input aria-label={label} inputMode="decimal" type="number" min={min} max={max} step="0.1" value={draft} onChange={(event) => setDraft(event.target.value)} onBlur={commit} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} />秒</span>;
}

export function VideoClipper() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sourceUrlRef = useRef<string | null>(null);
  const ffmpegRef = useRef<import("@ffmpeg/ffmpeg").FFmpeg | null>(null);
  const activeSoundRef = useRef<ClipPreset | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const freezeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const captionTimeoutRefs = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const [source, setSource] = useState<VideoSource | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(MAX_CLIP_SECONDS);
  const [ending, setEnding] = useState<EndingPreset>("chiin");
  const [message, setMessage] = useState("端末内の動画を選択してください。動画はサーバーへ送信されません。");
  const [stage, setStage] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [activeEffect, setActiveEffect] = useState<ClipPreset | null>(null);
  const [captionActive, setCaptionActive] = useState(false);
  const [endingCaptionActive, setEndingCaptionActive] = useState(false);
  const [freeCaptionActive, setFreeCaptionActive] = useState(false);
  const [previewPhase, setPreviewPhase] = useState<"idle" | "intro" | "video" | "ending">("idle");
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [captionText, setCaptionText] = useState("");
  const [captionColor, setCaptionColor] = useState("#ffffff");
  const [captionAt, setCaptionAt] = useState(0);
  const [captionDuration, setCaptionDuration] = useState(2);
  const [endingCaptionText, setEndingCaptionText] = useState("");
  const [endingCaptionColor, setEndingCaptionColor] = useState("#ffe34d");
  const [freeCaptionText, setFreeCaptionText] = useState("");
  const [freeCaptionColor, setFreeCaptionColor] = useState("#ffffff");
  const [freeCaptionAt, setFreeCaptionAt] = useState(introPreset.duration);
  const [freeCaptionDuration, setFreeCaptionDuration] = useState(2);
  const selectedPreset = getClipPreset(ending);
  const outlineColor = captionOutlineColor(captionColor);
  const endingOutlineColor = captionOutlineColor(endingCaptionColor);
  const freeOutlineColor = captionOutlineColor(freeCaptionColor);
  const videoDuration = Math.max(0, end - start);
  const outputDuration = completedVideoDuration(videoDuration, selectedPreset.duration);
  const effectFits = !source || source.duration === 0 || videoDuration + 0.001 >= MIN_CLIP_SECONDS;

  useEffect(() => {
    void document.fonts.load('900 58px "Noto Sans JP Caption"', "字幕");
    return () => {
      if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
      if (freezeTimeoutRef.current) clearTimeout(freezeTimeoutRef.current);
      captionTimeoutRefs.current.forEach(clearTimeout);
    };
  }, []);

  function chooseVideo(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("video/")) { setMessage("動画ファイルを選択してください。"); return; }
    if (file.size > 100 * 1024 * 1024) { setMessage("100MBを超える動画は読み込めません。"); return; }
    const url = URL.createObjectURL(file);
    if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
    sourceUrlRef.current = url;
    setPendingFile(file);
    setLoadingVideo(true);
    setSource(() => {
      return { url, name: file.name, duration: 0 };
    });
    setMessage("動画を読み込み中です。");
  }

  function videoLoadError() {
    setLoadingVideo(false);
    setMessage("動画を読み込めませんでした。別の動画を選択してください。");
  }

  function loadedMetadata() {
    const video = videoRef.current;
    if (!video || !pendingFile || !source) return;
    const error = validateVideoInput(pendingFile, video.duration);
    if (error) {
      setMessage(error);
      URL.revokeObjectURL(source.url);
      sourceUrlRef.current = null;
      setSource(null);
      setPendingFile(null);
      return;
    }
    const range = fitClipToTemplate(0, Math.min(MAX_CLIP_SECONDS, video.duration), video.duration, selectedPreset.duration);
    setSource({ ...source, duration: video.duration });
    setStart(range.start); setEnd(range.end); setCaptionAt(0);
    setCaptionDuration(Math.min(2, introPreset.duration));
    const nextOutputDuration = completedVideoDuration(range.end - range.start, selectedPreset.duration);
    const freeCaption = clampTimedOverlay(introPreset.duration, Math.min(2, nextOutputDuration - introPreset.duration), 0, nextOutputDuration);
    setFreeCaptionAt(freeCaption.at); setFreeCaptionDuration(freeCaption.duration);
    setLoadingVideo(false);
    setMessage("読み込み完了。動画部分の前後に演出時間を追加します。");
  }

  function applyRange(nextStart: number, nextEnd: number) {
    setStart(nextStart); setEnd(nextEnd);
    const caption = clampTimedOverlay(captionAt, captionDuration, 0, introPreset.duration);
    setCaptionAt(caption.at); setCaptionDuration(caption.duration);
    const nextOutputDuration = completedVideoDuration(nextEnd - nextStart, selectedPreset.duration);
    const freeCaption = clampTimedOverlay(freeCaptionAt, freeCaptionDuration, 0, nextOutputDuration);
    setFreeCaptionAt(freeCaption.at); setFreeCaptionDuration(freeCaption.duration);
  }

  function updateStart(value: number) {
    if (!source) return;
    const range = fitClipToTemplate(value, Math.max(end, value + MIN_CLIP_SECONDS), source.duration, selectedPreset.duration);
    applyRange(range.start, range.end);
  }

  function updateEnd(value: number) {
    if (!source) return;
    const range = fitClipToTemplate(start, value, source.duration, selectedPreset.duration);
    applyRange(range.start, range.end);
  }

  function playPresetSound(preset: ClipPreset) {
    const audio = previewAudioRef.current ?? new Audio();
    audio.pause(); audio.src = getClipPreset(preset).soundPath; audio.currentTime = 0;
    audio.preload = "auto"; audio.volume = 1; previewAudioRef.current = audio;
    void audio.play().catch(() => setMessage(`${getClipPreset(preset).name}の音を再生できませんでした。端末の音量設定をご確認ください。`));
  }

  function previewTemplate() {
    if (!videoRef.current) return;
    if (freezeTimeoutRef.current) clearTimeout(freezeTimeoutRef.current);
    captionTimeoutRefs.current.forEach(clearTimeout); captionTimeoutRefs.current = [];
    previewAudioRef.current?.pause();
    videoRef.current.pause();
    videoRef.current.currentTime = start;
    activeSoundRef.current = "deden";
    setPreviewPhase("intro"); setActiveEffect(null); setCaptionActive(false);
    setEndingCaptionActive(false); setFreeCaptionActive(false);
    playPresetSound("deden");
    if (captionText.trim()) {
      captionTimeoutRefs.current.push(setTimeout(() => setCaptionActive(true), captionAt * 1000));
      captionTimeoutRefs.current.push(setTimeout(() => setCaptionActive(false), (captionAt + captionDuration) * 1000));
    }
    if (freeCaptionText.trim()) {
      captionTimeoutRefs.current.push(setTimeout(() => setFreeCaptionActive(true), freeCaptionAt * 1000));
      captionTimeoutRefs.current.push(setTimeout(() => setFreeCaptionActive(false), (freeCaptionAt + freeCaptionDuration) * 1000));
    }
    for (let step = 1; step <= 5; step += 1) {
      const fadeAt = Math.max(0, introPreset.duration - 0.25) + step * 0.05;
      captionTimeoutRefs.current.push(setTimeout(() => {
        if (activeSoundRef.current !== "deden" || !previewAudioRef.current) return;
        previewAudioRef.current.volume = Math.max(0, 1 - step / 5);
        if (step === 5) previewAudioRef.current.pause();
      }, fadeAt * 1000));
    }
    freezeTimeoutRef.current = setTimeout(() => {
      if (!videoRef.current) return;
      setPreviewPhase("video"); setActiveEffect(null); setCaptionActive(false);
      activeSoundRef.current = null;
      void videoRef.current.play();
    }, introPreset.duration * 1000);
  }

  function startEndingPreview() {
    const video = videoRef.current;
    if (!video || previewPhase !== "video") return;
    video.pause(); video.currentTime = Math.max(start, end - 0.04);
    setPreviewPhase("ending"); setActiveEffect(ending); setCaptionActive(false);
    setEndingCaptionActive(Boolean(endingCaptionText.trim()));
    activeSoundRef.current = ending; playPresetSound(ending);
    if (freezeTimeoutRef.current) clearTimeout(freezeTimeoutRef.current);
    freezeTimeoutRef.current = setTimeout(() => {
      setPreviewPhase("idle"); setActiveEffect(null); setEndingCaptionActive(false); setFreeCaptionActive(false);
      activeSoundRef.current = null;
    }, selectedPreset.duration * 1000);
  }

  function chooseEnding(nextEnding: EndingPreset) {
    const next = getClipPreset(nextEnding);
    if (freezeTimeoutRef.current) clearTimeout(freezeTimeoutRef.current);
    setEnding(nextEnding);
    const nextOutputDuration = completedVideoDuration(videoDuration, next.duration);
    const freeCaption = clampTimedOverlay(freeCaptionAt, freeCaptionDuration, 0, nextOutputDuration);
    setFreeCaptionAt(freeCaption.at); setFreeCaptionDuration(freeCaption.duration);
    setActiveEffect(null); setEndingCaptionActive(false); setPreviewPhase("idle"); activeSoundRef.current = null;
  }

  function updateCaptionAt(value: number) {
    const next = clampTimedOverlay(value, captionDuration, 0, introPreset.duration);
    setCaptionAt(next.at); setCaptionDuration(next.duration);
  }

  function updateCaptionDuration(value: number) {
    const next = clampTimedOverlay(captionAt, value, 0, introPreset.duration);
    setCaptionAt(next.at); setCaptionDuration(next.duration);
  }

  function updateFreeCaptionAt(value: number) {
    const next = clampTimedOverlay(value, freeCaptionDuration, 0, outputDuration);
    setFreeCaptionAt(next.at); setFreeCaptionDuration(next.duration);
  }

  function updateFreeCaptionDuration(value: number) {
    const next = clampTimedOverlay(freeCaptionAt, value, 0, outputDuration);
    setFreeCaptionAt(next.at); setFreeCaptionDuration(next.duration);
  }

  async function exportClip() {
    if (!pendingFile || !source || exporting || !effectFits) return;
    setExporting(true);
    const inputName = "input-video";
    const outputName = "sushiusa-clip.mp4";
    try {
      setStage("変換機能を準備中");
      const { FFmpeg } = await import("@ffmpeg/ffmpeg");
      const ffmpeg = ffmpegRef.current ?? new FFmpeg();
      ffmpegRef.current = ffmpeg;
      if (!ffmpeg.loaded) await ffmpeg.load({ coreURL: "/ffmpeg/ffmpeg-core.js", wasmURL: "/ffmpeg/ffmpeg-core.wasm" });
      setStage("動画を読み込み中");
      await ffmpeg.writeFile(inputName, new Uint8Array(await pendingFile.arrayBuffer()));
      const loadSound = async (path: string, label: string) => {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`${label}の音源を読み込めませんでした。`);
        const sound = await response.arrayBuffer();
        if (sound.byteLength < 1000) throw new Error(`${label}の音源データが壊れています。`);
        return sound;
      };
      const [introSound, endingSound] = await Promise.all([
        loadSound(introPreset.soundPath, introPreset.name),
        loadSound(selectedPreset.soundPath, selectedPreset.name),
      ]);
      await ffmpeg.writeFile("intro-se.mp3", new Uint8Array(introSound));
      await ffmpeg.writeFile("ending-se.mp3", new Uint8Array(endingSound));
      await ffmpeg.writeFile("ending-overlay.png", await createEffectOverlay(ending));
      await ffmpeg.writeFile("credit-overlay.png", await createCreditOverlay());
      const hasCaption = Boolean(captionText.trim());
      const hasEndingCaption = Boolean(endingCaptionText.trim());
      const hasFreeCaption = Boolean(freeCaptionText.trim());
      if (hasCaption) await ffmpeg.writeFile("caption-overlay.png", await createCaptionOverlay(captionText, captionColor));
      if (hasEndingCaption) await ffmpeg.writeFile("ending-caption-overlay.png", await createCaptionOverlay(endingCaptionText, endingCaptionColor));
      if (hasFreeCaption) await ffmpeg.writeFile("free-caption-overlay.png", await createCaptionOverlay(freeCaptionText, freeCaptionColor, "upper"));
      setStage("エフェクトを合成中");
      const clipDuration = end - start;
      const totalDuration = completedVideoDuration(clipDuration, selectedPreset.duration);
      const endingOffset = introPreset.duration + clipDuration;
      const endingDelay = Math.round(endingOffset * 1000);
      const introDelay = Math.round(introPreset.duration * 1000);
      const lastFrameAt = Math.max(0, clipDuration - 0.04);
      const commonOutput = ["-map", "[v]", "-map", "[a]", "-t", totalDuration.toFixed(3), "-r", "30", "-c:v", "libx264", "-preset", "ultrafast", "-crf", "23", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", outputName];
      const inputs = ["-ss", start.toFixed(3), "-t", clipDuration.toFixed(3), "-i", inputName, "-i", "intro-se.mp3", "-i", "ending-se.mp3", "-loop", "1", "-i", "ending-overlay.png", "-loop", "1", "-i", "credit-overlay.png", ...(hasCaption ? ["-loop", "1", "-i", "caption-overlay.png"] : []), ...(hasEndingCaption ? ["-loop", "1", "-i", "ending-caption-overlay.png"] : []), ...(hasFreeCaption ? ["-loop", "1", "-i", "free-caption-overlay.png"] : [])];
      let nextOverlayIndex = 5;
      const introCaptionIndex = hasCaption ? nextOverlayIndex++ : -1;
      const endingCaptionIndex = hasEndingCaption ? nextOverlayIndex++ : -1;
      const freeCaptionIndex = hasFreeCaption ? nextOverlayIndex : -1;
      const endingBase = ending === "chiin"
        ? `[outroRaw]eq=saturation=0.15:brightness=-0.22[outro]`
        : ending === "shakiin"
          ? `[outroRaw]zoompan=z='min(1+on*0.00135,1.12)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=720x1280:fps=30[outro]`
          : `[outroRaw]zoompan=z=1.07:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=720x1280:fps=30[outroZoom];[3:v]format=rgba[endingFx];[outroZoom][endingFx]overlay=0:0[outro]`;
      const captionEnd = Math.min(introPreset.duration, captionAt + captionDuration);
      const introCaptionFilter = hasCaption ? `;[${introCaptionIndex}:v]format=rgba[introCaption];[credited][introCaption]overlay=0:0:enable='between(t,${captionAt.toFixed(3)},${captionEnd.toFixed(3)})'[withIntroCaption]` : ";[credited]null[withIntroCaption]";
      const endingCaptionFilter = hasEndingCaption ? `;[${endingCaptionIndex}:v]format=rgba[endingCaption];[withIntroCaption][endingCaption]overlay=0:0:enable='between(t,${endingOffset.toFixed(3)},${totalDuration.toFixed(3)})'[withEndingCaption]` : ";[withIntroCaption]null[withEndingCaption]";
      const freeCaptionTiming = clampTimedOverlay(freeCaptionAt, freeCaptionDuration, 0, totalDuration);
      const freeCaptionEnd = freeCaptionTiming.at + freeCaptionTiming.duration;
      const freeCaptionFilter = hasFreeCaption ? `;[${freeCaptionIndex}:v]format=rgba[freeCaption];[withEndingCaption][freeCaption]overlay=0:0:enable='between(t,${freeCaptionTiming.at.toFixed(3)},${freeCaptionEnd.toFixed(3)})'[v]` : ";[withEndingCaption]null[v]";
      const visualFilters = `[0:v]scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30,split=3[firstSource][motionSource][lastSource];[firstSource]trim=start=0:duration=0.040,setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop_duration=${introPreset.duration.toFixed(3)},trim=duration=${introPreset.duration.toFixed(3)}[intro];[motionSource]trim=duration=${clipDuration.toFixed(3)},setpts=PTS-STARTPTS[motion];[lastSource]trim=start=${lastFrameAt.toFixed(3)}:duration=0.040,setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop_duration=${selectedPreset.duration.toFixed(3)},trim=duration=${selectedPreset.duration.toFixed(3)}[outroRaw];${endingBase};[intro][motion][outro]concat=n=3:v=1:a=0[assembled];[4:v]format=rgba[credit];[assembled][credit]overlay=0:0[credited]${introCaptionFilter}${endingCaptionFilter}${freeCaptionFilter}`;
      const introFadeAt = Math.max(0, introPreset.duration - 0.25);
      const soundFilters = `[1:a]atrim=duration=${introPreset.duration.toFixed(3)},asetpts=PTS-STARTPTS,afade=t=out:st=${introFadeAt.toFixed(3)}:d=0.250,volume=1[introSe];[2:a]atrim=duration=${selectedPreset.duration.toFixed(3)},asetpts=PTS-STARTPTS,adelay=${endingDelay}:all=1,volume=1[endingSe]`;
      let result = await ffmpeg.exec([...inputs, "-filter_complex", `${visualFilters};${soundFilters};[0:a]atrim=duration=${clipDuration.toFixed(3)},asetpts=PTS-STARTPTS,adelay=${introDelay}:all=1[sourceAudio];[sourceAudio][introSe][endingSe]amix=inputs=3:duration=longest:dropout_transition=0:normalize=0,alimiter=limit=0.95,apad=pad_dur=${totalDuration.toFixed(3)}[a]`, ...commonOutput]);
      if (result !== 0) {
        await ffmpeg.deleteFile(outputName).catch(() => undefined);
        result = await ffmpeg.exec([...inputs, "-filter_complex", `${visualFilters};${soundFilters};[introSe][endingSe]amix=inputs=2:duration=longest:dropout_transition=0:normalize=0,alimiter=limit=0.95,apad=pad_dur=${totalDuration.toFixed(3)}[a]`, ...commonOutput]);
      }
      if (result !== 0) throw new Error("この動画をMP4へ変換できませんでした。");
      setStage("動画を書き出し中");
      const data = await ffmpeg.readFile(outputName);
      if (typeof data === "string") throw new Error("書き出した動画を読み取れませんでした。");
      const blob = new Blob([new Uint8Array(data)], { type: "video/mp4" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a"); link.href = url; link.download = outputName; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setStage("完了"); setMessage("MP4を書き出しました。端末のダウンロード先をご確認ください。");
      await Promise.all([ffmpeg.deleteFile(inputName), ffmpeg.deleteFile("intro-se.mp3"), ffmpeg.deleteFile("ending-se.mp3"), ffmpeg.deleteFile("ending-overlay.png"), ffmpeg.deleteFile("credit-overlay.png"), ...(hasCaption ? [ffmpeg.deleteFile("caption-overlay.png")] : []), ...(hasEndingCaption ? [ffmpeg.deleteFile("ending-caption-overlay.png")] : []), ...(hasFreeCaption ? [ffmpeg.deleteFile("free-caption-overlay.png")] : []), ffmpeg.deleteFile(outputName)]);
    } catch (error) {
      setStage(null);
      setMessage(error instanceof Error ? error.message : "動画を書き出せませんでした。もう一度お試しください。");
    } finally { setExporting(false); }
  }

  function cancelExport() {
    ffmpegRef.current?.terminate(); ffmpegRef.current = null; previewAudioRef.current?.pause(); setExporting(false); setStage(null); setMessage("書き出しをキャンセルしました。");
  }

  return <section className="clipper-shell">
    <header className="tool-intro clipper-intro"><span className="eyebrow">3-step video maker · MVP</span><h1>10秒動画メイカー</h1><p>「ドドン！」で始めて「チーン！」で終わる、3ステップ動画作成ツール</p><aside className="access-notice"><b>現在はすべて無料</b><span>現在、すべての機能を無料でご利用いただけます。今後の機能追加やアップデートに伴い、一部の高度な機能を有料オプション（プレミアムプラン等）として提供する場合があります。あらかじめご了承ください。</span></aside></header>
    <div className="clipper-notice"><b>読み込み上限</b><span>3分・100MBまで</span><b>おすすめ尺</b><span>10秒（最大15秒）</span></div>
    <label className={`clipper-file ${loadingVideo ? "is-loading" : ""}`}><b>{source ? source.name : "動画を選択"}</b><small>{loadingVideo ? "動画を読み込み中…" : "MP4など、端末で再生できる動画"}</small><input type="file" accept="video/*" onChange={(event) => chooseVideo(event.target.files?.[0])} /></label>
    {source && <div className="clipper-editor">
      <div className="clipper-preview-pane">
        <div className={`clipper-preview ${activeEffect ? `effect-${activeEffect}` : ""}`}><video ref={videoRef} src={source.url} controls={previewPhase === "idle"} playsInline preload="metadata" onLoadedMetadata={loadedMetadata} onError={videoLoadError} onTimeUpdate={(event) => { if (previewPhase === "video" && event.currentTarget.currentTime >= end - 0.02) startEndingPreview(); }} onEnded={() => { if (previewPhase === "video") startEndingPreview(); }} /><span className="clipper-effect-visual" aria-hidden="true" /><span className="clipper-effect-badge" aria-hidden="true">{activeEffect ? getClipPreset(activeEffect).name : ""}</span>{captionActive && <span className="clipper-caption" style={{ color: captionColor, WebkitTextStrokeColor: outlineColor }}>{captionText}</span>}{endingCaptionActive && <span className="clipper-caption" style={{ color: endingCaptionColor, WebkitTextStrokeColor: endingOutlineColor }}>{endingCaptionText}</span>}{freeCaptionActive && <span className="clipper-caption clipper-caption-secondary" style={{ color: freeCaptionColor, WebkitTextStrokeColor: freeOutlineColor }}>{freeCaptionText}</span>}<span className="clipper-audio-credit">SE: OtoLogic</span>{loadingVideo && <span className="clipper-loading-overlay" role="status" aria-live="polite"><i aria-hidden="true" /><b>動画を読み込み中…</b><small>完了すると編集画面が表示されます</small></span>}</div>
        {source.duration > 0 && <div className="clipper-mobile-preview-controls"><b>ドドン！ → 動画 {videoDuration.toFixed(1)}秒 → {selectedPreset.name}</b><span>完成予定 {outputDuration.toFixed(1)}秒</span><button className="button" type="button" onClick={previewTemplate} disabled={!effectFits}>テンプレ全体を確認</button><small>静止画・字幕・映像・SEを続けて確認できます</small></div>}
      </div>
      {source.duration > 0 && <div className="clipper-controls">
        <section><h2>1. 切り抜く範囲</h2><label>開始 <input type="range" min="0" max={Math.max(0, source.duration - MIN_CLIP_SECONDS)} step="0.1" value={start} onChange={(event) => updateStart(Number(event.target.value))} /><SecondsInput key={`start-${start}`} label="開始秒数" value={start} min={0} max={Math.max(0, end - MIN_CLIP_SECONDS)} onCommit={updateStart} /></label><label>終了 <input type="range" min={Math.min(source.duration, start + MIN_CLIP_SECONDS)} max={Math.min(source.duration, start + MAX_CLIP_SECONDS)} step="0.1" value={end} onChange={(event) => updateEnd(Number(event.target.value))} /><SecondsInput key={`end-${end}`} label="終了秒数" value={end} min={Math.min(source.duration, start + MIN_CLIP_SECONDS)} max={Math.min(source.duration, start + MAX_CLIP_SECONDS)} onCommit={updateEnd} /></label><p>{formatClipTime(start)}〜{formatClipTime(end)}・動画部分 {videoDuration.toFixed(1)}秒</p><small className="clipper-preview-note">演出は動画部分の前後に追加されます。完成予定は {outputDuration.toFixed(1)}秒です。</small></section>
        <section className="clipper-caption-controls"><h2>2. 冒頭の字幕</h2><textarea maxLength={60} rows={2} value={captionText} placeholder="例：まさかの展開！" onChange={(event) => setCaptionText(event.target.value)} /><div className="clipper-color-row"><b>文字色</b>{["#ffffff", "#ffe34d", "#ff6f91", "#6de7ff", "#111111"].map((color) => <button key={color} type="button" aria-label={`冒頭字幕の文字色 ${color}`} aria-pressed={captionColor === color} className={captionColor === color ? "is-selected" : ""} style={{ backgroundColor: color }} onClick={() => setCaptionColor(color)} />)}<input aria-label="冒頭字幕の文字色を自由に選ぶ" type="color" value={captionColor} onChange={(event) => setCaptionColor(event.target.value)} /></div><small className="clipper-outline-note">空欄なら字幕なし。Noto Sans JP Blackを使用し、縁取りは文字色から白／黒を数式で自動選択します（AI不使用）。</small><details className="clipper-advanced"><summary>字幕タイミングを細かく調整</summary><label>開始 <input type="range" min="0" max={Math.max(0, introPreset.duration - 0.1)} step="0.1" value={captionAt} onChange={(event) => updateCaptionAt(Number(event.target.value))} /><SecondsInput key={`caption-at-${captionAt}`} label="字幕開始秒数" value={captionAt} min={0} max={Math.max(0, introPreset.duration - 0.1)} onCommit={updateCaptionAt} /></label><label>表示 <input type="range" min="0.1" max={Math.max(0.1, introPreset.duration - captionAt)} step="0.1" value={captionDuration} onChange={(event) => updateCaptionDuration(Number(event.target.value))} /><SecondsInput key={`caption-duration-${captionDuration}`} label="字幕表示秒数" value={captionDuration} min={0.1} max={Math.max(0.1, introPreset.duration - captionAt)} onCommit={updateCaptionDuration} /></label></details><p>冒頭演出の {captionAt.toFixed(1)}秒後から {captionDuration.toFixed(1)}秒間</p></section>
        <section className="clipper-caption-controls"><h2>任意字幕（必要な場合）</h2><textarea maxLength={60} rows={2} value={freeCaptionText} placeholder="好きなタイミングに表示（空欄でもOK）" onChange={(event) => setFreeCaptionText(event.target.value)} /><div className="clipper-color-row"><b>任意字幕の文字色</b>{["#ffffff", "#ffe34d", "#ff6f91", "#6de7ff", "#111111"].map((color) => <button key={color} type="button" aria-label={`任意字幕の文字色 ${color}`} aria-pressed={freeCaptionColor === color} className={freeCaptionColor === color ? "is-selected" : ""} style={{ backgroundColor: color }} onClick={() => setFreeCaptionColor(color)} />)}<input aria-label="任意字幕の文字色を自由に選ぶ" type="color" value={freeCaptionColor} onChange={(event) => setFreeCaptionColor(event.target.value)} /></div><label>開始 <input type="range" min="0" max={Math.max(0, outputDuration - 0.1)} step="0.1" value={freeCaptionAt} onChange={(event) => updateFreeCaptionAt(Number(event.target.value))} /><SecondsInput key={`free-caption-at-${freeCaptionAt}`} label="任意字幕の開始秒数" value={freeCaptionAt} min={0} max={Math.max(0, outputDuration - 0.1)} onCommit={updateFreeCaptionAt} /></label><label>表示 <input type="range" min="0.1" max={Math.max(0.1, outputDuration - freeCaptionAt)} step="0.1" value={freeCaptionDuration} onChange={(event) => updateFreeCaptionDuration(Number(event.target.value))} /><SecondsInput key={`free-caption-duration-${freeCaptionDuration}`} label="任意字幕の表示秒数" value={freeCaptionDuration} min={0.1} max={Math.max(0.1, outputDuration - freeCaptionAt)} onCommit={updateFreeCaptionDuration} /></label><small className="clipper-outline-note">完成動画の {freeCaptionAt.toFixed(1)}秒後から {freeCaptionDuration.toFixed(1)}秒間。ほかの字幕と重なる場合は上側へ表示します。</small></section>
        <section className="clipper-caption-controls"><h2>3. 最後の演出とオチ字幕</h2><div className="clipper-presets">{endingPresets.map((item) => <button type="button" className={ending === item.id ? "is-selected" : ""} aria-pressed={ending === item.id} onClick={() => chooseEnding(item.id)} key={item.id}><b>{item.name}</b><small>{item.description}</small><em>追加 {item.duration.toFixed(1)}秒</em></button>)}</div><textarea maxLength={60} rows={2} value={endingCaptionText} placeholder="オチ字幕（空欄でもOK）" onChange={(event) => setEndingCaptionText(event.target.value)} /><div className="clipper-color-row"><b>オチ字幕の文字色</b>{["#ffffff", "#ffe34d", "#ff6f91", "#6de7ff", "#111111"].map((color) => <button key={color} type="button" aria-label={`オチ字幕の文字色 ${color}`} aria-pressed={endingCaptionColor === color} className={endingCaptionColor === color ? "is-selected" : ""} style={{ backgroundColor: color }} onClick={() => setEndingCaptionColor(color)} />)}<input aria-label="オチ字幕の文字色を自由に選ぶ" type="color" value={endingCaptionColor} onChange={(event) => setEndingCaptionColor(event.target.value)} /></div><small className="clipper-outline-note">空欄ならオチ字幕なし。終了演出の間だけ表示します。</small><div className="clipper-template-timeline"><span>冒頭</span><b>静止＋ドドン {introPreset.duration.toFixed(1)}秒</b><i>動画 {videoDuration.toFixed(1)}秒</i><b>静止＋{selectedPreset.name} {selectedPreset.duration.toFixed(1)}秒</b><span>完成 {outputDuration.toFixed(1)}秒</span></div><button className="text-button" type="button" onClick={previewTemplate} disabled={!effectFits}>テンプレ全体をプレビュー</button><small className="clipper-license">効果音: <a href="https://otologic.jp/" target="_blank" rel="noreferrer">OtoLogic</a>（CC BY 4.0）。完成動画へ音源表記を自動挿入します。</small></section>
        {stage && <div className="clipper-stage" role="status"><span className={stage === "変換機能を準備中" ? "is-current" : ""}>変換機能を準備中</span><span className={stage === "動画を読み込み中" ? "is-current" : ""}>動画を読み込み中</span><span className={stage === "エフェクトを合成中" ? "is-current" : ""}>エフェクトを合成中</span><span className={stage === "動画を書き出し中" ? "is-current" : ""}>動画を書き出し中</span><span className={stage === "完了" ? "is-current" : ""}>完了</span></div>}
        <button className="button clipper-export" type="button" disabled={exporting || loadingVideo || !effectFits} onClick={exportClip}>{exporting ? "MP4を書き出し中…" : "MP4を書き出す"}</button>
        {exporting && <button className="text-button clipper-cancel" type="button" onClick={cancelExport}>キャンセル</button>}
      </div>}
    </div>}
    <p className="clipper-status" role="status">{message}</p>
    <p className="disclaimer">初回は変換機能の準備に時間がかかる場合があります。書き出し時間は端末の性能、動画の長さ・画質によって変わります。</p>
  </section>;
}
