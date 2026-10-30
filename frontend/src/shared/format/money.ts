/** A no-break space: an amount and its sign never land on two lines. */
const NBSP = ' ';

/** Currencies whose sign goes before the number; the hryvnia's goes after it, other codes too (F-014). */
const SIGN_BEFORE: Record<string, string> = { USD: '$', EUR: '€', GBP: '£' };

const TRUE_MINUS = '−';

/** The currency's sign: `$`, `€`, `£`, `₴`, or its code (`PLN`). */
export function currencySign(currency: string): string {
  return SIGN_BEFORE[currency] ?? (currency === 'UAH' ? '₴' : currency);
}

/**
 * Amounts are whole units, no cents (owner, 2026-10-30; ADR 0018): rounded half away from zero, as the API does
 * (`Money.Whole`): 1240.50 → 1241, −4312.50 → −4313.
 */
export function wholeAmount(value: number): number {
  const whole = Math.sign(value) * Math.round(Math.abs(value));
  // −0 is nothing owed
  return whole === 0 ? 0 : whole;
}

/**
 * An amount as the app shows it (DESIGN_RULES §5): `1 250 ₴`, `$1 240`, `€300`, `640 PLN`. Thousands are split by
 * no-break spaces, and a debt starts with a true minus (`−4 312 ₴`).
 */
export function formatMoney(value: number, currency: string): string {
  const whole = wholeAmount(value);
  const number = String(Math.abs(whole)).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  const before = SIGN_BEFORE[currency];
  const text = before ? `${before}${number}` : `${number}${NBSP}${currencySign(currency)}`;
  return whole < 0 ? `${TRUE_MINUS}${text}` : text;
}

/** The database keeps 16 digits before the point (`numeric(18,2)`). */
const AMOUNT_LIMIT = 1e16;

/**
 * An amount typed in a field, rounded to a whole unit, or null when it isn't one: spaces between digits are fine,
 * cents may come after a `.` or a `,` (DESIGN_RULES §5) and are rounded, and a debt starts with `-` or `−`.
 */
export function parseAmount(text: string): number | null {
  const trimmed = text.trim();
  if (!/^[-−]?\d[\d\s]*([.,]\d+)?$/.test(trimmed)) return null;
  const value = wholeAmount(
    Number(trimmed.replace(/\s/g, '').replace(',', '.').replace(TRUE_MINUS, '-')),
  );
  return Number.isFinite(value) && Math.abs(value) < AMOUNT_LIMIT ? value : null;
}

/** An amount for an amount field to show: `1241`, `-300`, `0`. */
export function amountText(value: number): string {
  return String(wholeAmount(value));
}
