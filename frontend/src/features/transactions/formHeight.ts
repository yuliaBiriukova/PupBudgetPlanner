import type { TransactionType } from './transactionsApi';

/** Where the phone keeps how tall the form's fields were, per type. */
export const FORM_HEIGHT_KEY = 'pup.transactions.formHeight';

type Heights = Partial<Record<TransactionType, number>>;

function stored(): Heights {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(FORM_HEIGHT_KEY) ?? '{}');
    return value && typeof value === 'object' ? value : {};
  } catch {
    return {};
  }
}

/**
 * How tall the form's fields were the last time this type was open on this device, in pixels; null before the first
 * time. The phone's sheet is as tall as its content (I-029), so while the form's data loads its placeholder takes
 * this height: the sheet opens at the height the form will have and doesn't jump when the data arrives.
 */
export function rememberedFormHeight(type: TransactionType): number | null {
  const height = stored()[type];
  return typeof height === 'number' && height > 0 ? height : null;
}

export function rememberFormHeight(type: TransactionType, height: number) {
  if (height <= 0 || stored()[type] === height) return;
  try {
    localStorage.setItem(FORM_HEIGHT_KEY, JSON.stringify({ ...stored(), [type]: height }));
  } catch {
    // A private window: it just isn't remembered
  }
}
