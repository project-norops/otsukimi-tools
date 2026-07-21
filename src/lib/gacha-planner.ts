export const GACHA_STORAGE_KEY = "sushiusa:gacha-planner:v1";
export const GACHA_STATE_VERSION = 3;
export const MAX_GACHA_PRIZES = 30;
export const GACHA_IMPORT_TEMPLATE_FILENAME = "ガチャ景品読み込みテンプレート.csv";
export const GACHA_IMPORT_TEMPLATE = [
  "レアリティ,景品名,確率,原価,在庫",
  "S,特賞,2,1000,2",
  "N,参加賞,98,0,",
].join("\r\n");
export type GachaMode = "normal" | "dark";
export type StockType = "unlimited" | "limited";
export type WarningSeverity = "error" | "warning" | "info";
export interface GachaPrize { id: string; rarity: string; name: string; probability: number; cost: number; stockType: StockType; stock: number | null }
export interface GachaDraft { version: 3; projectName: string; hostName: string; mode: GachaMode; pointsPerDraw: number; plannedDraws: number; fixedCost: number; targetRarity: string; bundleEnabled: boolean; bundleDraws: number; bundlePoints: number; noticeText: string; prizes: GachaPrize[] }
export interface GachaWarning { severity: WarningSeverity; code: string; message: string }
export interface GachaAnalysis { probabilityTotal: number; missProbability: number; singleTotalPoints: number; totalPoints: number; bundleCount: number; remainingSingleDraws: number; bundleSavingPoints: number; effectivePointsPerDraw: number; expectedCostPerDraw: number; expectedTotalCost: number; expectedRevenue: number; expectedMargin: number; contributionPerDraw: number; breakEvenDraws: number | null; targetProbabilityPerDraw: number; targetProbabilityAtPlan: number; warnings: GachaWarning[] }

const finite = (value: unknown, fallback = 0) => { const number = typeof value === "number" ? value : Number(value); return Number.isFinite(number) ? number : fallback; };
const clamp = (value: unknown, min: number, max: number, fallback = min) => Math.min(max, Math.max(min, finite(value, fallback)));
const text = (value: unknown, max: number) => String(value ?? "").trim().slice(0, max);

export const createDefaultGachaDraft = (): GachaDraft => ({
  version: GACHA_STATE_VERSION, projectName: "配信ガチャ企画", hostName: "", mode: "normal", pointsPerDraw: 500, plannedDraws: 100, fixedCost: 0, targetRarity: "S", bundleEnabled: false, bundleDraws: 11, bundlePoints: 5000, noticeText: "参加条件や景品の受け取り方法は配信内でご案内します。",
  prizes: [
    { id: "prize-1", rarity: "S", name: "特別デジタル特典", probability: 2, cost: 2000, stockType: "unlimited", stock: null },
    { id: "prize-2", rarity: "A", name: "限定画像", probability: 8, cost: 500, stockType: "unlimited", stock: null },
    { id: "prize-3", rarity: "B", name: "ボイス特典", probability: 20, cost: 150, stockType: "unlimited", stock: null },
    { id: "prize-4", rarity: "C", name: "お礼メッセージ", probability: 30, cost: 50, stockType: "unlimited", stock: null },
    { id: "prize-5", rarity: "D", name: "参加賞", probability: 40, cost: 0, stockType: "unlimited", stock: null },
  ],
});

export function normalizeGachaPrize(value: Partial<GachaPrize>, index: number): GachaPrize { const stockType: StockType = value.stockType === "limited" || (value.stockType == null && value.stock != null) ? "limited" : "unlimited"; return { id: text(value.id, 80) || `prize-${index + 1}`, rarity: text(value.rarity, 12) || "未設定", name: text(value.name, 60) || `景品${index + 1}`, probability: Number(clamp(value.probability, 0, 100).toFixed(4)), cost: Math.round(clamp(value.cost, 0, 10_000_000)), stockType, stock: stockType === "limited" ? Math.round(clamp(value.stock, 0, 100_000)) : null }; }

