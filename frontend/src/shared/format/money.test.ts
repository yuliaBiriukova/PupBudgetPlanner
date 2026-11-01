import { describe, expect, it } from 'vitest';
import {
  amountText,
  currencySign,
  formatMoney,
  formatRate,
  parseAmount,
  wholeAmount,
} from './money';

const NBSP = ' ';

describe('formatRate', () => {
  it('shows one unit with its sign or code, and the rate with two decimals', () => {
    expect(formatRate('USD', 41.3523, 'UAH')).toBe(`$1 = 41.35${NBSP}₴`);
    expect(formatRate('EUR', 48.1, 'UAH')).toBe(`€1 = 48.10${NBSP}₴`);
    expect(formatRate('PLN', 11.3, 'UAH')).toBe(`1${NBSP}PLN = 11.30${NBSP}₴`);
  });

  it('keeps three significant digits below one, and splits thousands', () => {
    expect(formatRate('JPY', 0.27118, 'UAH')).toBe(`1${NBSP}JPY = 0.271${NBSP}₴`);
    expect(formatRate('VND', 0.0015743, 'UAH')).toBe(`1${NBSP}VND = 0.00157${NBSP}₴`);
    expect(formatRate('KWD', 1350.5, 'UAH')).toBe(`1${NBSP}KWD = 1${NBSP}350.50${NBSP}₴`);
    expect(formatRate('UAH', 0.0242, 'USD')).toBe(`1${NBSP}UAH = $0.0242`);
  });
});

describe('formatMoney', () => {
  it('puts $, € and £ before the number and the hryvnia sign or the code after it, without cents', () => {
    expect(formatMoney(1240, 'USD')).toBe(`$1${NBSP}240`);
    expect(formatMoney(300, 'EUR')).toBe('€300');
    expect(formatMoney(12, 'GBP')).toBe('£12');
    expect(formatMoney(1250, 'UAH')).toBe(`1${NBSP}250${NBSP}₴`);
    expect(formatMoney(640, 'PLN')).toBe(`640${NBSP}PLN`);
  });

  it('splits thousands and starts a debt with a true minus', () => {
    expect(formatMoney(250000, 'UAH')).toBe(`250${NBSP}000${NBSP}₴`);
    expect(formatMoney(-4312, 'UAH')).toBe(`−4${NBSP}312${NBSP}₴`);
  });

  it('rounds to a whole unit, half away from zero', () => {
    expect(formatMoney(48210.5, 'UAH')).toBe(`48${NBSP}211${NBSP}₴`);
    expect(formatMoney(12784.1, 'UAH')).toBe(`12${NBSP}784${NBSP}₴`);
    expect(formatMoney(-4312.5, 'UAH')).toBe(`−4${NBSP}313${NBSP}₴`);
    expect(formatMoney(-0.4, 'USD')).toBe('$0');
    expect(wholeAmount(999.5)).toBe(1000);
    expect(wholeAmount(-0.4)).toBe(0);
  });

  it('names the sign of each currency', () => {
    expect(currencySign('UAH')).toBe('₴');
    expect(currencySign('USD')).toBe('$');
    expect(currencySign('CHF')).toBe('CHF');
  });
});

describe('parseAmount', () => {
  it.each([
    ['1240', 1240],
    ['1240.50', 1241],
    ['1240,49', 1240],
    ['21 500,50', 21501],
    [`1${NBSP}240`, 1240],
    ['-300', -300],
    ['−300.5', -301],
    ['12.345', 12],
    [' 0 ', 0],
  ])('reads %s as %s', (text, value) => {
    expect(parseAmount(text)).toBe(value);
  });

  it.each(['', 'abc', '1,240.50', '1.2.3', '--5', '10000000000000000'])('refuses %s', (text) => {
    expect(parseAmount(text)).toBeNull();
  });

  it('writes an amount for a field as a whole number', () => {
    expect(amountText(0)).toBe('0');
    expect(amountText(-300)).toBe('-300');
    expect(amountText(1240.5)).toBe('1241');
  });
});
