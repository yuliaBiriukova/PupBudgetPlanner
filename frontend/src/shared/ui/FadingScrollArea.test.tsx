import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../../app/AppProviders';
import { setScreenWidth } from '../../test/screen';
import { FadingScrollArea, SCROLL_BAR_HIDE_DELAY } from './FadingScrollArea';
import { ResponsiveDialog } from './ResponsiveDialog';

function renderUi(ui: ReactNode) {
  return render(<AppProviders env="test">{ui}</AppProviders>);
}

/** jsdom has no layout: the viewport pretends to show 100 px of 300 px of content, scrolled to `top`. */
function scrollTo(viewport: HTMLElement, top: number) {
  Object.defineProperties(viewport, {
    scrollHeight: { configurable: true, value: 300 },
    clientHeight: { configurable: true, value: 100 },
  });
  viewport.scrollTop = top;
  fireEvent.scroll(viewport);
}

function parts(container: HTMLElement) {
  const viewport = container.querySelector<HTMLElement>('[data-scrollarea-viewport]');
  if (!viewport) throw new Error('no scroll area');
  const root = viewport.closest<HTMLElement>('[data-fading]');
  if (!root) throw new Error('no fading root');
  return { viewport, root };
}

describe('FadingScrollArea', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('fades the edges that have more content behind them', () => {
    const { container } = renderUi(
      <FadingScrollArea h={100} data-fading>
        <p>Long list</p>
      </FadingScrollArea>,
    );
    const { viewport, root } = parts(container);

    scrollTo(viewport, 0);
    expect(root).not.toHaveAttribute('data-more-above');
    expect(root).toHaveAttribute('data-more-below');

    scrollTo(viewport, 100);
    expect(root).toHaveAttribute('data-more-above');
    expect(root).toHaveAttribute('data-more-below');

    scrollTo(viewport, 200);
    expect(root).toHaveAttribute('data-more-above');
    expect(root).not.toHaveAttribute('data-more-below');
  });

  it('shows the bar while scrolling and lets it fade a moment later', () => {
    vi.useFakeTimers();
    const { container } = renderUi(
      <FadingScrollArea h={100} data-fading>
        <p>Long list</p>
      </FadingScrollArea>,
    );
    const { viewport, root } = parts(container);
    expect(root).not.toHaveAttribute('data-scrolling');

    scrollTo(viewport, 50);
    expect(root).toHaveAttribute('data-scrolling');

    act(() => {
      vi.advanceTimersByTime(SCROLL_BAR_HIDE_DELAY);
    });
    expect(root).not.toHaveAttribute('data-scrolling');
  });
});

describe('ResponsiveDialog', () => {
  it.each([
    ['phone sheet', 375],
    ['desktop dialog', 1280],
  ])('keeps the buttons of the %s outside the part that scrolls', (_, width) => {
    setScreenWidth(width);
    renderUi(
      <ResponsiveDialog
        opened
        onClose={() => undefined}
        title="Categories to show"
        footer={<button type="button">Save</button>}
      >
        <p>Rent</p>
      </ResponsiveDialog>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Categories to show' });
    const save = screen.getByRole('button', { name: 'Save' });
    const content = screen.getByText('Rent');
    expect(dialog).toContainElement(save);
    expect(content.closest('[data-scrollarea-viewport]')).not.toBeNull();
    expect(save.closest('[data-scrollarea-viewport]')).toBeNull();
    expect(
      screen
        .getByRole('heading', { name: 'Categories to show' })
        .closest('[data-scrollarea-viewport]'),
    ).toBeNull();
  });
});
