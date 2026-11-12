import type { Invitation } from './peopleApi';

/**
 * Invite links as the Invite links tab and the Family page show them (I-006): three groups that fold, and which of
 * them the person left open.
 */

/** Where the links are: the admin's Invite links tab, or the family owner's Family page. */
export type Place = 'admin' | 'family';

export type LinkGroup = 'waiting' | 'used' | 'old';

export const GROUPS: LinkGroup[] = ['waiting', 'used', 'old'];

/** How long a link that stopped working is kept: the morning clean-up's `Cleanup:InvitationsKeptFor`. */
export const KEEP_DAYS = 30;

/** The most links one Cancel or Delete takes: the API's `InvitationsRequestValidator.MaxLinks`. */
export const MAX_LINKS = 200;

export function groupOf(link: Invitation): LinkGroup {
  if (link.status === 'Waiting') return 'waiting';
  if (link.status === 'Used') return 'used';
  return 'old';
}

/** When a link stopped working: used, cancelled or expired. Waiting links: null. */
export function stoppedAt(link: Invitation): string | null {
  if (link.status === 'Used') return link.usedAt ?? null;
  if (link.status === 'Cancelled') return link.cancelledAt ?? null;
  if (link.status === 'Expired') return link.expiresAt;
  return null;
}

const SHORT = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });

/** `12 Nov`: a link lives 7 days and old ones go after 30, so its dates need no year. */
export function shortDate(value: string): string {
  return SHORT.format(new Date(value));
}

/** Which groups are open: Waiting at first, the others folded. */
export type OpenGroups = Record<LinkGroup, boolean>;

const FIRST: OpenGroups = { waiting: true, used: false, old: false };

const OPEN_KEY: Record<Place, string> = {
  admin: 'pup.people.links.open',
  family: 'pup.family.links.open',
};

/**
 * Before I-006 the Invite links tab kept the folded groups the admin left *open* (Used, Expired and cancelled), and
 * Waiting didn't fold. A value saved then still leaves Waiting open.
 */
export const LEGACY_SHOWN_KEY = 'pup.people.links.shown';

function parse(value: string | null): unknown {
  if (value === null) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/** The groups left open in this browser, or the first ones. Storage may be refused (private windows). */
export function readOpen(place: Place): OpenGroups {
  try {
    const saved = parse(localStorage.getItem(OPEN_KEY[place]));
    if (saved && typeof saved === 'object') {
      const open = saved as Partial<Record<LinkGroup, unknown>>;
      return {
        waiting: typeof open.waiting === 'boolean' ? open.waiting : FIRST.waiting,
        used: open.used === true,
        old: open.old === true,
      };
    }
    if (place === 'admin') {
      const legacy = parse(localStorage.getItem(LEGACY_SHOWN_KEY));
      if (Array.isArray(legacy)) {
        return { waiting: true, used: legacy.includes('used'), old: legacy.includes('old') };
      }
    }
  } catch {
    // Storage refused: the first ones
  }
  return { ...FIRST };
}

export function writeOpen(place: Place, open: OpenGroups) {
  try {
    localStorage.setItem(OPEN_KEY[place], JSON.stringify(open));
  } catch {
    // Private windows may refuse storage; the groups just start as at first next time
  }
}
