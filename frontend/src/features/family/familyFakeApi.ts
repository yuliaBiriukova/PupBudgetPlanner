import type { MockAnswer, MockRoutes } from '../../test/mockRoutes';
import type { InvitationPreview } from '../auth/authApi';
import { LINK_DAYS, type Family } from './familyApi';
import { isoIn, OLENA_ID } from './familyTestData';

const conflict: MockAnswer = { status: 409 };
const notFound: MockAnswer = { status: 404 };
const forbidden: MockAnswer = { status: 403 };
const done: MockAnswer = { status: 204 };

interface FakeFamilyOptions {
  /** The family links the signed-in person may open: token → what the invite page shows. */
  links?: Record<string, InvitationPreview>;
  /** Answer every change with a 500. */
  fail?: boolean;
}

/**
 * The family API of the stories and unit tests (F-023), as the signed-in Olena, keeping every change while it runs,
 * with the API's rules: one family at a time, only the owner renames, invites and removes, an owner leaving others
 * names the next owner, a link works once.
 */
export function fakeFamilyRoutes(
  start: Family | null,
  { links = {}, fail = false }: FakeFamilyOptions = {},
): MockRoutes {
  let family: Family | null = structuredClone(start);
  const waiting = new Map(Object.entries(structuredClone(links)));
  let next = 1;
  const change =
    (apply: (body: Record<string, unknown>, params: Record<string, string>) => MockAnswer) =>
    (body: unknown, _query: URLSearchParams, params: Record<string, string>): MockAnswer =>
      fail ? { status: 500 } : apply((body ?? {}) as Record<string, unknown>, params);

  return {
    '/api/family': () => (family ? { json: family } : { status: 204 }),
    'POST /api/family': change((body) => {
      if (family) return conflict;
      const now = new Date().toISOString();
      family = {
        id: `family-${String(next++)}`,
        name: String(body.name).trim(),
        createdAt: now,
        isOwner: true,
        members: [
          {
            id: OLENA_ID,
            displayName: 'Olena',
            isOwner: true,
            isYou: true,
            startedFamily: true,
            joinedAt: now,
            transactions: 'Every',
            keepsPrivate: false,
          },
        ],
        invitations: [],
      };
      return done;
    }),
    'PUT /api/family/name': change((body) => {
      if (!family) return notFound;
      if (!family.isOwner) return forbidden;
      family = { ...family, name: String(body.name).trim() };
      return done;
    }),
    'POST /api/family/invitations': change((body) => {
      if (!family) return notFound;
      if (!family.isOwner) return forbidden;
      const note = typeof body.note === 'string' && body.note.trim() ? body.note.trim() : null;
      const made = {
        id: `link-${String(next)}`,
        token: `k7${String(next++)}x9f2qa`,
        note,
        expiresAt: isoIn(LINK_DAYS),
      };
      family = {
        ...family,
        invitations: [
          { id: made.id, note, createdAt: new Date().toISOString(), expiresAt: made.expiresAt },
          ...family.invitations,
        ],
      };
      return { json: made };
    }),
    'POST /api/family/invitations/{id}/cancel': change((_, { id }) => {
      if (!family) return notFound;
      if (!family.isOwner) return forbidden;
      if (!family.invitations.some((i) => i.id === id)) return notFound;
      family = { ...family, invitations: family.invitations.filter((i) => i.id !== id) };
      return done;
    }),
    'POST /api/family/members/{id}/remove': change((_, { id }) => {
      if (!family) return notFound;
      if (!family.isOwner) return forbidden;
      if (id === OLENA_ID) return conflict;
      if (!family.members.some((m) => m.id === id)) return notFound;
      family = { ...family, members: family.members.filter((m) => m.id !== id) };
      return done;
    }),
    'POST /api/family/leave': change((body) => {
      if (!family) return notFound;
      const others = family.members.filter((m) => !m.isYou);
      if (family.isOwner && others.length > 0 && !others.some((m) => m.id === body.newOwnerId))
        return { status: 400 };
      family = null;
      return done;
    }),
    'POST /api/family/join': change((body) => {
      if (family) return conflict;
      const token = String(body.token);
      const link = waiting.get(token);
      if (!link?.family) return { status: 410 };
      waiting.delete(token);
      family = {
        id: link.family.id,
        name: link.family.name,
        createdAt: isoIn(-40),
        isOwner: false,
        members: [
          ...link.family.members.map((m, i) => ({
            id: `member-${String(i)}`,
            displayName: m.displayName,
            isOwner: m.isOwner,
            isYou: false,
            startedFamily: m.isOwner,
            joinedAt: isoIn(-40 + i),
            transactions: 'Every' as const,
            keepsPrivate: false,
          })),
          {
            id: OLENA_ID,
            displayName: 'Olena',
            isOwner: false,
            isYou: true,
            startedFamily: false,
            joinedAt: new Date().toISOString(),
            transactions: 'Every',
            keepsPrivate: false,
          },
        ],
        invitations: [],
      };
      return done;
    }),
    '/api/invitations/{token}': (_body, _query, { token = '' }) => {
      const link = waiting.get(token);
      return link ? { json: link } : notFound;
    },
  };
}
