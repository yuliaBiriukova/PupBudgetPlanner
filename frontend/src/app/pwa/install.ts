import { useLocalStorage } from '@mantine/hooks';
import { useSyncExternalStore } from 'react';

/**
 * Chrome's and Edge's install offer (F-025). Not in TypeScript's DOM types: only Chromium browsers fire it.
 * https://developer.mozilla.org/docs/Web/API/BeforeInstallPromptEvent
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * How this browser installs the app: its own dialog (`prompt`, Chrome or Edge), Safari's taps (`ios`), or not at all
 * (`null`: already installed, or a browser that can't, as Firefox, or Safari on the Mac).
 */
export type InstallWay = 'prompt' | 'ios' | null;

let offer: BeforeInstallPromptEvent | null = null;
let installed = false;
let listening = false;
const listeners = new Set<() => void>();

function changed() {
  listeners.forEach((listener) => {
    listener();
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Keeps the browser's install offer for the app's own Install button. Called once in main.tsx, before React starts:
 * Chrome fires the event as soon as the page qualifies, often before the first render.
 */
export function listenForInstall() {
  if (listening) return;
  listening = true;
  window.addEventListener('beforeinstallprompt', (event) => {
    // No mini-infobar from Chrome: the app offers it itself
    event.preventDefault();
    offer = event as BeforeInstallPromptEvent;
    changed();
  });
  window.addEventListener('appinstalled', () => {
    installed = true;
    offer = null;
    changed();
  });
}

/** The app opened from the home screen or the computer's app list: no browser bars, nothing to install. */
export function isStandalone(): boolean {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return iosStandalone || window.matchMedia('(display-mode: standalone)').matches;
}

/**
 * Safari on the iPhone or iPad, the one browser there that adds to the home screen with the steps we show (Chrome,
 * Firefox and Edge on iOS name themselves in the user agent). An iPad says it is a Mac, but has a touch screen.
 */
export function isIosSafari(userAgent: string, maxTouchPoints: number): boolean {
  const ios =
    /iPhone|iPad|iPod/.test(userAgent) || (userAgent.includes('Macintosh') && maxTouchPoints > 1);
  return ios && userAgent.includes('Safari') && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(userAgent);
}

function snapshot(): InstallWay {
  if (installed || isStandalone()) return null;
  if (offer) return 'prompt';
  return isIosSafari(navigator.userAgent, navigator.maxTouchPoints) ? 'ios' : null;
}

/** How the app can be installed here, and the browser's own dialog for Chrome and Edge. */
export function useInstall() {
  const way = useSyncExternalStore(subscribe, snapshot);
  return {
    way,
    /** Opens Chrome's or Edge's install dialog; the hint goes once the app is installed. */
    prompt: async () => {
      if (!offer) return;
      const shown = offer;
      // The offer works once
      offer = null;
      await shown.prompt();
      const { outcome } = await shown.userChoice;
      if (outcome === 'accepted') installed = true;
      changed();
    },
  };
}

/** Not now on the install card: it never shows again, and the row in More takes its place. */
export function useInstallCard() {
  const [dismissed, setDismissed] = useLocalStorage({
    key: 'pup.installCard',
    defaultValue: false,
    getInitialValueInEffect: false,
  });
  return {
    dismissed,
    dismiss: () => {
      setDismissed(true);
    },
  };
}

/** For tests: the state as if the page had just loaded. */
export function resetInstallForTests() {
  offer = null;
  installed = false;
  changed();
}
