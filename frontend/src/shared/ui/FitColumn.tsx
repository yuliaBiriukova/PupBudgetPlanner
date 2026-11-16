import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { scrollParentOf } from './scrollParent';

/** The room the fitted column keeps under it and over it once it sticks. */
const COLUMN_GAP_PX = 16;

/** The least the column's parts take: each as it is, or at its min-height when it has one. */
function leastHeight(column: HTMLElement): number {
  return Array.from(column.children).reduce((sum, part) => {
    const style = getComputedStyle(part);
    const min = parseFloat(style.minHeight);
    return (
      sum +
      (Number.isNaN(min) || min === 0 ? part.getBoundingClientRect().height : min) +
      parseFloat(style.marginTop) +
      parseFloat(style.marginBottom)
    );
  }, 0);
}

/**
 * A desktop page's left column (Transactions, F-020; Budget, F-033): sticky, and ending 16 px above the window's bottom
 * at every scroll position, so all of it is on screen and its stretching part (min-height, `flex: 1`) scrolls inside it.
 * It ends no lower than the column beside it (its next sibling): a sticky column taller than the room left at the
 * page's end is pushed up, its top under the window's (B-008). Its CSS makes it sticky and a flex column.
 */
export function FitColumn({
  fit,
  className,
  children,
}: {
  fit: boolean;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!fit) {
      el.style.maxHeight = '';
      return;
    }
    const main = scrollParentOf(el);
    if (!main) return;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = main.getBoundingClientRect();
        const top = Math.max(el.getBoundingClientRect().top, box.top + COLUMN_GAP_PX);
        const receipts = el.nextElementSibling?.getBoundingClientRect().bottom ?? Infinity;
        const bottom = Math.min(box.bottom - COLUMN_GAP_PX, receipts);
        el.style.maxHeight = `${String(Math.round(Math.max(bottom - top, leastHeight(el))))}px`;
      });
    };
    measure();
    main.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    // The totals above it (B-007) or the receipts beside it (B-008) change height without a scroll: it fits again
    const observer = new ResizeObserver(measure);
    if (main.firstElementChild) observer.observe(main.firstElementChild);
    if (el.nextElementSibling) observer.observe(el.nextElementSibling);
    return () => {
      cancelAnimationFrame(frame);
      main.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
      observer.disconnect();
    };
  }, [fit]);

  return (
    <div className={className} ref={ref}>
      {children}
    </div>
  );
}
