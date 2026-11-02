import dayjs from 'dayjs';

/**
 * Days as the form and the API keep them: `YYYY-MM-DD` in the person's own time zone. The week starts on Monday
 * (DESIGN_RULES §5) and there are no days after today (owner, 2026-11-01).
 */

const ISO = 'YYYY-MM-DD';

export function today(): string {
  return dayjs().format(ISO);
}

export function addDays(day: string, days: number): string {
  return dayjs(day).add(days, 'day').format(ISO);
}

/** The Monday of the day's week. */
export function mondayOf(day: string): string {
  const d = dayjs(day);
  return d.subtract((d.day() + 6) % 7, 'day').format(ISO);
}

/** The seven days of the week starting on `monday`. */
export function weekFrom(monday: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/** `27 Oct`, with the year when it isn't this year's (`27 Oct 2025`). */
export function shortDay(day: string, now: string = today()): string {
  const d = dayjs(day);
  return d.format(d.year() === dayjs(now).year() ? 'D MMM' : 'D MMM YYYY');
}

/** A day as lists show it: `27 Oct 2026` (DESIGN_RULES §5). */
export function longDay(day: string): string {
  return dayjs(day).format('D MMM YYYY');
}

/** The week strip's title: "This week", or its first and last day (`19 Oct – 25 Oct`). */
export function weekTitle(monday: string, now: string = today()): string | null {
  if (monday === mondayOf(now)) return null;
  return `${shortDay(monday, now)} – ${shortDay(addDays(monday, 6), now)}`;
}

/** The days the list is grouped by, as the latest-first list shows them: today and yesterday by name. */
export type DayName = 'today' | 'yesterday' | 'other';

export function dayName(day: string, now: string = today()): DayName {
  return day === now ? 'today' : day === addDays(now, -1) ? 'yesterday' : 'other';
}
