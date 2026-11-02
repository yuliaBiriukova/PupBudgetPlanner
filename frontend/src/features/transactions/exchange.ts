import { formatRate, wholeAmount } from '../../shared/format/money';

/**
 * An exchange (F-019 final prototype): a transfer between two currencies. Its second amount is suggested at the NBU
 * rate of the transaction's day and can be changed to what the bank gave; the rate is written as the app writes rates.
 */

/** Hryvnias for one unit of the currency at the day's rates; the hryvnia itself is 1. */
function hryvnias(currency: string, rates: Record<string, number>): number | undefined {
  return currency === 'UAH' ? 1 : rates[currency];
}

/** Units of `to` for one unit of `from` at the NBU rates; nothing without a rate for either. */
export function nbuRate(from: string, to: string, rates: Record<string, number>): number | null {
  const fromUah = hryvnias(from, rates);
  const toUah = hryvnias(to, rates);
  return fromUah === undefined || toUah === undefined || toUah === 0 ? null : fromUah / toUah;
}

/** What the To account gets for `amount` at the NBU rate, whole (ADR 0018); nothing without an amount or a rate. */
export function suggestedToAmount(
  amount: number | null,
  from: string,
  to: string,
  rates: Record<string, number>,
): number | null {
  const rate = nbuRate(from, to, rates);
  if (amount === null || amount <= 0 || rate === null) return null;
  const suggested = wholeAmount(amount * rate);
  return suggested > 0 ? suggested : null;
}

/**
 * A rate as the app writes rates (`formatRate`, F-017): one unit of the currency worth more, so selling and buying
 * dollars both read `$1 = 45.53 ₴`. `rate` is units of `to` for one `from`; which currency is worth more is the NBU's
 * say when its rates are there (so "Your rate" and "NBU" read the same way), else the rate's own.
 */
export function exchangeRateText(
  from: string,
  to: string,
  rate: number,
  rates: Record<string, number>,
): string {
  const nbu = nbuRate(from, to, rates);
  const fromWorthMore = nbu === null ? rate >= 1 : nbu >= 1;
  return fromWorthMore ? formatRate(from, rate, to) : formatRate(to, 1 / rate, from);
}
