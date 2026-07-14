export const ICON_OUTPUT_SIZE = 513;
export const MIN_ICON_ZOOM = 1;
export const MAX_ICON_ZOOM = 4;

export type IconTransform = {
  baseScale: number;
  zoom: number;
  offsetX: number;
  offsetY: number;
};

export function createCoverTransform(width: number, height: number): IconTransform {
  if (width <= 0 || height <= 0) throw new Error("画像サイズが不正です。");
  return {
    baseScale: Math.max(ICON_OUTPUT_SIZE / width, ICON_OUTPUT_SIZE / height),
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
  };
}

export function clampZoom(zoom: number) {
  return Math.min(MAX_ICON_ZOOM, Math.max(MIN_ICON_ZOOM, zoom));
}

export function getIconDrawRect(width: number, height: number, transform: IconTransform) {
  const scale = transform.baseScale * transform.zoom;
  const drawWidth = width * scale;
  const drawHeight = height * scale;
  return {
    x: (ICON_OUTPUT_SIZE - drawWidth) / 2 + transform.offsetX,
    y: (ICON_OUTPUT_SIZE - drawHeight) / 2 + transform.offsetY,
    width: drawWidth,
    height: drawHeight,
  };
}

export function canvasDelta(clientDelta: number, displayedSize: number) {
  return displayedSize > 0 ? clientDelta * (ICON_OUTPUT_SIZE / displayedSize) : 0;
}
