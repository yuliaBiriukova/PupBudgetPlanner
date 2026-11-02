import { wholeAmount } from '../../shared/format/money';

/**
 * The amount field is a calculator (F-018 final prototype): it holds an amount (`250`) or a sum being typed
 * (`1200+350-100`), kept without spaces, with `-` for minus. Amounts are whole (ADR 0018): cents typed on the desktop
 * are rounded.
 */

/** A no-break space: a group of three digits never lands on a line of its own. */
const NBSP = ' ';
const TRUE_MINUS = '−';

/** The database keeps 16 digits before the point (`numeric(18,2)`). */
const AMOUNT_LIMIT = 1e16;

/** The most digits one number takes on the keys: up to 999 999 999. */
export const MAX_DIGITS = 9;

/** The key pad's keys: digits, `00`, delete the last, minus, plus and work the sum out. */
export type AmountKey =
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '00'
  | 'back'
  | 'minus'
  | 'plus'
  | 'equals';

/**
 * What the field works out to, rounded to a whole unit, or null when there is nothing to work out: `1200+350` →
 * 1550, `300-500` → −200, `12.5` → 13.
 */
export function evaluate(expression: string): number | null {
  const clean = expression.replace(/\s/g, '').replace(/,/g, '.').replace(/[−–]/g, '-');
  if (!clean) return null;
  const parts = clean.match(/[+-]?[^+-]+/g);
  if (parts?.join('') !== clean) return null;
  let sum = 0;
  for (const part of parts) {
    if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(part)) return null;
    sum += Number(part);
  }
  const whole = wholeAmount(sum);
  return Math.abs(whole) < AMOUNT_LIMIT ? whole : null;
}

/** Whether the field holds a sum (a + or − after a number), not yet one amount. */
export function isSum(expression: string): boolean {
  return /\d\s*[+\-−]/.test(expression);
}

/**
 * The field as shown: groups of three (`1 200`), a true minus and spaced signs (`1 200 + 350 − 100`). No space after
 * a trailing sign: Backspace would delete only the space, and the next redraw would put it back.
 */
export function showExpression(expression: string): string {
  return expression
    .replace(/\d+/g, (digits) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP))
    .replace(/-/g, ` ${TRUE_MINUS} `)
    .replace(/\+/g, ' + ')
    .trim();
}

/** What a person typed into the field (on the desktop), kept as the field holds it: digits, signs, `.` and `,`. */
export function fromTyped(text: string): string {
  return text.replace(/[−–]/g, '-').replace(/[^\d+\-.,]/g, '');
}

/** The field after a key on the pad. */
export function pressKey(expression: string, key: AmountKey): string {
  const lastNumber = /\d+$/.exec(expression)?.[0] ?? '';
  switch (key) {
    case 'back':
      return expression.slice(0, -1);
    case 'plus':
    case 'minus': {
      const sign = key === 'plus' ? '+' : '-';
      // A sign after a number; a second sign in a row takes the first one's place
      if (/\d$/.test(expression)) return expression + sign;
      if (/[+-]$/.test(expression)) return expression.slice(0, -1) + sign;
      return expression;
    }
    case 'equals': {
      const result = evaluate(expression);
      return result !== null && result > 0 ? String(result) : expression;
    }
    case '00':
      return lastNumber && lastNumber !== '0' && lastNumber.length <= MAX_DIGITS - 2
        ? `${expression}00`
        : expression;
    default:
      if (lastNumber.length >= MAX_DIGITS) return expression;
      // A lone 0 is replaced, not followed: 0 then 5 is 5
      return lastNumber === '0' ? expression.slice(0, -1) + key : expression + key;
  }
}
