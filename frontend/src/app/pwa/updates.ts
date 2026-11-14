import { useSyncExternalStore } from 'react';

/**
 * A release waiting for the person's Reload (F-025, `registerType: 'prompt'`): the service worker has the new version
 * ready, and the open app keeps the old one until Reload, so a half-filled form is never reloaded away.
 */
let reload: (() => void) | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Called by the service worker's registration (register.ts) when a new version is ready. */
export function updateReady(apply: () => void) {
  reload = apply;
  listeners.forEach((listener) => {
    listener();
  });
}

/** For tests: no release waiting, as when the page has just loaded. */
export function resetUpdateForTests() {
  reload = null;
  listeners.forEach((listener) => {
    listener();
  });
}

/** The new version's Reload, while one is ready. */
export function useUpdate(): (() => void) | null {
  return useSyncExternalStore(subscribe, () => reload);
}
