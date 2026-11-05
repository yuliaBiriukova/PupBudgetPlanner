import { useCallback, useEffect, useRef, useState } from 'react';
import { shouldClose } from '../../shared/ui/useSheetSwipe';

/** How long the keys take to slide down out of sight (`.keys` in TransactionForm.module.css has the same). */
export const FOLD_MS = 200;
/** The finger moves this far down before a press on a key becomes a swipe of the keys. */
const SLOP = 8;
/** A key's click that ends a swipe is swallowed for this long after the finger lifts. */
const SWALLOW_MS = 300;

interface Drag {
  y0: number;
  height: number;
  dy: number;
  samples: { y: number; t: number }[];
}

/** Slides the keys out of sight, then runs `then`; at once with reduced motion or without the keys. */
function slideAway(keys: HTMLElement | null, then: () => void) {
  if (!keys || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    then();
    return;
  }
  keys.style.transform = 'translateY(100%)';
  window.setTimeout(then, FOLD_MS);
}

/**
 * Swipe the phone keys down to fold them (I-028). They follow the finger; let go past a quarter of their height or on
 * a flick and they slide away and `onFolded` runs, otherwise they slide back (the sheets' numbers, I-015). A press on a
 * key that moves less than 8 px is still a press, and the key under the finger when a swipe ends isn't pressed.
 * `foldAway` slides them away for the other ways of folding them (Back).
 */
export function useKeysSwipe(onFolded: () => void) {
  const [keys, setKeys] = useState<HTMLElement | null>(null);
  const folded = useRef(onFolded);
  const current = useRef<HTMLElement | null>(null);
  useEffect(() => {
    folded.current = onFolded;
    current.current = keys;
  });

  useEffect(() => {
    if (!keys) return;
    let start: { y: number; id: number } | null = null;
    let drag: Drag | null = null;
    let swallowUntil = 0;

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || drag) return;
      start = { y: e.clientY, id: e.pointerId };
    };
    const onMove = (e: PointerEvent) => {
      if (start?.id !== e.pointerId) return;
      const t = performance.now();
      if (!drag) {
        if (e.clientY - start.y < SLOP) return;
        drag = { y0: e.clientY, height: keys.offsetHeight, dy: 0, samples: [] };
        try {
          keys.setPointerCapture(e.pointerId);
        } catch {
          // A pointer the browser doesn't know (a synthetic one in a test): no capture, the drag still works
        }
        keys.dataset.dragging = '';
      }
      drag.samples.push({ y: e.clientY, t });
      while (drag.samples.length > 2 && t - (drag.samples[0]?.t ?? t) > 100) drag.samples.shift();
      // Up past where they started the keys don't move: they are as high as they go
      drag.dy = Math.max(0, e.clientY - drag.y0);
      keys.style.transform = `translateY(${String(drag.dy)}px)`;
    };
    const onUp = () => {
      start = null;
      if (!drag) return;
      const { samples, dy, height } = drag;
      const first = samples[0];
      const last = samples.at(-1);
      const speed = first && last && last.t > first.t ? (last.y - first.y) / (last.t - first.t) : 0;
      drag = null;
      delete keys.dataset.dragging;
      swallowUntil = performance.now() + SWALLOW_MS;
      if (shouldClose(dy, height, speed)) {
        slideAway(keys, () => {
          folded.current();
        });
      } else keys.style.transform = '';
    };
    const onClick = (e: MouseEvent) => {
      if (performance.now() < swallowUntil) {
        e.stopPropagation();
        e.preventDefault();
      }
    };

    keys.addEventListener('pointerdown', onDown);
    keys.addEventListener('pointermove', onMove);
    keys.addEventListener('pointerup', onUp);
    keys.addEventListener('pointercancel', onUp);
    keys.addEventListener('click', onClick, true);
    return () => {
      keys.removeEventListener('pointerdown', onDown);
      keys.removeEventListener('pointermove', onMove);
      keys.removeEventListener('pointerup', onUp);
      keys.removeEventListener('pointercancel', onUp);
      keys.removeEventListener('click', onClick, true);
    };
  }, [keys]);

  const foldAway = useCallback((then: () => void) => {
    slideAway(current.current, then);
  }, []);

  return { setKeys, foldAway };
}
