import type { Invitation } from './peopleApi';

/**
 * Invite links as the Invite links tab and the Family page show them: one list, waiting ones first (I-006, I-032).
 */

/** Where the links are: the admin's Invite links tab, or the family owner's Family page. */
export type Place = 'admin' | 'family';

/** How long a link that stopped working is kept: the morning clean-up's `Cleanup:InvitationsKeptFor`. */
export const KEEP_DAYS = 30;

/** The most links one Cancel or Delete takes: the API's `InvitationsRequestValidator.MaxLinks`. */
export const MAX_LINKS = 200;

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

/** The one list's order (I-032): waiting links first (they still work, Cancel is on them), then the rest;
 * each part newest first. */
export function inListOrder(links: readonly Invitation[]): Invitation[] {
  const newestFirst = (a: Invitation, b: Invitation) => b.createdAt.localeCompare(a.createdAt);
  return [
    ...links.filter((link) => link.status === 'Waiting').sort(newestFirst),
    ...links.filter((link) => link.status !== 'Waiting').sort(newestFirst),
  ];
}
