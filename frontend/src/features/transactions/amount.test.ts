import { describe, expect, it } from 'vitest';
import { evaluate, fromTyped, isSum, pressKey, showExpression, type AmountKey } from './amount';

/** The field after pressing these keys, starting empty. */
const press = (...keys: AmountKey[]) => keys.reduce(pressKey, '');

describe('the amount field', () => {
  it('works out an amount or a sum, rounded to a whole unit', () => {
    expect(evaluate('250')).toBe(250);
    expect(evaluate('1200+350')).toBe(1550);
    expect(evaluate('300-500')).toBe(-200);
    expect(evaluate('1 200 + 350 − 100')).toBe(1450);
    expect(evaluate('12.5')).toBe(13);
    expect(evaluate('12,4')).toBe(12);
  });

  it('has nothing to work out when empty or unfinished', () => {
    expect(evaluate('')).toBeNull();
    expect(evaluate('12+')).toBeNull();
    expect(evaluate('1.2.3')).toBeNull();
    expect(evaluate('99999999999999999')).toBeNull();
  });

  it('knows a sum from one amount', () => {
    expect(isSum('250')).toBe(false);
    expect(isSum('1200+')).toBe(true);
    expect(isSum('1200-350')).toBe(true);
  });

  it('shows groups of three, a true minus and spaced signs, with nothing after a trailing sign', () => {
    expect(showExpression('48211')).toBe('48 211');
    expect(showExpression('1200+350-100')).toBe('1 200 + 350 − 100');
    expect(showExpression('1200+')).toBe('1 200 +');
  });

  it('keeps digits, signs and the decimal point of what was typed', () => {
    expect(fromTyped('1 200 + 350 − 100')).toBe('1200+350-100');
    expect(fromTyped('12,50 ₴')).toBe('12,50');
  });
});

describe('the amount keys', () => {
  it('type digits, 00 and a sum, and = works it out', () => {
    expect(press('1', '2', '00')).toBe('1200');
    expect(press('1', '2', '00', 'plus', '3', '5', '0')).toBe('1200+350');
    expect(press('1', '2', '00', 'plus', '3', '5', '0', 'equals')).toBe('1550');
  });

  it('take away the last digit or sign', () => {
    expect(press('1', '2', 'plus', 'back')).toBe('12');
    expect(press('1', '2', 'back', 'back', 'back')).toBe('');
  });

  it('replace a sign typed right after another and ignore one before any number', () => {
    expect(press('5', 'plus', 'minus')).toBe('5-');
    expect(press('minus')).toBe('');
  });

  it('replace a lone 0 and skip 00 before a number', () => {
    expect(press('0', '5')).toBe('5');
    expect(press('00')).toBe('');
    expect(press('0', '00')).toBe('0');
  });

  it('stop at 9 digits a number', () => {
    const nine = press('1', '2', '3', '4', '5', '6', '7', '8', '9');
    expect(pressKey(nine, '1')).toBe(nine);
    expect(press('1', '2', '3', '4', '5', '6', '7', '8', '00')).toBe('12345678');
  });

  it('leave a sum of zero or less as it is on =', () => {
    expect(press('3', '00', 'minus', '5', '00', 'equals')).toBe('300-500');
  });
});
