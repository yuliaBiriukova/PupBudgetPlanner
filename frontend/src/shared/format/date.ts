const DATE = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/** A date as lists show it: `27 Oct 2026` (DESIGN_RULES §5). Takes an ISO string or a Date. */
export function formatDate(value: string | Date): string {
  return DATE.format(typeof value === 'string' ? new Date(value) : value);
}

const DAY = 24 * 60 * 60 * 1000;

/** Whole days from `now` until `value`, rounded up: a link expiring later today has 1 day left. */
export function daysUntil(value: string | Date, now: Date = new Date()): number {
  const end = typeof value === 'string' ? new Date(value) : value;
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / DAY));
}
