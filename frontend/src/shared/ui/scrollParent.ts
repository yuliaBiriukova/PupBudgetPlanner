/**
 * The element a page scrolls in: the app shell's main area (AppLayout), not the window. Watching what is on screen
 * (the slim totals bar, loading more) and fitting the desktop's sticky column are measured against it.
 */
export function scrollParentOf(element: Element | null): HTMLElement | null {
  for (let parent = element?.parentElement; parent; parent = parent.parentElement) {
    const { overflowY } = getComputedStyle(parent);
    if (overflowY === 'auto' || overflowY === 'scroll') return parent;
  }
  return null;
}
