import { useEffect } from 'react';
import type { KeyboardInset } from './useKeyboardInset';

/**
 * Marks a sheet that reaches the top of the room it has (the screen, or what the phone's keyboard leaves of it) with
 * `data-at-top`: there its corners go square, so no slivers of the page show beside them (I-029). Set on the element
 * itself as its size is observed, before the frame is painted: through React's state the corners changed a frame
 * after the sheet's height, a flicker when a form grew to the top.
 */
export function useSheetAtTop(sheet: HTMLElement | null, keyboard: KeyboardInset | null) {
  const room = keyboard?.height;

  useEffect(() => {
    if (!sheet) return undefined;
    const measure = () => {
      sheet.toggleAttribute('data-at-top', sheet.offsetHeight >= (room ?? window.innerHeight) - 1);
    };
    // Observing measures it once right away, then whenever its content or the screen changes its height
    const observer = new ResizeObserver(measure);
    observer.observe(sheet);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [sheet, room]);
}

/**
 * While the phone's keyboard is up, the field being typed is in sight in its sheet: scrolled there once the sheet has
 * its height above the keyboard, and again when the cursor moves to another field (I-029). The whole field: its label,
 * the box and the hint or error under it.
 */
export function useFieldInSight(sheet: HTMLElement | null, keyboard: KeyboardInset | null) {
  const room = keyboard?.height;

  useEffect(() => {
    if (!sheet || room === undefined) return undefined;
    let frame = 0;
    const reveal = () => {
      cancelAnimationFrame(frame);
      // Two frames: the sheet takes its height above the keyboard first
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          const field = document.activeElement;
          if (
            field instanceof HTMLElement &&
            field.matches('input, textarea') &&
            sheet.contains(field)
          )
            (field.closest('.mantine-InputWrapper-root') ?? field).scrollIntoView({
              block: 'nearest',
            });
        });
      });
    };
    reveal();
    sheet.addEventListener('focusin', reveal);
    return () => {
      cancelAnimationFrame(frame);
      sheet.removeEventListener('focusin', reveal);
    };
  }, [sheet, room]);
}
