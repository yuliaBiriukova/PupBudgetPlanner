import { ScrollArea, type ScrollAreaAutosizeProps } from '@mantine/core';
import { useMergedRef } from '@mantine/hooks';
import { useEffect, useRef, useState } from 'react';
import { cx } from './cx';
import classes from './FadingScrollArea.module.css';

/** How long the bar stays after the last scroll before it fades (I-004). */
export const SCROLL_BAR_HIDE_DELAY = 900;

interface FadingScrollAreaProps extends Omit<
  ScrollAreaAutosizeProps,
  'type' | 'scrollbars' | 'classNames'
> {
  /** As tall as its content up to the room it gets (dialogs, sheets), instead of filling a set height. */
  autosize?: boolean;
}

/**
 * Pup's scrolling area (I-004, DESIGN_RULES "Screen decisions"): the bar shows while scrolling or under the pointer
 * and fades a moment later, and the content fades out at an edge with more behind it. The bar's look is set once
 * for every Mantine ScrollArea in the theme. The page itself keeps the browser's own scroll bar.
 */
export function FadingScrollArea({
  autosize = false,
  className,
  viewportRef,
  children,
  ...props
}: FadingScrollAreaProps) {
  const viewport = useRef<HTMLDivElement>(null);
  const ref = useMergedRef(viewport, viewportRef);
  const [above, setAbove] = useState(false);
  const [below, setBelow] = useState(false);
  const [scrolling, setScrolling] = useState(false);

  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    let timer = 0;
    const measure = () => {
      const max = el.scrollHeight - el.clientHeight;
      setAbove(el.scrollTop > 1);
      setBelow(max > 1 && el.scrollTop < max - 1);
    };
    const onScroll = () => {
      measure();
      setScrolling(true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        setScrolling(false);
      }, SCROLL_BAR_HIDE_DELAY);
    };
    measure();
    el.addEventListener('scroll', onScroll, { passive: true });
    // The content grows or the room shrinks: the fades follow
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    return () => {
      el.removeEventListener('scroll', onScroll);
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  const Area = autosize ? ScrollArea.Autosize : ScrollArea;
  return (
    <Area
      type="auto"
      scrollbars="y"
      overscrollBehavior="contain"
      {...props}
      viewportRef={ref}
      className={cx(classes.root, className)}
      classNames={{ viewport: classes.viewport, scrollbar: classes.scrollbar }}
      data-more-above={above || undefined}
      data-more-below={below || undefined}
      data-scrolling={scrolling || undefined}
    >
      {children}
    </Area>
  );
}
