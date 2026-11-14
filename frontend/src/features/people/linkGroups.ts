import type { Invitation } from './peopleApi';

/**
 * Invite links as the Invite links tab and the Family page show them (I-006): the Invite links tab's three groups that
 * fold, and which of them the admin left open (B-027). The Family page lists them in one list, without groups (I-032).
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

/** The Family page's one list (I-032): waiting links first (they still work, Cancel is on them), then the rest;
 * each part newest first. */
export function inListOrder(links: readonly Invitation[]): Invitation[] {
  const newestFirst = (a: Invitation, b: Invitation) => b.createdAt.localeCompare(a.createdAt);
  return [
    ...links.filter((link) => link.status === 'Waiting').sort(newestFirst),
    ...links.filter((link) => link.status !== 'Waiting').sort(newestFirst),
  ];
}

/** Which groups are open: Waiting at first, the others folded. */
export type OpenGroups = Record<LinkGroup, boolean>;

const FIRST: OpenGroups = { waiting: true, used: false, old: false };

/** Where the Invite links tab keeps its open groups, as before I-032 (B-027). The Family page's old key is left unread. */
const OPEN_KEY = 'pup.people.links.open';

function parse(value: string | null): unknown {
  if (value === null) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/** The groups left open in this browser, or the first ones. Storage may be refused (private windows). */
export function readOpen(): OpenGroups {
  try {
    const saved = parse(localStorage.getItem(OPEN_KEY));
    if (saved && typeof saved === 'object') {
      const open = saved as Partial<Record<LinkGroup, unknown>>;
      return {
        waiting: typeof open.waiting === 'boolean' ? open.waiting : FIRST.waiting,
        used: open.used === true,
        old: open.old === true,
      };
    }
  } catch {
    // Storage refused: the first ones
  }
  return { ...FIRST };
}

export function writeOpen(open: OpenGroups) {
  try {
    localStorage.setItem(OPEN_KEY, JSON.stringify(open));
  } catch {
    // Private windows may refuse storage; the groups just start as at first next time
  }
}
