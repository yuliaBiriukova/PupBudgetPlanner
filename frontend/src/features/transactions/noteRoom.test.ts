import { describe, expect, it } from 'vitest';
import { LIST_FOOT, LIST_GAP, noteRoomHeight } from './noteRoom';

describe('noteRoomHeight (B-014)', () => {
  const most = 254;

  it('is as high as a short list needs, not the whole sheet', () => {
    // One note: 44 px row, 12 px padding, 2 px border
    expect(noteRoomHeight(58, 0, most)).toBe(58 + LIST_GAP + LIST_FOOT);
  });

  it('counts the form already under the Note', () => {
    expect(noteRoomHeight(58, 30, most)).toBe(58 + LIST_GAP + LIST_FOOT - 30);
    expect(noteRoomHeight(58, 200, most)).toBe(0);
  });

  it('never brings the Note higher than the top of the sheet', () => {
    expect(noteRoomHeight(400, 0, most)).toBe(most);
    expect(noteRoomHeight(400, 0, -10)).toBe(0);
  });
});