type LegacyDraft = Partial<Omit<GachaDraft, "version" | "mode" | "prizes" | "pointsPerDraw">> & { version?: number; mode?: string; pointsPerDraw?: number; revenuePerDraw?: number; prizes?: Array<Partial<GachaPrize>> };
export function normalizeGachaDraft(value: LegacyDraft): GachaDraft {
  const fallback = createDefaultGachaDraft(); const prizes = Array.isArray(value.prizes) ? value.prizes.slice(0, MAX_GACHA_PRIZES).map(normalizeGachaPrize) : fallback.prizes; const rawPoints = value.pointsPerDraw ?? value.revenuePerDraw;
  return { version: GACHA_STATE_VERSION, projectName: text(value.projectName, 60) || fallback.projectName, hostName: text(value.hostName, 40), mode: value.mode === "dark" ? "dark" : "normal", pointsPerDraw: Math.round(clamp(rawPoints, 0, 10_000_000, fallback.pointsPerDraw)), plannedDraws: Math.round(clamp(value.plannedDraws, 1, 10_000, fallback.plannedDraws)), fixedCost: Math.round(clamp(value.fixedCost, 0, 100_000_000)), targetRarity: text(value.targetRarity, 12) || fallback.targetRarity, bundleEnabled: value.bundleEnabled === true, bundleDraws: Math.round(clamp(value.bundleDraws, 2, 1000, fallback.bundleDraws)), bundlePoints: Math.round(clamp(value.bundlePoints, 0, 100_000_000, fallback.bundlePoints)), noticeText: text(value.noticeText, 160) || fallback.noticeText, prizes: prizes.length ? prizes : fallback.prizes };
}

export function probabilityAtLeastOnce(probability: number, draws: number) { const p = clamp(probability, 0, 1); return 1 - Math.pow(1 - p, Math.max(0, Math.floor(finite(draws)))); }
export function analyzeGacha(input: GachaDraft): GachaAnalysis {
  const d = normalizeGachaDraft(input); const probabilityTotal = d.prizes.reduce((s, p) => s + p.probability, 0); const missProbability = d.mode === "dark" ? Math.max(0, 100 - probabilityTotal) : 0; const singleTotalPoints = d.pointsPerDraw * d.plannedDraws; const bundleCount = d.bundleEnabled ? Math.floor(d.plannedDraws / d.bundleDraws) : 0; const remainingSingleDraws = d.plannedDraws - bundleCount * d.bundleDraws; const totalPoints = d.bundleEnabled ? bundleCount * d.bundlePoints + remainingSingleDraws * d.pointsPerDraw : singleTotalPoints; const bundleSavingPoints = singleTotalPoints - totalPoints; const effectivePointsPerDraw = totalPoints / d.plannedDraws;
  const expectedCostPerDraw = d.prizes.reduce((s, p) => s + p.cost * p.probability / 100, 0); const expectedTotalCost = expectedCostPerDraw * d.plannedDraws + d.fixedCost; const expectedRevenue = totalPoints; const contributionPerDraw = effectivePointsPerDraw - expectedCostPerDraw; const expectedMargin = expectedRevenue - expectedTotalCost; const breakEvenDraws = contributionPerDraw > 0 ? Math.ceil(d.fixedCost / contributionPerDraw) : null; const targetProbabilityPerDraw = d.prizes.filter(p => p.rarity === d.targetRarity).reduce((s, p) => s + p.probability / 100, 0); const targetProbabilityAtPlan = probabilityAtLeastOnce(targetProbabilityPerDraw, d.plannedDraws);
  const warnings: GachaWarning[] = [];
  if (d.mode === "normal" && Math.abs(probabilityTotal - 100) > .01) warnings.push({ severity: "error", code: "probability-total", message: `通常ガチャは排出率合計を100%にします。現在は${probabilityTotal.toFixed(2)}%です。` });
  if (d.mode === "dark" && probabilityTotal > 100.01) warnings.push({ severity: "error", code: "probability-over", message: `景品の排出率合計が${probabilityTotal.toFixed(2)}%です。100%以下にしてください。` });
  if (d.mode === "dark" && probabilityTotal <= 100.01) warnings.push({ severity: "info", code: "miss-rate", message: `はずれ率は${missProbability.toFixed(2)}%です。景品の排出率合計との差分から自動計算しています。` });
  if (d.bundleEnabled && d.bundlePoints >= d.pointsPerDraw * d.bundleDraws) warnings.push({ severity: "info", code: "bundle-not-discounted", message: "まとめ引きは単発を同じ回数引く場合より安くなっていません。ポイント設定をご確認ください。" });
  if (contributionPerDraw <= 0) warnings.push({ severity: "error", code: "negative-contribution", message: "ガチャ1回あたりの期待原価が実質ポイント以上です。ガチャ回数を増やしても固定費を回収できません。" }); else if (expectedMargin < 0) warnings.push({ severity: "warning", code: "negative-margin", message: `想定${d.plannedDraws}回では赤字見込みです。損益分岐は約${breakEvenDraws}回です。` });
  if (targetProbabilityPerDraw <= 0) warnings.push({ severity: "error", code: "target-missing", message: `対象レアリティ「${d.targetRarity}」の排出率が0%です。` });
  d.prizes.forEach(p => { if (p.stockType === "limited" && p.probability > 0 && p.stock === 0) warnings.push({ severity: "error", code: `zero-stock:${p.id}`, message: `「${p.name}」は排出率がありますが在庫0です。` }); if (p.stockType === "limited" && p.stock !== null && p.stock > 0) { const expected = d.plannedDraws * p.probability / 100; if (expected > p.stock) warnings.push({ severity: "warning", code: `stock-shortage:${p.id}`, message: `「${p.name}」は期待排出${expected.toFixed(1)}個に対して在庫${p.stock}個です。途中で枯渇する可能性があります。` }); else if (expected >= p.stock * .8) warnings.push({ severity: "info", code: `stock-near:${p.id}`, message: `「${p.name}」は想定ガチャ回数で在庫上限に近づきます。` }); } });
  if (!warnings.length) warnings.push({ severity: "info", code: "ready", message: "基本設定に大きな不整合は見つかりませんでした。前提と規約を確認してから告知してください。" });
  return { probabilityTotal, missProbability, singleTotalPoints, totalPoints, bundleCount, remainingSingleDraws, bundleSavingPoints, effectivePointsPerDraw, expectedCostPerDraw, expectedTotalCost, expectedRevenue, expectedMargin, contributionPerDraw, breakEvenDraws, targetProbabilityPerDraw, targetProbabilityAtPlan, warnings };
}

