import { registerSW } from 'virtual:pwa-register';
import { updateReady } from './updates';

/** How often an open app asks whether a release came out, besides every start and every return to it. */
const CHECK_EVERY_MS = 60 * 60 * 1000;

/**
 * Starts the service worker (F-025, ADR 0034). Only main.tsx calls it: in `vite` dev the plugin's module registers
 * nothing, and Storybook and the unit tests never load it.
 */
export function registerServiceWorker() {
  const update = registerSW({
    onNeedRefresh: () => {
      updateReady(() => {
        // Lets the waiting version take over and reloads the page with it
        void update(true);
      });
    },
    onRegisteredSW: (_url, registration) => {
      if (!registration) return;
      const check = () => {
        if (navigator.onLine) void registration.update();
      };
      setInterval(check, CHECK_EVERY_MS);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check();
      });
    },
  });
}
