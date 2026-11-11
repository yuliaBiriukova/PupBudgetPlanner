import { describe, expect, it } from 'vitest';
import { FORM_HEIGHT_KEY, rememberedFormHeight, rememberFormHeight } from './formHeight';

describe('the form’s remembered height (I-029)', () => {
  it('knows nothing before the form was open on this device', () => {
    expect(rememberedFormHeight('Expense')).toBeNull();
  });

  it('keeps each type’s own height', () => {
    rememberFormHeight('Expense', 596);
    rememberFormHeight('Transfer', 398);

    expect(rememberedFormHeight('Expense')).toBe(596);
    expect(rememberedFormHeight('Transfer')).toBe(398);
    expect(rememberedFormHeight('Income')).toBeNull();
  });

  it('takes the latest height, and no height at all from a form that isn’t laid out', () => {
    rememberFormHeight('Expense', 596);
    rememberFormHeight('Expense', 544);
    rememberFormHeight('Expense', 0);

    expect(rememberedFormHeight('Expense')).toBe(544);
  });

  it('reads what isn’t a height as nothing remembered', () => {
    localStorage.setItem(FORM_HEIGHT_KEY, 'not json');
    expect(rememberedFormHeight('Expense')).toBeNull();

    localStorage.setItem(FORM_HEIGHT_KEY, JSON.stringify({ Expense: 'tall' }));
    expect(rememberedFormHeight('Expense')).toBeNull();
  });
});
