import { useSyncExternalStore } from 'react';

/** What the phone's keyboard leaves of the screen: the room's height and how much it covers at the bottom. */
export interface KeyboardInset {
  /** The visible height, in pixels. */
  height: number;
  /** How much of the bottom the keyboard covers. */
  bottom: number;
}

/** Less than this is the browser's own bars coming and going, not a keyboard. */
const KEYBOARD_MIN = 120;

function subscribe(onChange: () => void) {
  const viewport = window.visualViewport;
  viewport?.addEventListener('resize', onChange);
  viewport?.addEventListener('scroll', onChange);
  return () => {
    viewport?.removeEventListener('resize', onChange);
    viewport?.removeEventListener('scroll', onChange);
  };
}

/** `height,bottom` while the keyboard is up, else empty: a string, so an unchanged keyboard renders nothing again. */
function snapshot(): string {
  const viewport = window.visualViewport;
  if (!viewport || viewport.scale > 1.01) return '';
  const bottom = Math.round(window.innerHeight - viewport.height - viewport.offsetTop);
  return bottom >= KEYBOARD_MIN ? `${String(Math.round(viewport.height))},${String(bottom)}` : '';
}

/**
 * The phone's keyboard, from the visual viewport (I-017): browsers lay it over the page, so a sheet pinned to the
 * bottom would have its Save under it. Null while it is closed, the page is zoomed, or the browser can't tell.
 */
export function useKeyboardInset(enabled: boolean): KeyboardInset | null {
  const value = useSyncExternalStore(subscribe, snapshot, () => '');
  if (!enabled || !value) return null;
  const [height = 0, bottom = 0] = value.split(',').map(Number);
  return { height, bottom };
}
