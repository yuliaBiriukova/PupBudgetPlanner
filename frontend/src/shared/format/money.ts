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
 * An amount as the app shows it (DESIGN_RULES §5): `1 250.00 ₴`, `$1 240.00`, `€300.00`, `640.00 PLN`. Thousands
 * are split by no-break spaces, and a debt starts with a true minus (`−4 312.40 ₴`).
 */
export function formatMoney(value: number, currency: string): string {
  const [whole = '0', cents = '00'] = Math.abs(value).toFixed(2).split('.');
  const number = `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP)}.${cents}`;
  const before = SIGN_BEFORE[currency];
  const text = before ? `${before}${number}` : `${number}${NBSP}${currencySign(currency)}`;
  // −0.00 is still nothing owed
  return value < 0 && Math.abs(value) >= 0.005 ? `${TRUE_MINUS}${text}` : text;
}

/** The database keeps 16 digits before the point (`numeric(18,2)`). */
const AMOUNT_LIMIT = 1e16;

/**
 * An amount typed in a field, or null when it isn't one: spaces between digits are fine, the cents come after a
 * `.` or a `,` (DESIGN_RULES §5), and a debt starts with `-` or `−`. At most two digits of cents.
 */
export function parseAmount(text: string): number | null {
  const trimmed = text.trim();
  if (!/^[-−]?\d[\d\s]*([.,]\d{1,2})?$/.test(trimmed)) return null;
  const value = Number(trimmed.replace(/\s/g, '').replace(',', '.').replace(TRUE_MINUS, '-'));
  return Number.isFinite(value) && Math.abs(value) < AMOUNT_LIMIT ? value : null;
}

/** An amount for an amount field to start with: `1240.50`, `-300.00`. */
export function amountText(value: number): string {
  return value.toFixed(2);
}
