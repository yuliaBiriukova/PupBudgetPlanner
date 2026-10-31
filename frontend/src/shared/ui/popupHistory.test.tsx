import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POPUPS_KEY, usePopupHistory } from './popupHistory';

/** The page the pop-ups open on: its own history step, marked so a step too far back shows. */
let page = 0;
function onAPage() {
  page++;
  window.history.pushState({ page }, '');
}
const popupsNow = () => (window.history.state as Record<string, unknown> | null)?.[POPUPS_KEY];
const pageNow = () => (window.history.state as { page?: number } | null)?.page;

/** A pop-up the way a dialog holds one: `opened` from its parent, `onClose` asking the parent to close it. */
function popup() {
  const onClose = vi.fn();
  const hook = renderHook(
    ({ opened }) => {
      usePopupHistory(opened, onClose);
    },
    { initialProps: { opened: false } },
  );
  onClose.mockImplementation(() => {
    hook.rerender({ opened: false });
  });
  return {
    onClose,
    open: () => {
      hook.rerender({ opened: true });
    },
    closeByButton: () => {
      hook.rerender({ opened: false });
    },
  };
}

/** history.back() and forward() answer with a popstate a moment later. */
const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 30)));

describe('usePopupHistory', () => {
  beforeEach(() => {
    onAPage();
  });

  it('adds a step when a pop-up opens, and Back closes the pop-up instead of leaving the page', async () => {
    const sheet = popup();
    const before = window.history.length;

    sheet.open();
    expect(window.history.length).toBe(before + 1);
    expect(popupsNow()).toBe(1);

    act(() => {
      window.history.back();
    });
    await waitFor(() => {
      expect(sheet.onClose).toHaveBeenCalledTimes(1);
    });
    await settle();
    // On the page, not a step further back
    expect(pageNow()).toBe(page);
    expect(popupsNow()).toBeUndefined();
  });

  it('takes the step away when the pop-up closes another way, and Forward does not reopen it', async () => {
    const sheet = popup();
    sheet.open();

    sheet.closeByButton();
    await settle();
    expect(pageNow()).toBe(page);
    expect(popupsNow()).toBeUndefined();

    act(() => {
      window.history.forward();
    });
    await settle();
    await settle();
    expect(pageNow()).toBe(page);
    expect(popupsNow()).toBeUndefined();
    expect(sheet.onClose).not.toHaveBeenCalled();
  });

  it('closes only the top pop-up of two with each Back', async () => {
    const form = popup();
    const list = popup();
    form.open();
    list.open();
    expect(popupsNow()).toBe(2);

    act(() => {
      window.history.back();
    });
    await waitFor(() => {
      expect(list.onClose).toHaveBeenCalledTimes(1);
    });
    expect(form.onClose).not.toHaveBeenCalled();
    expect(popupsNow()).toBe(1);

    act(() => {
      window.history.back();
    });
    await waitFor(() => {
      expect(form.onClose).toHaveBeenCalledTimes(1);
    });
    await settle();
    expect(pageNow()).toBe(page);
  });

  it('lets a link from the pop-up take its step, so closing it does not go back', async () => {
    const more = popup();
    more.open();

    // The More sheet's links replace the step with the section they open (NavLink replace)
    window.history.replaceState({ page: 'categories' }, '');
    more.closeByButton();
    await settle();
    expect(pageNow()).toBe('categories');
  });

  it('adds the step of a pop-up opened while the last one is still going back after the first', async () => {
    const first = popup();
    const second = popup();
    first.open();
    first.closeByButton();
    second.open();

    await settle();
    expect(popupsNow()).toBe(1);
    act(() => {
      window.history.back();
    });
    await waitFor(() => {
      expect(second.onClose).toHaveBeenCalledTimes(1);
    });
    await settle();
    expect(pageNow()).toBe(page);
  });
});
