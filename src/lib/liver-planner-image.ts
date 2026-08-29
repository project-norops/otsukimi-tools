export type WeeklyShareItem = { time?: string; title: string; kind: "配信" | "予定" | "タスク" | "IRIAM"; thumbnail?: string };
export type WeeklyShareDay = { date: string; items: WeeklyShareItem[]; bonus?: string; memo?: string };
export type WeeklyImageOptions = { heading?: string };

const WIDTH = 1200, HEIGHT = 675, CARD_GAP = 18;
const CARD_WIDTH = (WIDTH - 72 - CARD_GAP * 3) / 4;
const roundedRect = (context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => { context.beginPath(); context.roundRect(x, y, width, height, radius); };
const shortTitle = (value: string, limit = 16) => value.length > limit ? `${value.slice(0, limit)}…` : value;
const dateParts = (date: string) => { const value = new Date(`${date}T12:00:00`); return { monthDay: `${value.getMonth() + 1}/${value.getDate()}`, weekday: "日月火水木金土"[value.getDay()] }; };
const holidayCache = new Map<number, Set<string>>();
const dateKey = (value: Date) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
const addHoliday = (holidays: Set<string>, year: number, month: number, day: number) => holidays.add(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
const nthMonday = (year: number, month: number, nth: number) => 1 + ((8 - new Date(year, month - 1, 1, 12).getDay()) % 7) + (nth - 1) * 7;

function japaneseHolidays(year: number) {
  const cached = holidayCache.get(year); if (cached) return cached;
  const holidays = new Set<string>();
  addHoliday(holidays, year, 1, 1);
  addHoliday(holidays, year, 1, nthMonday(year, 1, 2));
  addHoliday(holidays, year, 2, 11);
  addHoliday(holidays, year, 2, 23);
  addHoliday(holidays, year, 3, Math.floor(20.8431 + .242194 * (year - 1980) - Math.floor((year - 1980) / 4)));
  addHoliday(holidays, year, 4, 29);
  addHoliday(holidays, year, 5, 3);
  addHoliday(holidays, year, 5, 4);
  addHoliday(holidays, year, 5, 5);
  addHoliday(holidays, year, 7, nthMonday(year, 7, 3));
  addHoliday(holidays, year, 8, 11);
  addHoliday(holidays, year, 9, nthMonday(year, 9, 3));
  addHoliday(holidays, year, 9, Math.floor(23.2488 + .242194 * (year - 1980) - Math.floor((year - 1980) / 4)));
  addHoliday(holidays, year, 10, nthMonday(year, 10, 2));
  addHoliday(holidays, year, 11, 3);
  addHoliday(holidays, year, 11, 23);
  for (let day = new Date(year, 0, 2, 12); day.getFullYear() === year; day.setDate(day.getDate() + 1)) {
    const previous = new Date(day); previous.setDate(day.getDate() - 1);
    const next = new Date(day); next.setDate(day.getDate() + 1);
    if (holidays.has(dateKey(previous)) && holidays.has(dateKey(next))) holidays.add(dateKey(day));
  }
  for (const holiday of [...holidays]) {
    const value = new Date(`${holiday}T12:00:00`);
    if (value.getDay() !== 0) continue;
    do value.setDate(value.getDate() + 1); while (holidays.has(dateKey(value)));
    holidays.add(dateKey(value));
  }
  holidayCache.set(year, holidays);
  return holidays;
}

export function weeklyDateColor(date: string) {
  const value = new Date(`${date}T12:00:00`);
  if (value.getDay() === 0 || japaneseHolidays(value.getFullYear()).has(date)) return "#d94747";
  if (value.getDay() === 6) return "#2f6fc2";
  return "#35251f";
}

export function weeklyShareFilename(startDate: string) { return `配信予定_${startDate}.png`; }
export function extractRankBonus(title: string) { return title.match(/[+＋]\s*(\d+)/)?.[1]; }
export function weeklyBonusColors(bonus: string) {
  const level = Number(bonus);
  if (level === 6) return { background: "#c72f5b", text: "#fff" };
  if (level === 4) return { background: "#ffb3d0", text: "#7d2345" };
  if (level === 2) return { background: "#cfe4ff", text: "#234f7d" };
  return { background: "#ffe6a7", text: "#6b4700" };
}

export async function resizeThumbnail(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("画像ファイルを選んでください。");
  const source = URL.createObjectURL(file);
  try {
    const image = new Image(); image.src = source; await image.decode();
    const canvas = document.createElement("canvas"); canvas.width = 513; canvas.height = 513;
    const context = canvas.getContext("2d"); if (!context) throw new Error("画像を読み込めませんでした。");
    context.fillStyle = "#f7f0eb"; context.fillRect(0, 0, canvas.width, canvas.height);
    const scale = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
    const width = image.naturalWidth * scale, height = image.naturalHeight * scale;
    context.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
    return canvas.toDataURL("image/jpeg", .76);
  } finally { URL.revokeObjectURL(source); }
}

async function loadThumbnail(source?: string) {
  if (!source) return undefined;
  const image = new Image(); image.src = source;
  try { await image.decode(); return image; } catch { return undefined; }
}

export async function drawWeeklyPlannerImage(canvas: HTMLCanvasElement, days: WeeklyShareDay[], options: WeeklyImageOptions = {}) {
  canvas.width = WIDTH; canvas.height = HEIGHT;
  const context = canvas.getContext("2d"); if (!context) throw new Error("画像を作成できませんでした。");
  const gradient = context.createLinearGradient(0, 0, WIDTH, HEIGHT); gradient.addColorStop(0, "#fff8ef"); gradient.addColorStop(1, "#fde8e7");
  context.fillStyle = gradient; context.fillRect(0, 0, WIDTH, HEIGHT); context.fillStyle = "#d94747"; context.fillRect(0, 0, 18, HEIGHT);
  context.fillStyle = "#35251f"; context.font = "900 42px 'Noto Sans JP', sans-serif"; context.fillText(shortTitle(options.heading?.trim() || "今週の配信スケジュール", 20), 42, 58);
  const first = days[0] ? dateParts(days[0].date).monthDay : "", last = days.at(-1) ? dateParts(days.at(-1)!.date).monthDay : "";
  context.fillStyle = "#766a64"; context.font = "700 22px 'Noto Sans JP', sans-serif"; context.textAlign = "right"; context.fillText(`${first}（火）〜 ${last}（月） ｜ sushiusa.net`, WIDTH - 36, 55); context.textAlign = "left";

  for (const [index, day] of days.slice(0, 7).entries()) {
    const row = index < 4 ? 0 : 1, rowCount = row === 0 ? 4 : 3, rowWidth = CARD_WIDTH * rowCount + CARD_GAP * (rowCount - 1);
    const x = (row === 0 ? 36 : (WIDTH - rowWidth) / 2) + (index - row * 4) * (CARD_WIDTH + CARD_GAP), y = row === 0 ? 92 : 382, height = row === 0 ? 270 : 257;
    const { monthDay, weekday } = dateParts(day.date);
    const thumbnail = await loadThumbnail(day.items.find((item) => item.thumbnail)?.thumbnail);
    context.fillStyle = "rgba(255,255,255,.96)"; roundedRect(context, x, y, CARD_WIDTH, height, 22); context.fill(); context.strokeStyle = "#eadfd2"; context.lineWidth = 2; context.stroke();

    const imageX = x + 4, imageY = y + 4, imageWidth = CARD_WIDTH - 8, imageHeight = height - 8;
    context.save(); roundedRect(context, imageX, imageY, imageWidth, imageHeight, 18); context.clip();
    if (thumbnail) {
      const scale = Math.max(imageWidth / thumbnail.naturalWidth, imageHeight / thumbnail.naturalHeight), width = thumbnail.naturalWidth * scale, drawnHeight = thumbnail.naturalHeight * scale;
      context.drawImage(thumbnail, imageX + (imageWidth - width) / 2, imageY + (imageHeight - drawnHeight) / 2, width, drawnHeight);
    } else {
      const placeholder = context.createLinearGradient(imageX, imageY, imageX + imageWidth, imageY + imageHeight); placeholder.addColorStop(0, "#fce2e8"); placeholder.addColorStop(1, "#e4f0eb"); context.fillStyle = placeholder; context.fillRect(imageX, imageY, imageWidth, imageHeight);
      if (day.memo) {
        const characters = Array.from(day.memo);
        const lines = characters.length > 6 ? [characters.slice(0, 6).join(""), characters.slice(6, 12).join("")] : [characters.join("")];
        context.fillStyle = "#35251f"; context.font = "900 28px 'Noto Sans JP', sans-serif"; context.textAlign = "center";
        lines.forEach((line, lineIndex) => context.fillText(line, x + CARD_WIDTH / 2, y + height / 2 - (lines.length - 1) * 18 + lineIndex * 36));
        context.textAlign = "left";
      }
    }
    context.restore();
    context.fillStyle = "rgba(255,255,255,.94)"; roundedRect(context, x + 12, y + 12, 126, 48, 15); context.fill();
    context.fillStyle = weeklyDateColor(day.date); context.font = "900 29px 'Noto Sans JP', sans-serif"; context.fillText(monthDay, x + 23, y + 45); context.font = "800 17px 'Noto Sans JP', sans-serif"; context.fillText(`(${weekday})`, x + 95, y + 43);
    if (day.bonus) {
      const level = Number(day.bonus);
      const badgeWidth = level === 6 ? 102 : 82, badgeX = x + CARD_WIDTH - badgeWidth - 13;
      const colors = weeklyBonusColors(day.bonus);
      context.fillStyle = colors.background;
      roundedRect(context, badgeX, y + 12, badgeWidth, 48, 15); context.fill();
      context.fillStyle = colors.text; context.font = `900 ${level === 6 ? 24 : 27}px 'Noto Sans JP', sans-serif`;
      context.fillText(level === 6 ? `🔥+${day.bonus}` : `+${day.bonus}`, badgeX + (level === 6 ? 7 : 15), y + 45);
    }
  }
  return canvas.toDataURL("image/png");
}
