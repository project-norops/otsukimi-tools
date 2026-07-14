"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { canvasDelta, clampZoom, createCoverTransform, getIconDrawRect, ICON_OUTPUT_SIZE, MAX_ICON_ZOOM, MIN_ICON_ZOOM, type IconTransform } from "@/lib/icon-ring";

type LoadedImage = { element: HTMLImageElement; name: string };
type PointerPosition = { x: number; y: number };

function loadImage(file: File): Promise<LoadedImage> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ element: image, name: file.name });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("画像を読み込めませんでした。別の画像をお試しください。"));
    };
    image.src = url;
  });
}

export function IconRingTool() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointers = useRef(new Map<number, PointerPosition>());
  const previousGesture = useRef<{ center: PointerPosition; distance: number } | null>(null);
  const [icon, setIcon] = useState<LoadedImage | null>(null);
  const [ring, setRing] = useState<LoadedImage | null>(null);
  const [transform, setTransform] = useState<IconTransform | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("アイコン画像と、規定サイズの透過PNGリングを選択してください。");

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.clearRect(0, 0, ICON_OUTPUT_SIZE, ICON_OUTPUT_SIZE);
    if (icon && transform) {
      const rect = getIconDrawRect(icon.element.naturalWidth, icon.element.naturalHeight, transform);
      context.drawImage(icon.element, rect.x, rect.y, rect.width, rect.height);
    }
    if (ring) context.drawImage(ring.element, 0, 0, ICON_OUTPUT_SIZE, ICON_OUTPUT_SIZE);
  }, [icon, ring, transform]);

  useEffect(draw, [draw]);

  async function chooseIcon(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setMessage("画像ファイルを選択してください。"); return; }
    try {
      const loaded = await loadImage(file);
      setIcon(loaded);
      setTransform(createCoverTransform(loaded.element.naturalWidth, loaded.element.naturalHeight));
      setMessage("ドラッグやピンチで、アイコンの位置と大きさを調整できます。");
    } catch (error) { setMessage(error instanceof Error ? error.message : "画像を読み込めませんでした。"); }
  }

  async function chooseRing(file?: File) {
    if (!file) return;
    if (file.type !== "image/png") { setMessage("リングには透過PNGを選択してください。"); return; }
    try {
      setRing(await loadImage(file));
      setMessage("リングを読み込みました。規定サイズの透過PNGを使用してください。");
    } catch (error) { setMessage(error instanceof Error ? error.message : "リング画像を読み込めませんでした。"); }
  }

  function resetPosition() {
    if (!icon) return;
    setTransform(createCoverTransform(icon.element.naturalWidth, icon.element.naturalHeight));
    setMessage("アイコンの位置と大きさを初期状態に戻しました。");
  }

  function pointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!icon) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
  }

  function pointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!transform || !pointers.current.has(event.pointerId)) return;
    const previous = pointers.current.get(event.pointerId)!;
    const current = { x: event.clientX, y: event.clientY };
    pointers.current.set(event.pointerId, current);
    const active = [...pointers.current.values()];
    const displayedSize = event.currentTarget.getBoundingClientRect().width;
    if (active.length === 1) {
      setTransform((value) => value ? { ...value, offsetX: value.offsetX + canvasDelta(current.x - previous.x, displayedSize), offsetY: value.offsetY + canvasDelta(current.y - previous.y, displayedSize) } : value);
      previousGesture.current = null;
      return;
    }
    const [first, second] = active;
    const center = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
    const distance = Math.hypot(first.x - second.x, first.y - second.y);
    const prior = previousGesture.current;
    if (prior && prior.distance > 0) {
      setTransform((value) => value ? { ...value, zoom: clampZoom(value.zoom * distance / prior.distance), offsetX: value.offsetX + canvasDelta(center.x - prior.center.x, displayedSize), offsetY: value.offsetY + canvasDelta(center.y - prior.center.y, displayedSize) } : value);
    }
    previousGesture.current = { center, distance };
  }

  function pointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    pointers.current.delete(event.pointerId);
    previousGesture.current = null;
  }

  async function saveImage() {
    if (!icon || !ring) { setMessage("アイコン画像とリング画像を両方選択してください。"); return; }
    if (saving) return;
    setSaving(true);
    setMessage("513×513pxのPNGを作成しています。少しお待ちください…");
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    draw();
    canvasRef.current!.toBlob((blob) => {
      if (!blob) {
        setMessage("PNGを作成できませんでした。もう一度お試しください。");
        setSaving(false);
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = "icon-with-ring.png";
      link.href = url;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage("513×513pxのPNGを保存しました。");
      setSaving(false);
    }, "image/png");
  }

  return <section className="icon-ring-shell">
    <header className="tool-intro icon-ring-intro"><span className="eyebrow">browser image tool</span><h1>アイコンリング装着ツール</h1><p>アイコンと透過PNGリングを選び、ドラッグ・ピンチで整えて保存。画像は端末内だけで処理します。</p></header>
    <div className="icon-ring-workspace">
      <div className="icon-ring-preview-wrap">
        <canvas ref={canvasRef} className="icon-ring-canvas" width={ICON_OUTPUT_SIZE} height={ICON_OUTPUT_SIZE} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} aria-label="アイコンリング合成プレビュー" />
        {!icon && <div className="icon-ring-placeholder" aria-hidden="true"><span>🖼️</span><b>画像を選ぶと<br />ここに表示されます</b></div>}
      </div>
      <div className="icon-ring-controls">
        <div className="icon-ring-files">
          <label className="image-file-button"><span>1</span><b>アイコン画像</b><small>{icon?.name ?? "画像を選択"}</small><input type="file" accept="image/*" onChange={(event) => chooseIcon(event.target.files?.[0])} /></label>
          <label className="image-file-button"><span>2</span><b>リング画像</b><small>{ring?.name ?? "透過PNGを選択"}</small><input type="file" accept="image/png" onChange={(event) => chooseRing(event.target.files?.[0])} /></label>
        </div>
        <label className="icon-zoom">大きさ <input type="range" min={MIN_ICON_ZOOM} max={MAX_ICON_ZOOM} step="0.01" value={transform?.zoom ?? 1} disabled={!icon} onChange={(event) => setTransform((value) => value ? { ...value, zoom: clampZoom(Number(event.target.value)) } : value)} /><output>{Math.round((transform?.zoom ?? 1) * 100)}%</output></label>
        <button className="text-button icon-reset" type="button" onClick={resetPosition} disabled={!icon}>位置と大きさをリセット</button>
        <p className="icon-ring-message" role="status">{message}</p>
        <button className="button icon-save" type="button" onClick={saveImage} disabled={!icon || !ring || saving} aria-busy={saving}>{saving ? "PNGを作成中…" : "画像を保存"}</button>
      </div>
    </div>
    <p className="disclaimer">出力は513×513pxのPNGです。リングは規定サイズで作成された透過PNGをご使用ください。画像はサーバーへ送信されません。</p>
  </section>;
}
