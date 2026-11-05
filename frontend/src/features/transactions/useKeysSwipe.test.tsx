import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../../app/AppProviders';
import { AmountKeys } from './AmountKeys';
import { useKeysSwipe } from './useKeysSwipe';

/** The phone keys with their swipe, as the transaction form has them. */
function Keys({ onFolded, onKey }: { onFolded: () => void; onKey: (key: string) => void }) {
  const { setKeys } = useKeysSwipe(onFolded);
  return (
    <AmountKeys value="" onKey={onKey} onSave={() => undefined} saving={false} keysRef={setKeys} />
  );
}

describe('useKeysSwipe', () => {
  /** jsdom has no layout or clock of its own: the keys are 260 px tall and each move takes `step` ms. */
  let now = 0;
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(260);
    vi.spyOn(performance, 'now').mockImplementation(() => now);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function keys() {
    const onFolded = vi.fn();
    const onKey = vi.fn();
    render(
      <AppProviders env="test">
        <Keys onFolded={onFolded} onKey={onKey} />
      </AppProviders>,
    );
    return { onFolded, onKey, group: screen.getByRole('group', { name: 'Amount keys' }) };
  }

  /** A finger down on `from`, moved by each of `distances`, `step` ms apart, and lifted. */
  function swipe(from: Element, distances: number[], step: number) {
    fireEvent.pointerDown(from, { button: 0, pointerId: 1, clientY: 100 });
    for (const d of distances) {
      now += step;
      fireEvent.pointerMove(from, { pointerId: 1, clientY: 100 + d });
    }
    fireEvent.pointerUp(from, { pointerId: 1, clientY: 100 + (distances.at(-1) ?? 0) });
  }

  it('follows the finger and folds them when let go past a quarter of their height', async () => {
    const { onFolded, group } = keys();
    const five = screen.getByRole('button', { name: '5' });
    fireEvent.pointerDown(five, { button: 0, pointerId: 1, clientY: 100 });
    now += 100;
    fireEvent.pointerMove(five, { pointerId: 1, clientY: 160 });
    // The first 8 px tell a swipe from a press: the keys move from there
    expect(group.style.transform).toBe('translateY(0px)');
    now += 200;
    fireEvent.pointerMove(five, { pointerId: 1, clientY: 240 });
    expect(group.style.transform).toBe('translateY(80px)');
    expect(group).toHaveAttribute('data-dragging');
    fireEvent.pointerUp(five, { pointerId: 1, clientY: 240 });

    // They slide out of sight, then fold
    expect(group.style.transform).toBe('translateY(100%)');
    await waitFor(() => {
      expect(onFolded).toHaveBeenCalledTimes(1);
    });
  });

  it('folds them on a flick down however short', async () => {
    const { onFolded } = keys();
    swipe(screen.getByRole('button', { name: '5' }), [10, 20, 30], 10);
    await waitFor(() => {
      expect(onFolded).toHaveBeenCalledTimes(1);
    });
  });

  it('slides them back when let go too early, and the key under the finger is not pressed', async () => {
    const { onFolded, onKey, group } = keys();
    const five = screen.getByRole('button', { name: '5' });
    swipe(five, [20, 40, 50], 200);
    fireEvent.click(five);
    expect(group.style.transform).toBe('');
    expect(group).not.toHaveAttribute('data-dragging');
    expect(onKey).not.toHaveBeenCalled();
    await new Promise((resolve) => setTimeout(resolve, 250));
    expect(onFolded).not.toHaveBeenCalled();
  });

  it('keeps a press that wobbles less than 8 px a press', () => {
    const { onFolded, onKey, group } = keys();
    const five = screen.getByRole('button', { name: '5' });
    swipe(five, [3, 6], 50);
    fireEvent.click(five);
    expect(onKey).toHaveBeenCalledWith('5');
    expect(group.style.transform).toBe('');
    expect(onFolded).not.toHaveBeenCalled();
  });
});
