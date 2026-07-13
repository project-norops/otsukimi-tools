export const SKIP_PASS_MAX = 10;
export const capSkipPasses = (count: number) => Math.max(0, Math.min(SKIP_PASS_MAX, count));
export function applySkipPassGrants(current: number, weekly: boolean, manual = 0) {
  const weeklyGrant = weekly ? 1 : 0;
  const manualGrant = Math.max(0, Math.floor(manual));
  return { total: capSkipPasses(current + weeklyGrant + manualGrant), weeklyGrant, manualGrant };
}
