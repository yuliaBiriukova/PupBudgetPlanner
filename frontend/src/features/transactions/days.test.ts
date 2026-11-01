import { describe, expect, it } from 'vitest';
import { addDays, dayName, mondayOf, shortDay, weekFrom, weekTitle } from './days';

// Thursday 29 Oct 2026, the prototype's today
const NOW = '2026-10-29';

describe('days', () => {
  it('start the week on Monday', () => {
    expect(mondayOf(NOW)).toBe('2026-10-26');
    expect(mondayOf('2026-10-26')).toBe('2026-10-26');
    expect(mondayOf('2026-11-01')).toBe('2026-10-26');
    expect(weekFrom('2026-10-26')).toEqual([
      '2026-10-26',
      '2026-10-27',
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
    ]);
  });

  it('go back and forth over months and years', () => {
    expect(addDays('2026-11-01', -1)).toBe('2026-10-31');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('name this week, or give an earlier one its first and last day', () => {
    expect(weekTitle('2026-10-26', NOW)).toBeNull();
    expect(weekTitle('2026-10-19', NOW)).toBe('19 Oct – 25 Oct');
    expect(weekTitle('2025-12-29', NOW)).toBe('29 Dec 2025 – 4 Jan');
  });

  it('show the year only when it is not this one', () => {
    expect(shortDay('2026-10-27', NOW)).toBe('27 Oct');
    expect(shortDay('2025-10-27', NOW)).toBe('27 Oct 2025');
  });

  it('name today and yesterday', () => {
    expect(dayName(NOW, NOW)).toBe('today');
    expect(dayName('2026-10-28', NOW)).toBe('yesterday');
    expect(dayName('2026-10-27', NOW)).toBe('other');
  });
});
