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
  it('type digits and a sum, and = works it out', () => {
    expect(press('1', '2', '0', '0')).toBe('1200');
    expect(press('1', '2', '0', '0', 'plus', '3', '5', '0')).toBe('1200+350');
    expect(press('1', '2', '0', '0', 'plus', '3', '5', '0', 'equals')).toBe('1550');
  });

  it('take away the last digit, point or sign', () => {
    expect(press('1', '2', 'plus', 'back')).toBe('12');
    expect(press('1', '2', 'back', 'back', 'back')).toBe('');
    expect(press('1', '2', 'point', 'back')).toBe('12');
  });

  it('replace a sign typed right after another and ignore one before any number', () => {
    expect(press('5', 'plus', 'minus')).toBe('5-');
    expect(press('minus')).toBe('');
  });

  it('replace a lone 0', () => {
    expect(press('0', '5')).toBe('5');
    expect(press('5', 'plus', '0', '7')).toBe('5+7');
  });

  it('stop at 9 digits before the point', () => {
    const nine = press('1', '2', '3', '4', '5', '6', '7', '8', '9');
    expect(pressKey(nine, '1')).toBe(nine);
    expect(press('1', '2', '3', '4', '5', '6', '7', '8', '9', 'point', '5', '0')).toBe(
      '123456789.50',
    );
  });

  it('leave a sum of zero or less as it is on =', () => {
    expect(press('3', '0', '0', 'minus', '5', '0', '0', 'equals')).toBe('300-500');
  });
});

describe('the point key (I-027)', () => {
  it('types cents: one point a number, at most 2 digits after it', () => {
    expect(press('1', '2', 'point', '3', '0')).toBe('12.30');
    expect(press('1', '2', 'point', 'point', '3')).toBe('12.3');
    expect(press('1', '2', 'point', '3', '0', '5')).toBe('12.30');
    expect(press('1', 'point', '5', 'plus', '2', 'point', '2', '5')).toBe('1.5+2.25');
  });

  it('gives 0. first in a number', () => {
    expect(press('point', '5')).toBe('0.5');
    expect(press('7', 'plus', 'point')).toBe('7+0.');
    expect(press('0', 'point', '5')).toBe('0.5');
  });

  it('drops a point with nothing after it once the number is done', () => {
    expect(press('7', 'point', 'minus', '2')).toBe('7-2');
    expect(press('7', 'plus', '2', 'point', 'equals')).toBe('9');
  });

  it('rounds the sum once worked out, and the amount', () => {
    expect(press('1', '2', 'point', '3', '0', 'plus', '4', '5', 'point', '8', '0', 'equals')).toBe(
      '58',
    );
    expect(evaluate(press('1', '2', 'point', '5'))).toBe(13);
  });

  it('shows the cents as typed', () => {
    expect(
      showExpression(press('1', '2', 'point', '3', '0', 'plus', '4', '5', 'point', '8', '0')),
    ).toBe('12.30 + 45.80');
    expect(showExpression(press('1', '2', '0', '0', 'point', '5'))).toBe('1 200.5');
  });
});
