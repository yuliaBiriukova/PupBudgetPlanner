import type { MockAnswer, MockRoutes } from '../../test/mockRoutes';
import type { InvitationPreview } from '../auth/authApi';
import type { Invitation } from '../people/peopleApi';
import { LINK_DAYS, type Family } from './familyApi';
import { isoIn, OLENA_ID, ownersLinks } from './familyTestData';

const conflict: MockAnswer = { status: 409 };
const notFound: MockAnswer = { status: 404 };
const forbidden: MockAnswer = { status: 403 };
const done: MockAnswer = { status: 204 };

interface FakeFamilyOptions {
  /** The family links the signed-in person may open: token → what the invite page shows. */
  links?: Record<string, InvitationPreview>;
  /** The owner's links on the Family page (I-006); an owner's family starts with `ownersLinks`. */
  invitations?: Invitation[];
  /** Answer every change with a 500. */
  fail?: boolean;
}

const idsOf = (body: Record<string, unknown>) =>
  Array.isArray(body.ids) ? body.ids.filter((id): id is string => typeof id === 'string') : [];

/**
 * The family API of the stories and unit tests (F-023), as the signed-in Olena, keeping every change while it runs,
 * with the API's rules: one family at a time, only the owner renames, invites and removes, an owner leaving others
 * names the next owner, a link works once; only the owner lists, cancels and deletes the family's links (I-006).
 */
export function fakeFamilyRoutes(
  start: Family | null,
  { links = {}, invitations, fail = false }: FakeFamilyOptions = {},
): MockRoutes {
  let family: Family | null = structuredClone(start);
  const waiting = new Map(Object.entries(structuredClone(links)));
  let familyLinks: Invitation[] = structuredClone(
    invitations ?? (start?.isOwner ? ownersLinks() : []),
  );
  let next = 1;
  /** Only waiting links change; says how many did. */
  const cancel = (ids: string[]) => {
    let cancelled = 0;
    familyLinks = familyLinks.map((l) => {
      if (!ids.includes(l.id) || l.status !== 'Waiting') return l;
      cancelled++;
      return { ...l, status: 'Cancelled', cancelledAt: new Date().toISOString() };
    });
    return cancelled;
  };
  /** The owner's family, or why not. */
  const owners = (): MockAnswer | null => (!family ? notFound : !family.isOwner ? forbidden : null);
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
      };
      familyLinks = [];
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
      familyLinks = [
        {
          id: made.id,
          note,
          status: 'Waiting',
          createdAt: new Date().toISOString(),
          expiresAt: made.expiresAt,
          usedAt: null,
          usedByName: null,
          cancelledAt: null,
          familyName: family.name,
        },
        ...familyLinks,
      ];
      return { json: made };
    }),
    '/api/family/invitations': () => owners() ?? { json: familyLinks },
    'POST /api/family/invitations/{id}/cancel': change((_, { id = '' }) => {
      const refused = owners();
      if (refused) return refused;
      const link = familyLinks.find((l) => l.id === id);
      if (!link) return notFound;
      if (link.status !== 'Waiting') return conflict;
      cancel([id]);
      return done;
    }),
    'POST /api/family/invitations/cancel': change(
      (body) => owners() ?? { json: { count: cancel(idsOf(body)) } },
    ),
    'POST /api/family/invitations/delete': change((body) => {
      const refused = owners();
      if (refused) return refused;
      const ids = idsOf(body);
      const before = familyLinks.length;
      familyLinks = familyLinks.filter((l) => !ids.includes(l.id));
      return { json: { count: before - familyLinks.length } };
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
      };
      return done;
    }),
    '/api/invitations/{token}': (_body, _query, { token = '' }) => {
      const link = waiting.get(token);
      return link ? { json: link } : notFound;
    },
  };
}
