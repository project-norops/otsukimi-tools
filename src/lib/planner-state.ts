import { RANKS, type DayPlan, type PlannerInput, type PlanValue } from "@/types/planner";

export const PLANNER_STORAGE_KEY = "otsukimi-tools:rank-planner";
export const PLANNER_STATE_VERSION = 1;
export const PLANNER_MEMO_LIMIT = 10;

export type PlannerPersistedState = {
  version: 1;
  input: PlannerInput;
  draft: PlannerInput;
  started: boolean;
  plans: Record<string, DayPlan>;
};

const planValues: PlanValue[] = [1, 2, 4, 6, "skip", "rest", "unset"];
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const isDate = (value: unknown): value is string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
const boundedInteger = (value: unknown, minimum: number, maximum: number) => typeof value === "number" && Number.isInteger(value) ? Math.min(maximum, Math.max(minimum, value)) : undefined;
const optionalText = (value: unknown, maximum: number) => typeof value === "string" ? Array.from(value).slice(0, maximum).join("") || undefined : undefined;

export const normalizePlannerMemo = (value?: string) => value === undefined ? undefined : Array.from(value).slice(0, PLANNER_MEMO_LIMIT).join("");

function normalizeInput(value: unknown): PlannerInput | undefined {
  if (!isRecord(value) || !isDate(value.baseDate) || typeof value.rank !== "string" || !RANKS.includes(value.rank as PlannerInput["rank"])) return undefined;
  const score = boundedInteger(value.score, 0, 17);
  const remainingDaysDisplay = boundedInteger(value.remainingDaysDisplay, 0, 6);
  const skipPasses = boundedInteger(value.skipPasses, 0, 999);
  if (score === undefined || remainingDaysDisplay === undefined || skipPasses === undefined) return undefined;
  return {
    baseDate: value.baseDate,
    rank: value.rank as PlannerInput["rank"],
    score,
    remainingDaysDisplay,
    skipPasses,
    planName: optionalText(value.planName, 30),
    displayName: optionalText(value.displayName, 30),
    debutDate: isDate(value.debutDate) ? value.debutDate : undefined,
  };
}

function normalizePlans(value: unknown): Record<string, DayPlan> {
  if (!isRecord(value)) return {};
  const plans: Record<string, DayPlan> = {};
  for (const [date, raw] of Object.entries(value)) {
    if (!isDate(date) || !isRecord(raw) || !planValues.includes(raw.value as PlanValue)) continue;
    plans[date] = {
      value: raw.value as PlanValue,
      memo: normalizePlannerMemo(typeof raw.memo === "string" ? raw.memo : undefined),
      weeklyGrant: typeof raw.weeklyGrant === "boolean" ? raw.weeklyGrant : undefined,
      manualGrant: boundedInteger(raw.manualGrant, 0, 999),
    };
  }
  return plans;
}

export function normalizePlannerState(value: unknown): PlannerPersistedState | undefined {
  if (!isRecord(value) || value.version !== PLANNER_STATE_VERSION) return undefined;
  const input = normalizeInput(value.input);
  const draft = normalizeInput(value.draft);
  if (!input || !draft || typeof value.started !== "boolean") return undefined;
  return { version: PLANNER_STATE_VERSION, input, draft, started: value.started, plans: normalizePlans(value.plans) };
}

export function encodePlannerState(state: PlannerPersistedState) {
  const bytes = new TextEncoder().encode(JSON.stringify(state));
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

export function decodePlannerState(encoded: string): PlannerPersistedState | undefined {
  try {
    const base64 = encoded.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(encoded.length / 4) * 4, "=");
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return normalizePlannerState(JSON.parse(new TextDecoder().decode(bytes)));
  } catch { return undefined; }
}

export function readSharedPlannerState(hash: string) {
  const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  const encoded = params.get("plan");
  return encoded ? decodePlannerState(encoded) : undefined;
}
