import { describe, expect, it } from 'vitest';
import { exchangeRateText as withNbsp, nbuRate, suggestedToAmount } from './exchange';

/** The rate with plain spaces: the app puts no-break ones between a number and its sign. */
const exchangeRateText = (...args: Parameters<typeof withNbsp>) =>
  withNbsp(...args).replaceAll(String.fromCharCode(0xa0), ' ');

/** Hryvnias for one unit, as the NBU gives them. */
const RATES = { USD: 45.53, EUR: 48.71, PLN: 11.3 };

describe('an exchange', () => {
  it('works the NBU rate out between any two currencies through the hryvnia', () => {
    expect(nbuRate('USD', 'UAH', RATES)).toBe(45.53);
    expect(nbuRate('UAH', 'USD', RATES)).toBeCloseTo(1 / 45.53);
    expect(nbuRate('EUR', 'USD', RATES)).toBeCloseTo(48.71 / 45.53);
    expect(nbuRate('USD', 'JPY', RATES)).toBeNull();
  });

  it('suggests what To gets at the NBU rate, whole', () => {
    expect(suggestedToAmount(100, 'USD', 'UAH', RATES)).toBe(4553);
    expect(suggestedToAmount(4600, 'UAH', 'USD', RATES)).toBe(101);
    expect(suggestedToAmount(1, 'UAH', 'USD', RATES)).toBeNull();
  });

  it('suggests nothing without an amount or a rate', () => {
    expect(suggestedToAmount(null, 'USD', 'UAH', RATES)).toBeNull();
    expect(suggestedToAmount(0, 'USD', 'UAH', RATES)).toBeNull();
    expect(suggestedToAmount(100, 'USD', 'UAH', {})).toBeNull();
  });

  it('writes the rate as one unit of the currency worth more, whichever way the money goes', () => {
    // Selling $100 for 4 490 ₴, and buying $100 for 4 600 ₴
    expect(exchangeRateText('USD', 'UAH', 4490 / 100, RATES)).toBe('$1 = 44.90 ₴');
    expect(exchangeRateText('UAH', 'USD', 100 / 4600, RATES)).toBe('$1 = 46.00 ₴');
    expect(exchangeRateText('USD', 'EUR', 92 / 100, RATES)).toBe('€1 = $1.09');
  });

  it('goes by the rate itself when the NBU has none', () => {
    expect(exchangeRateText('UAH', 'USD', 100 / 4600, {})).toBe('$1 = 46.00 ₴');
    expect(exchangeRateText('USD', 'UAH', 44.9, {})).toBe('$1 = 44.90 ₴');
  });
});
