import { vi } from 'vitest';

/** Whether a `(min-width: …em)` / `(max-width: …em)` query matches a screen `width` px wide (1em = 16px). */
function matches(query: string, width: number): boolean {
  const min = /min-width:\s*([\d.]+)em/.exec(query);
  const max = /max-width:\s*([\d.]+)em/.exec(query);
  if (!min && !max) return false;
  return (!min || width >= Number(min[1]) * 16) && (!max || width <= Number(max[1]) * 16);
}

/**
 * jsdom has no layout, so media queries are answered for a pretend screen width. The default (set before
 * each test in setup.ts) is a 375 px phone; desktop tests call `setScreenWidth(1280)`.
 */
export function setScreenWidth(width: number) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn((query: string) => ({
      matches: matches(query, width),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}
