import type { InvitationPreview } from '../auth/authApi';
import type { Family, FamilyMember } from './familyApi';

/** Test data for the Family page (F-023): the Kovalenko family, as in the final prototype. */

const DAY = 24 * 60 * 60 * 1000;

/** A moment `days` from now (negative: in the past), so "6 days left" stays true whenever the tests run. */
export function isoIn(days: number): string {
  return new Date(Date.now() + days * DAY).toISOString();
}

/** The signed-in person of the unit tests and stories (`testUser` in test/server.ts). */
export const OLENA_ID = '01a181d1-df7b-7855-98c6-a2e2bc4c26bb';
export const ANDRIY_ID = '01a181d1-df7b-7855-98c6-a2e2bc4c26b1';
export const IRYNA_ID = '01a181d1-df7b-7855-98c6-a2e2bc4c26b2';
export const TARAS_ID = '01a181d1-df7b-7855-98c6-a2e2bc4c26b3';

const KOVALENKO_ID = '01a181d1-df7b-7855-98c6-a2e2bc4c2f01';
const MELNYK_ID = '01a181d1-df7b-7855-98c6-a2e2bc4c2f02';

function member(
  id: string,
  displayName: string,
  joinedDaysAgo: number,
  extra: Partial<FamilyMember> = {},
): FamilyMember {
  return {
    id,
    displayName,
    isOwner: false,
    isYou: id === OLENA_ID,
    startedFamily: false,
    joinedAt: isoIn(-joinedDaysAgo),
    transactions: 'Every',
    keepsPrivate: false,
    ...extra,
  };
}

/** Olena started Kovalenko with Andriy and Iryna; a link for Mom is waiting. */
export function ownersFamily(): Family {
  return {
    id: KOVALENKO_ID,
    name: 'Kovalenko',
    createdAt: isoIn(-40),
    isOwner: true,
    members: [
      member(OLENA_ID, 'Olena', 40, { isOwner: true, startedFamily: true }),
      member(ANDRIY_ID, 'Andriy', 38),
      member(IRYNA_ID, 'Iryna', 12),
    ],
    invitations: [{ id: 'inv-mom', note: 'Mom', createdAt: isoIn(-1), expiresAt: isoIn(6) }],
  };
}

/** Andriy's Kovalenko family, which Olena joined three days ago. */
export function membersFamily(): Family {
  return {
    id: KOVALENKO_ID,
    name: 'Kovalenko',
    createdAt: isoIn(-40),
    isOwner: false,
    members: [
      member(ANDRIY_ID, 'Andriy', 40, { isOwner: true, startedFamily: true }),
      member(IRYNA_ID, 'Iryna', 12),
      member(OLENA_ID, 'Olena', 3),
    ],
    invitations: [],
  };
}

/** Taras's Melnyk family, which Olena is in when Andriy's link reaches her. */
export function otherFamily(): Family {
  return {
    id: MELNYK_ID,
    name: 'Melnyk',
    createdAt: isoIn(-90),
    isOwner: false,
    members: [
      member(TARAS_ID, 'Taras', 90, { isOwner: true, startedFamily: true }),
      member(OLENA_ID, 'Olena', 60),
    ],
    invitations: [],
  };
}

/** The token of Andriy's link to the Kovalenko family. */
export const KOVALENKO_TOKEN = 'kovalenko-link';

/** What the invite page shows about Andriy's link. */
export const KOVALENKO_PREVIEW: InvitationPreview = {
  inviterName: 'Andriy',
  expiresAt: isoIn(5),
  family: {
    id: KOVALENKO_ID,
    name: 'Kovalenko',
    members: [
      { displayName: 'Andriy', isOwner: true },
      { displayName: 'Iryna', isOwner: false },
    ],
  },
};
