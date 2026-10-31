import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../../app/AppProviders';
import { BottomSheet } from './BottomSheet';
import { CLOSE_SHARE, FLICK_SPEED, shouldClose } from './useSheetSwipe';

describe('shouldClose', () => {
  it('closes past a quarter of the height', () => {
    expect(CLOSE_SHARE).toBe(0.25);
    expect(shouldClose(101, 400, 0)).toBe(true);
    expect(shouldClose(99, 400, 0)).toBe(false);
  });

  it('closes on a flick down however short, but not on a wobbly tap', () => {
    expect(shouldClose(20, 400, FLICK_SPEED + 0.1)).toBe(true);
    expect(shouldClose(20, 400, FLICK_SPEED - 0.1)).toBe(false);
    expect(shouldClose(4, 400, 2)).toBe(false);
  });

  it('never closes when let go above where it started', () => {
    expect(shouldClose(-30, 400, -2)).toBe(false);
  });
});

describe('BottomSheet swipe', () => {
  /** jsdom has no layout or clock of its own: the sheet is 400 px tall and each move takes `step` ms. */
  let now = 0;
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(400);
    vi.spyOn(performance, 'now').mockImplementation(() => now);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function drag(handle: Element, distances: number[], step: number) {
    fireEvent.pointerDown(handle, { button: 0, pointerId: 1, clientY: 100 });
    for (const d of distances) {
      now += step;
      fireEvent.pointerMove(handle, { pointerId: 1, clientY: 100 + d });
    }
    fireEvent.pointerUp(handle, { pointerId: 1, clientY: 100 + (distances.at(-1) ?? 0) });
  }

  function sheet() {
    const onClose = vi.fn();
    render(
      <AppProviders env="test">
        <BottomSheet opened onClose={onClose} title="Edit account">
          <p>Form</p>
        </BottomSheet>
      </AppProviders>,
    );
    const title = screen.getByText('Edit account');
    const content = title.closest<HTMLElement>('[data-sheet-drag]')?.parentElement;
    if (!content) throw new Error('no sheet');
    return { onClose, title, content };
  }

  it('follows the finger and closes when let go far enough down', () => {
    const { onClose, title, content } = sheet();
    fireEvent.pointerDown(title, { button: 0, pointerId: 1, clientY: 100 });
    now += 100;
    fireEvent.pointerMove(title, { pointerId: 1, clientY: 160 });
    expect(content.style.transform).toBe('translateY(60px)');
    expect(content).toHaveAttribute('data-dragging');

    now += 200;
    fireEvent.pointerMove(title, { pointerId: 1, clientY: 250 });
    fireEvent.pointerUp(title, { pointerId: 1, clientY: 250 });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('slides back when let go too early and too slowly', () => {
    const { onClose, title, content } = sheet();
    drag(title, [20, 40, 60], 200);
    expect(onClose).not.toHaveBeenCalled();
    expect(content).not.toHaveAttribute('data-dragging');
    expect(content.style.transform).not.toContain('60px');
  });

  it('closes on a quick flick', () => {
    const { onClose, title } = sheet();
    drag(title, [15, 30], 20);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not start a swipe on the close button', () => {
    const { onClose } = sheet();
    const close = screen.getByRole('button', { name: 'Close' });
    drag(close, [100, 200, 300], 100);
    expect(onClose).not.toHaveBeenCalled();
  });
});
