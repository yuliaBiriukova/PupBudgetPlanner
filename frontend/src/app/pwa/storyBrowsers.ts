import { listenForInstall, resetInstallForTests } from './install';

/**
 * Stories as if in a given browser (F-025). Each returns the clean-up Storybook runs after the story, so the next one
 * starts as the browser Storybook really runs in.
 */

/** Safari on the iPhone: the install sheet shows Safari's three taps. */
export function asIphoneSafari() {
  Object.defineProperty(navigator, 'userAgent', {
    configurable: true,
    get: () =>
      'Mozilla/5.0 (iPhone; CPU iPhone OS 26_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.1 Mobile/15E148 Safari/604.1',
  });
  resetInstallForTests();
  return () => {
    // The prototype's own getter is back
    Reflect.deleteProperty(navigator, 'userAgent');
    resetInstallForTests();
  };
}

/** Chrome or Edge with its install offer: the sheet's Install opens the browser's dialog. */
export function withInstallOffer() {
  listenForInstall();
  window.dispatchEvent(
    Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
      prompt: () => Promise.resolve(),
      userChoice: Promise.resolve({ outcome: 'dismissed' }),
    }),
  );
  return () => {
    resetInstallForTests();
  };
}

/** No network: the top pill and the start screen say so. */
export function asOffline() {
  Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => false });
  window.dispatchEvent(new Event('offline'));
  return () => {
    Reflect.deleteProperty(navigator, 'onLine');
    window.dispatchEvent(new Event('online'));
  };
}
