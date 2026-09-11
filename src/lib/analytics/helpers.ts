export function toNumber(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function toDate(value: unknown): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function getRecordDate(record: Record<string, unknown>): Date | null {
  return (
    toDate(record.createdAt) ??
    toDate(record.date) ??
    toDate(record.invoiceDate) ??
    toDate(record.purchaseDate) ??
    toDate(record.expenseDate) ??
    toDate(record.updatedAt)
  );
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function isBetween(date: Date | null, start: Date, end: Date): boolean {
  return !!date && date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
}
