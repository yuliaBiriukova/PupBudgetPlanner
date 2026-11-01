import { useEffect, useRef } from 'react';

/**
 * Back closes the top pop-up (I-015). Opening a pop-up adds one step to the browser's history, on the same address;
 * Back takes it away and closes the pop-up. Closing it any other way (the X, Cancel, Save, a swipe) takes the step
 * away too, so the next Back leaves the page, and Forward onto such a step does nothing.
 */

/** The number of pop-ups open at a history step, kept next to the router's own state. */
export const POPUPS_KEY = 'pupPopups';

interface OpenPopup {
  depth: number;
  close: () => void;
}

/** The open pop-ups, bottom first. */
const openPopups: OpenPopup[] = [];
/** Our own history.back() calls whose popstate hasn't come yet. */
let ourBacks = 0;
/** Steps to add once our pending back has landed, so they don't land under it. */
const waiting: (() => void)[] = [];
let listening = false;

function depthOf(state: unknown): number {
  if (typeof state !== 'object' || state === null || !(POPUPS_KEY in state)) return 0;
  return Number((state as Record<string, unknown>)[POPUPS_KEY]) || 0;
}

function goBack() {
  ourBacks++;
  window.history.back();
}

function onPopState(event: PopStateEvent) {
  if (ourBacks > 0) {
    ourBacks--;
    if (ourBacks === 0) {
      waiting.splice(0).forEach((push) => {
        push();
      });
    }
    return;
  }
  const depth = depthOf(event.state);
  if (depth > openPopups.length) {
    // Forward onto a pop-up closed earlier: it stays closed, the step is skipped
    goBack();
    return;
  }
  // Back: the pop-ups above the step close, the top one first
  openPopups
    .filter((popup) => popup.depth > depth)
    .reverse()
    .forEach((popup) => {
      popup.close();
    });
}

/** Gives an open pop-up its history step, so Back closes it (see the top of this file). */
export function usePopupHistory(opened: boolean, onClose: () => void) {
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });

  useEffect(() => {
    if (!opened) return;
    if (!listening) {
      window.addEventListener('popstate', onPopState);
      listening = true;
    }
    const popup: OpenPopup = {
      depth: openPopups.length + 1,
      close: () => {
        close.current();
      },
    };
    openPopups.push(popup);
    const push = () => {
      // The router's own state (its key and index) stays, so it sees the same page
      const state: unknown = window.history.state;
      window.history.pushState(
        { ...(typeof state === 'object' ? state : {}), [POPUPS_KEY]: popup.depth },
        '',
      );
    };
    if (ourBacks > 0) waiting.push(push);
    else push();

    return () => {
      openPopups.splice(openPopups.indexOf(popup), 1);
      const queued = waiting.indexOf(push);
      if (queued >= 0) {
        waiting.splice(queued, 1);
        return;
      }
      // Closed another way than Back: take its step away, unless a link moved on from it already
      if (depthOf(window.history.state) === popup.depth) goBack();
    };
  }, [opened]);
}
