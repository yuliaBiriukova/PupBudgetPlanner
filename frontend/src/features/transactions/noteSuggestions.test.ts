import { describe, expect, it } from 'vitest';
import { shownNotes, splitAtTyped } from './noteSuggestions';

const NOTES = [
  'Silpo',
  'Simcard top-up',
  'Silpo, wine for Friday',
  'Physio session',
  'Kids’ music lesson',
];

describe('the notes the list shows', () => {
  it('keeps the ones that still have what is typed, in the API’s order', () => {
    expect(shownNotes(NOTES, 'sil')).toEqual(['Silpo', 'Silpo, wine for Friday']);
  });

  it('ignores case, in Ukrainian too', () => {
    expect(shownNotes(['АТБ', 'Батарейки', 'Silpo'], 'АТ')).toEqual(['АТБ', 'Батарейки']);
  });

  it('shows none for an empty field and never the note that is typed already', () => {
    expect(shownNotes(NOTES, '  ')).toEqual([]);
    expect(shownNotes(NOTES, 'silpo ')).toEqual(['Silpo, wine for Friday']);
  });

  it('shows at most 5', () => {
    expect(shownNotes([...NOTES, 'Simple', 'Sister'], 's')).toHaveLength(5);
  });
});

describe('a note split at what is typed', () => {
  it('finds it anywhere, ignoring case', () => {
    expect(splitAtTyped('Physio session', 'SI')).toEqual(['Phy', 'si', 'o session']);
    expect(splitAtTyped('Квартплата', 'ат')).toEqual(['Квартпл', 'ат', 'а']);
  });

  it('keeps the note whole when it hasn’t it', () => {
    expect(splitAtTyped('Silpo', 'xy')).toEqual(['Silpo', '', '']);
    expect(splitAtTyped('Silpo', '')).toEqual(['Silpo', '', '']);
  });
});
