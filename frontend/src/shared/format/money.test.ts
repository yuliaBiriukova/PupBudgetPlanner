import { describe, expect, it } from 'vitest';
import { currencySign, formatMoney, parseAmount } from './money';

const NBSP = ' ';

describe('formatMoney', () => {
  it('puts $, € and £ before the number and the hryvnia sign or the code after it', () => {
    expect(formatMoney(1240, 'USD')).toBe(`$1${NBSP}240.00`);
    expect(formatMoney(300, 'EUR')).toBe('€300.00');
    expect(formatMoney(12.5, 'GBP')).toBe('£12.50');
    expect(formatMoney(1250, 'UAH')).toBe(`1${NBSP}250.00${NBSP}₴`);
    expect(formatMoney(640, 'PLN')).toBe(`640.00${NBSP}PLN`);
  });

  it('splits thousands and starts a debt with a true minus', () => {
    expect(formatMoney(250000, 'UAH')).toBe(`250${NBSP}000.00${NBSP}₴`);
    expect(formatMoney(-4312.4, 'UAH')).toBe(`−4${NBSP}312.40${NBSP}₴`);
    expect(formatMoney(-0.001, 'USD')).toBe('$0.00');
  });

  it('names the sign of each currency', () => {
    expect(currencySign('UAH')).toBe('₴');
    expect(currencySign('USD')).toBe('$');
    expect(currencySign('CHF')).toBe('CHF');
  });
});

describe('parseAmount', () => {
  it.each([
    ['1240.50', 1240.5],
    ['1240,5', 1240.5],
    ['21 500,50', 21500.5],
    [`1${NBSP}240`, 1240],
    ['-300', -300],
    ['−300', -300],
    [' 0 ', 0],
  ])('reads %s', (text, value) => {
    expect(parseAmount(text)).toBe(value);
  });

  it.each(['', 'abc', '1,240.50', '12.345', '1.2.3', '--5', '10000000000000000'])(
    'refuses %s',
    (text) => {
      expect(parseAmount(text)).toBeNull();
    },
  );
});
