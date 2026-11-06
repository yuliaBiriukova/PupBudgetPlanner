import { useEffect, useRef } from 'react';

/**
 * Back closes the top pop-up (I-015). Opening a pop-up adds one step to the browser's history, on the same address;
 * Back takes it away and closes the pop-up. Closing it any other way (the X, Cancel, Save, a swipe) takes the step
 * away too, with the steps of anything open over it that closes with it (the transaction form's keys, I-028), so the
 * next Back leaves the page, and Forward onto such a step does nothing.
 */

/** The number of pop-ups open at a history step, kept next to the router's own state. */
export const POPUPS_KEY = 'pupPopups';

interface OpenPopup {
  depth: number;
  close: () => void;
}

/** The open pop-ups, bottom first. */
const openPopups: OpenPopup[] = [];
/** Our own history.go() calls whose popstate hasn't come yet. */
let ourBacks = 0;
/** The number of pop-ups at the step our pending backs land on. */
let landing = 0;
/**
 * What waits for our pending back to land, in order: steps to add, so they don't land under it, and further steps
 * back (a browser may drop a second traversal sent before the first one lands).
 */
const waiting: (() => void)[] = [];
let listening = false;

function depthOf(state: unknown): number {
  if (typeof state !== 'object' || state === null || !(POPUPS_KEY in state)) return 0;
  return Number((state as Record<string, unknown>)[POPUPS_KEY]) || 0;
}

/** The number of pop-ups at the current step, or at the one our pending backs land on. */
function depthNow(): number {
  return ourBacks > 0 ? landing : depthOf(window.history.state);
}

/** Goes back to the step with `depth` pop-ups, past every step over it in one go. */
function goBackTo(depth: number) {
  if (ourBacks > 0) {
    if (depth >= landing) return;
    landing = depth;
    waiting.push(() => {
      goBackTo(depth);
    });
    return;
  }
  const steps = depthOf(window.history.state) - depth;
  if (steps <= 0) return;
  ourBacks++;
  landing = depth;
  window.history.go(-steps);
}

/** Runs what waited for our back, until one of them goes back again. */
function runWaiting() {
  while (ourBacks === 0) {
    const next = waiting.shift();
    if (!next) return;
    next();
  }
}

function onPopState(event: PopStateEvent) {
  if (ourBacks > 0) {
    ourBacks--;
    if (ourBacks === 0) runWaiting();
    return;
  }
  const depth = depthOf(event.state);
  if (depth > openPopups.length) {
    // Forward onto a pop-up closed earlier: it stays closed, the step is skipped
    goBackTo(depth - 1);
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
      // Closed another way than Back: take its step away with any over it, unless a link moved on from it already.
      // React cleans up a pop-up inside another first (the form's sheet before the form's keys, I-028): the sheet's
      // back takes the keys' step too, and the keys then find theirs gone
      if (depthNow() >= popup.depth) goBackTo(popup.depth - 1);
    };
  }, [opened]);
}

/** How long `afterPopupsClose` waits for the step to go before it runs anyway. */
const STEP_GONE_WAIT_MS = 1000;

/**
 * Runs `callback` once no pop-up's step is the current history entry: at once, or when Back (the person's, or ours
 * after a pop-up closed another way) has taken the step away. A page that keeps its state in the address changes it
 * then, so the change lands on the page's own entry and not on the pop-up's, which Back drops (F-020's filters).
 * Call it as the pop-up closes.
 */
export function afterPopupsClose(callback: () => void) {
  if (depthOf(window.history.state) === 0) {
    callback();
    return;
  }
  const run = () => {
    window.removeEventListener('popstate', run);
    window.clearTimeout(timer);
    callback();
  };
  window.addEventListener('popstate', run);
  const timer = window.setTimeout(run, STEP_GONE_WAIT_MS);
}

/** Whether the current history entry is a pop-up's step: a page that keeps its state in the address waits then. */
export function onPopupStep(): boolean {
  return depthOf(window.history.state) > 0;
}