export const encodeGachaDraft = (draft: GachaDraft) => JSON.stringify(normalizeGachaDraft(draft));
export function decodeGachaDraft(value: string) { if (!value || value.length > 200_000) return undefined; try { const parsed = JSON.parse(value) as LegacyDraft; return (parsed.version === 1 || parsed.version === 2 || parsed.version === GACHA_STATE_VERSION) && Array.isArray(parsed.prizes) ? normalizeGachaDraft(parsed) : undefined; } catch { return undefined; } }
function parseLine(line: string) { const delimiter = line.includes("\t") ? "\t" : ","; const cells: string[] = []; let value = "", quoted = false; for (let i = 0; i < line.length; i += 1) { const c = line[i]; if (c === '"') { if (quoted && line[i + 1] === '"') { value += '"'; i += 1; } else quoted = !quoted; } else if (c === delimiter && !quoted) { cells.push(value.trim()); value = ""; } else value += c; } cells.push(value.trim()); return cells; }
export function sanitizeSpreadsheetText(value: string) { const clean = value.trim().slice(0, 60); return /^[=+\-@]/.test(clean) ? `'${clean}` : clean; }
export function parsePrizeTable(value: string) { const lines = value.split(/\r?\n/).map(l => l.trim()).filter(Boolean).slice(0, MAX_GACHA_PRIZES + 1); const data = lines[0] && /景品|確率|レア/i.test(lines[0]) ? lines.slice(1) : lines; return data.slice(0, MAX_GACHA_PRIZES).flatMap((line, i) => { const [rarity, name, probability, cost, stock] = parseLine(line); if (!name) return []; return [normalizeGachaPrize({ id: `pasted-${i + 1}`, rarity: sanitizeSpreadsheetText(rarity || "未設定"), name: sanitizeSpreadsheetText(name), probability: finite(probability), cost: finite(cost), stockType: stock == null || stock === "" ? "unlimited" : "limited", stock: stock == null || stock === "" ? null : finite(stock) }, i)]; }); }
export const formatYen = (value: number) => `${Math.round(value).toLocaleString("ja-JP")}円`;
export const formatPoints = (value: number) => `${Math.round(value).toLocaleString("ja-JP")}P`;
export const formatPercent = (value: number) => `${(value * 100).toFixed(value >= .1 ? 1 : 2)}%`;
