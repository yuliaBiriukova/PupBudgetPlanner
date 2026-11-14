import { createContext, useContext } from 'react';

/** Where the app runs: a browser with an install button, Safari on the iPhone (steps only), or the installed app. */
export type Platform = 'Chrome or Edge' | 'iPhone Safari' | 'Installed app';

/** What happens while the story is shown. */
export type Moment = 'Nothing new' | 'Update ready' | 'Offline';

/**
 * The round's three places for the install hint:
 * - `menu`: a row in More (phone) and in the sidebar (desktop, Chrome or Edge);
 * - `card`: a card once at the top of the page on the phone, nothing after Not now;
 * - `both`: the card once, then the row in More (and the sidebar's row on the desktop).
 */
export type Variant = 'menu' | 'card' | 'both';

export interface PwaState {
  variant: Variant;
  platform: Platform;
  offline: boolean;
  /** The app was installed while the story is shown (Install in the sheet). */
  installed: boolean;
  /** Not now on the card. */
  cardDismissed: boolean;
  openSheet: () => void;
  dismissCard: () => void;
}

export const PwaContext = createContext<PwaState | null>(null);

export function usePwa(): PwaState {
  const state = useContext(PwaContext);
  if (!state) throw new Error('usePwa needs a PwaContext');
  return state;
}

/** The app can still be installed here: in a browser, not yet installed. */
export function canInstall(state: PwaState): boolean {
  return state.platform !== 'Installed app' && !state.installed;
}

/** The menu rows (More, the sidebar) are in this variant, now. */
export function showsRow(state: PwaState): boolean {
  if (!canInstall(state)) return false;
  return state.variant === 'menu' || (state.variant === 'both' && state.cardDismissed);
}

/** The card is at the top of the page (phone only). */
export function showsCard(state: PwaState): boolean {
  return canInstall(state) && state.variant !== 'menu' && !state.cardDismissed;
}
