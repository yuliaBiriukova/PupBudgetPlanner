import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';

/** Where a dragged row is now: how far it moved and where the drop line is drawn in its list. */
export interface DragState {
  id: string;
  dy: number;
  /** The drop line's top inside the list, in px. */
  line: number;
  /** The place among the other rows (0: before the first one). */
  slot: number;
}

interface Session {
  id: string;
  el: HTMLElement;
  scroller: HTMLElement;
  startY: number;
  startScroll: number;
  clientY: number;
  slot: number;
  anchors: HTMLElement[];
  frame: number;
}

interface Options {
  /** The rows a dragged one can land between (the dragged one is left out). */
  anchors: string;
  /** Called on release with the place and the rows it was counted among. */
  onDrop: (id: string, slot: number, anchors: HTMLElement[]) => void;
  /** Keeps the place where it may be (e.g. not above a kind's first group). */
  clamp?: (slot: number, anchors: HTMLElement[]) => number;
}

function scrollerOf(el: HTMLElement): HTMLElement {
  for (let node = el.parentElement; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight)
      return node;
  }
  return document.scrollingElement as HTMLElement;
}

/**
 * A row dragged by its grip, with the mouse or a finger: it follows the pointer, an accent line shows where it will
 * land, and the list scrolls when the pointer nears its top or bottom edge. Our own small hook, not a library (ADR
 * 0028): one short list in a sheet, and the ↑ ↓ buttons beside it move the row by touch or keyboard.
 */
export function useDragToSlot<T extends HTMLElement>({ anchors, onDrop, clamp }: Options) {
  const containerRef = useRef<T>(null);
  const session = useRef<Session>(undefined);
  const [drag, setDrag] = useState<DragState>();
  const latest = useRef({ onDrop, clamp, anchors });
  useLayoutEffect(() => {
    latest.current = { onDrop, clamp, anchors };
  });

  useEffect(
    () => () => {
      if (session.current) cancelAnimationFrame(session.current.frame);
    },
    [],
  );

  const measure = () => {
    const s = session.current;
    const container = containerRef.current;
    if (!s || !container) return;
    const list = Array.from(container.querySelectorAll<HTMLElement>(latest.current.anchors)).filter(
      (a) => a !== s.el && !s.el.contains(a),
    );
    let slot = list.length;
    for (const [index, anchor] of list.entries()) {
      const rect = anchor.getBoundingClientRect();
      if (s.clientY < rect.top + rect.height / 2) {
        slot = index;
        break;
      }
    }
    slot = latest.current.clamp ? latest.current.clamp(slot, list) : slot;
    const box = container.getBoundingClientRect();
    const before = list[slot - 1]?.getBoundingClientRect();
    const after = list[slot]?.getBoundingClientRect();
    const line =
      before && after
        ? (before.bottom + after.top) / 2
        : after
          ? after.top - 2
          : before
            ? before.bottom + 2
            : box.top;
    s.slot = slot;
    s.anchors = list;
    const dy = s.clientY - s.startY + (s.scroller.scrollTop - s.startScroll);
    setDrag({ id: s.id, dy, line: line - box.top, slot });
  };

  const tick = () => {
    const s = session.current;
    if (!s) return;
    const view = s.scroller.getBoundingClientRect();
    const top = Math.max(view.top, 0);
    const bottom = Math.min(view.bottom, window.innerHeight);
    const edge = 64;
    const speed =
      s.clientY < top + edge
        ? -Math.ceil((top + edge - s.clientY) / 6)
        : s.clientY > bottom - edge
          ? Math.ceil((s.clientY - (bottom - edge)) / 6)
          : 0;
    if (speed) {
      s.scroller.scrollTop += speed;
      measure();
    }
    s.frame = requestAnimationFrame(tick);
  };

  /** The grip of row `id`; it drags the nearest `row` around it (the row itself unless a wider block is named). */
  const gripProps = (id: string, row = '[data-drag-row]') => ({
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
      if (event.button !== 0) return;
      const el = event.currentTarget.closest<HTMLElement>(row);
      if (!el) return;
      event.preventDefault();
      const scroller = scrollerOf(el);
      session.current = {
        id,
        el,
        scroller,
        startY: event.clientY,
        startScroll: scroller.scrollTop,
        clientY: event.clientY,
        slot: -1,
        anchors: [],
        frame: requestAnimationFrame(tick),
      };
      measure();

      const move = (e: PointerEvent) => {
        if (!session.current) return;
        session.current.clientY = e.clientY;
        measure();
      };
      const end = (e: PointerEvent) => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', end);
        window.removeEventListener('pointercancel', end);
        const s = session.current;
        session.current = undefined;
        setDrag(undefined);
        if (!s) return;
        cancelAnimationFrame(s.frame);
        if (e.type === 'pointerup') latest.current.onDrop(s.id, s.slot, s.anchors);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', end);
      window.addEventListener('pointercancel', end);
    },
  });

  /** Props for a row that can be dragged: it follows the pointer while it is. */
  const rowProps = (id: string, key: string) => ({
    'data-drag-row': key,
    'data-dragging': drag?.id === id ? true : undefined,
    style: drag?.id === id ? { transform: `translateY(${String(drag.dy)}px)` } : undefined,
  });

  return { containerRef, drag, gripProps, rowProps };
}
