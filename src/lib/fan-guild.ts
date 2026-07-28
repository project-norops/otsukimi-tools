export type GuildMode = "passport" | "awards" | "relay" | "rewards";

export type PassportGrade = {
  id: "bronze" | "silver" | "gold" | "aurora";
  name: string;
  title: string;
  threshold: number;
  nextThreshold: number | null;
  colors: [string, string, string];
};

export const PASSPORT_GRADES: PassportGrade[] = [
  { id: "bronze", name: "BRONZE", title: "はじめましての旅人", threshold: 0, nextThreshold: 3, colors: ["#5a2f2a", "#d58a62", "#ffe0b5"] },
  { id: "silver", name: "SILVER", title: "また会えたねの仲間", threshold: 3, nextThreshold: 6, colors: ["#303747", "#9fb2ca", "#f4fbff"] },
  { id: "gold", name: "GOLD", title: "枠を照らす常連さん", threshold: 6, nextThreshold: 10, colors: ["#5a3b00", "#d99a17", "#fff3ad"] },
  { id: "aurora", name: "AURORA", title: "物語をつくる特別な人", threshold: 10, nextThreshold: null, colors: ["#2a164b", "#8b5cf6", "#5eead4"] },
];

export function getPassportGrade(completed: number) {
  return [...PASSPORT_GRADES].reverse().find((grade) => completed >= grade.threshold) ?? PASSPORT_GRADES[0];
}

export function getNextPassportGrade(completed: number) {
  const currentIndex = PASSPORT_GRADES.findIndex((grade) => grade.id === getPassportGrade(completed).id);
  return PASSPORT_GRADES[currentIndex + 1] ?? null;
}

export function stampsUntilNextGrade(completed: number) {
  const next = getNextPassportGrade(completed);
  return next ? Math.max(0, next.threshold - completed) : 0;
}

export type RewardStatus = "todo" | "making" | "checking" | "sent";

export const REWARD_STATUS_LABELS: Record<RewardStatus, string> = {
  todo: "未着手",
  making: "制作中",
  checking: "確認待ち",
  sent: "お渡し済み",
};

export function summarizeRewards(items: { status: RewardStatus }[]) {
  return (Object.keys(REWARD_STATUS_LABELS) as RewardStatus[]).reduce(
    (summary, status) => ({ ...summary, [status]: items.filter((item) => item.status === status).length }),
    {} as Record<RewardStatus, number>,
  );
}

export const FAN_GUILD_STORAGE_KEY = "sushiusa:fan-guild:v1";
