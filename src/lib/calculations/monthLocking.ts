/**
 * Month Locking verification utility
 */
export function isPeriodLocked(
  date: Date | string,
  lockedMonths: { year: number; month: number }[]
): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 1-indexed month

  return lockedMonths.some(
    (lm) => lm.year === year && lm.month === month
  );
}
