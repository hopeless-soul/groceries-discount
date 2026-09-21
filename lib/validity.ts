const DAY_MS = 24 * 60 * 60 * 1000;

export function computeDaysLeft(validUntil: string, now: Date = new Date()): number {
  const diffMs = new Date(validUntil).getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / DAY_MS));
}

export function computeRingPercent(
  validFrom: string,
  validUntil: string,
  now: Date = new Date(),
): number {
  const from = new Date(validFrom).getTime();
  const until = new Date(validUntil).getTime();
  const total = until - from;
  if (total <= 0) return 100;
  const elapsed = now.getTime() - from;
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

export function getUrgencyColor(daysLeft: number): string {
  if (daysLeft <= 1) return "#dc2626";
  if (daysLeft <= 3) return "#d97706";
  return "#18181b";
}
