import { useEffect, useRef, useState } from 'react';

// Vaul's numbers (I-015 references), approved with the demo on 2026-11-01
/** Let go past this share of the sheet's height and it closes. */
export const CLOSE_SHARE = 0.25;
/** A flick down faster than this (px per ms) closes it however short. */
export const FLICK_SPEED = 0.4;
/** After the content scrolls, a drag from it waits this long (ms), so a scroll back to the top doesn't close it. */
export const SCROLL_LOCK_MS = 100;
/** A flick shorter than this is a tap that wobbled, not a flick. */
const MIN_FLICK = 8;
/** The finger moves this far down before the content gives way to a drag. */
const CONTENT_SLOP = 8;

/** Whether a sheet let go `dy` px down (of its `height`), moving at `speed` px per ms, closes or slides back. */
export function shouldClose(dy: number, height: number, speed: number): boolean {
  return dy > height * CLOSE_SHARE || (speed > FLICK_SPEED && dy > MIN_FLICK);
}

/** Up past where it started the sheet barely gives: it's already as tall as it gets. */
function resist(dy: number): number {
  return dy >= 0 ? dy : -8 * Math.log1p(-dy / 8);
}

interface Drag {
  y0: number;
  by: 'pointer' | 'touch';
  height: number;
  dy: number;
  samples: { y: number; t: number }[];
  saved: { transform: string; duration: string; overlayOpacity: string; overlayDuration: string };
}

/**
 * Swipe down to close a phone sheet (I-015): from its handle or title (`data-sheet-drag`) at any time; from its content
 * only when the content is at its top and the finger moves down, otherwise the content scrolls as before. The sheet and
 * the dimmed page follow the finger; let go, and the sheet closes (Mantine's own exit carries on from where it was) or
 * slides back with Mantine's transition, which is off with reduced motion.
 */
export function useSheetSwipe(onClose: () => void) {
  const [content, setContent] = useState<HTMLElement | null>(null);
  const [overlay, setOverlay] = useState<HTMLElement | null>(null);
  /** The content's scrolling box. */
  const [scroller, setScroller] = useState<HTMLElement | null>(null);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });

  useEffect(() => {
    if (!content) return;
    let drag: Drag | null = null;
    let lastScroll = 0;
    let touchStartY: number | null = null;

    const begin = (y: number, by: Drag['by']) => {
      drag = {
        y0: y,
        by,
        height: content.offsetHeight,
        dy: 0,
        samples: [{ y, t: performance.now() }],
        saved: {
          transform: content.style.transform,
          duration: content.style.transitionDuration,
          overlayOpacity: overlay?.style.opacity ?? '',
          overlayDuration: overlay?.style.transitionDuration ?? '',
        },
      };
      content.dataset.dragging = '';
      content.style.transitionDuration = '0ms';
      if (overlay) overlay.style.transitionDuration = '0ms';
    };
    const move = (y: number) => {
      if (!drag) return;
      const t = performance.now();
      drag.samples.push({ y, t });
      while (drag.samples.length > 2 && t - (drag.samples[0]?.t ?? t) > 100) drag.samples.shift();
      drag.dy = resist(y - drag.y0);
      content.style.transform = `translateY(${String(drag.dy)}px)`;
      if (overlay && drag.height > 0) {
        overlay.style.opacity = String(Math.max(0, 1 - Math.max(drag.dy, 0) / drag.height));
      }
    };
    const end = () => {
      if (!drag) return;
      const { samples, dy, height, saved } = drag;
      const first = samples[0];
      const last = samples.at(-1);
      const speed = first && last && last.t > first.t ? (last.y - first.y) / (last.t - first.t) : 0;
      drag = null;
      delete content.dataset.dragging;
      // Mantine's transition is back on: its exit, or the slide back into place
      content.style.transitionDuration = saved.duration;
      if (overlay) overlay.style.transitionDuration = saved.overlayDuration;
      if (shouldClose(dy, height, speed)) {
        close.current();
        return;
      }
      content.style.transform = saved.transform;
      if (overlay) overlay.style.opacity = saved.overlayOpacity;
    };

    // The handle and the title: pointer events (a finger, a mouse or a pen); the CSS turns the browser's panning off
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Element;
      if (
        e.button !== 0 ||
        drag ||
        !target.closest('[data-sheet-drag]') ||
        target.closest('button')
      ) {
        return;
      }
      try {
        content.setPointerCapture(e.pointerId);
      } catch {
        // A pointer the browser doesn't know (a synthetic one in a test): no capture, the drag still works
      }
      begin(e.clientY, 'pointer');
    };
    const onPointerMove = (e: PointerEvent) => {
      if (drag?.by === 'pointer') move(e.clientY);
    };
    const onPointerUp = () => {
      if (drag?.by === 'pointer') end();
    };

    // The content: touch events, so a drag can take over from the scroll only at the top and only downwards
    const atTop = () => !scroller || scroller.scrollTop <= 0;
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = null;
      const target = e.target as Element;
      if (
        drag ||
        e.touches.length !== 1 ||
        target.closest('[data-sheet-drag], [data-sheet-footer]')
      )
        return;
      const y = e.touches[0]?.clientY;
      if (y !== undefined && atTop() && performance.now() - lastScroll > SCROLL_LOCK_MS)
        touchStartY = y;
    };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY;
      if (y === undefined) return;
      if (!drag) {
        if (touchStartY === null) return;
        const dy = y - touchStartY;
        if (dy < -4 || !e.cancelable) {
          touchStartY = null;
          return;
        }
        if (dy < CONTENT_SLOP || !atTop()) return;
        begin(y, 'touch');
      }
      if (drag?.by !== 'touch') return;
      e.preventDefault();
      move(y);
    };
    const onTouchEnd = () => {
      touchStartY = null;
      if (drag?.by === 'touch') end();
    };
    const onScroll = () => {
      lastScroll = performance.now();
    };

    content.addEventListener('pointerdown', onPointerDown);
    content.addEventListener('pointermove', onPointerMove);
    content.addEventListener('pointerup', onPointerUp);
    content.addEventListener('pointercancel', onPointerUp);
    content.addEventListener('touchstart', onTouchStart, { passive: true });
    content.addEventListener('touchmove', onTouchMove, { passive: false });
    content.addEventListener('touchend', onTouchEnd);
    content.addEventListener('touchcancel', onTouchEnd);
    scroller?.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      content.removeEventListener('pointerdown', onPointerDown);
      content.removeEventListener('pointermove', onPointerMove);
      content.removeEventListener('pointerup', onPointerUp);
      content.removeEventListener('pointercancel', onPointerUp);
      content.removeEventListener('touchstart', onTouchStart);
      content.removeEventListener('touchmove', onTouchMove);
      content.removeEventListener('touchend', onTouchEnd);
      content.removeEventListener('touchcancel', onTouchEnd);
      scroller?.removeEventListener('scroll', onScroll);
    };
  }, [content, overlay, scroller]);

  return { setContent, setOverlay, setScroller };
}
