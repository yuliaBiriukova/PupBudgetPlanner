import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { expect, within } from 'storybook/test';
import { fakeFamilyRoutes } from '../../features/family/familyFakeApi';
import { ownersFamily, ownersLinks } from '../../features/family/familyTestData';
import { fakePrivacyRoutes, NOTHING_KEPT } from '../../features/family/privacyFakeApi';
import type { Family } from '../../features/family/familyApi';
import type { Invitation } from '../../features/people/peopleApi';
import { MockFetch, type MockRoutes } from '../../test/mockFetch';
import type { MockAnswer } from '../../test/mockRoutes';
import { ProtoFamilyPage } from './ProtoFamilyPage';
import { ProtoPeoplePage } from './ProtoPeoplePage';

const day = 24 * 3600 * 1000;
const isoIn = (days: number) => new Date(Date.now() + days * day).toISOString();

const link = (
  id: string,
  note: string | null,
  status: Invitation['status'],
  createdIn: number,
  extra: Partial<Invitation> = {},
): Invitation => ({
  id,
  note,
  status,
  createdAt: isoIn(createdIn),
  expiresAt: isoIn(createdIn + 7),
  usedAt: null,
  usedByName: null,
  cancelledAt: null,
  ...extra,
});

/** Every link in the database, the admin's and families' (the People page's Invite links tab). */
const ADMIN_LINKS: Invitation[] = [
  link('l-ira', 'For Ira', 'Used', -6, { usedAt: isoIn(-5), usedByName: 'Iryna Melnyk' }),
  link('l-petro', 'For Petro', 'Waiting', -1),
  link('l-taras', 'For Taras', 'Expired', -12),
  link('l-mom', 'For Mom', 'Waiting', -3, { familyName: 'Kovalenko' }),
  link('l-dima', 'For Dima', 'Used', -2, { usedAt: isoIn(-2), usedByName: 'Dmytro Lysenko' }),
  link('l-test', null, 'Cancelled', -9, { cancelledAt: isoIn(-8) }),
  link('l-grandpa', 'Grandpa', 'Cancelled', -20, {
    cancelledAt: isoIn(-19),
    familyName: 'Kovalenko',
  }),
];

const LINKS = {
  'Some statuses missing': (all: Invitation[]) =>
    all.filter((l) => l.status === 'Waiting' || l.status === 'Used'),
  'Every status': (all: Invitation[]) => all,
  None: () => [],
};

interface InviteLinksProps {
  /** Which page: the admin's Invite links tab, or Olena's Family page (she owns the Kovalenko family). */
  page: 'People: Invite links' | 'Family';
  /** Which links there are when the page opens; cancelling and deleting are kept while the story is shown. */
  links: keyof typeof LINKS;
}

const ADMIN = {
  id: 'p-yulia',
  displayName: 'Yulia Biriukova',
  email: 'yulia@example.com',
  isAdmin: true,
};
const OLENA = { id: 'p-olena', displayName: 'Olena', email: 'olena@example.com', isAdmin: false };

/** The admin's links API (I-006), keeping cancels and deletes. */
function adminLinkRoutes(start: Invitation[]): MockRoutes {
  let links = [...start];
  const idsOf = (body: unknown) => (body as { ids?: string[] } | null)?.ids ?? [];
  return {
    '/api/admin/invitations': () => ({ json: links }),
    'POST /api/admin/invitations/{id}/cancel': (_body, _query, { id = '' }) => {
      links = links.map((l) =>
        l.id === id ? { ...l, status: 'Cancelled', cancelledAt: new Date().toISOString() } : l,
      );
      return { status: 204 };
    },
    'POST /api/admin/invitations/cancel': (body) => {
      const ids = idsOf(body);
      const count = links.filter((l) => ids.includes(l.id) && l.status === 'Waiting').length;
      links = links.map((l) =>
        ids.includes(l.id) && l.status === 'Waiting'
          ? { ...l, status: 'Cancelled', cancelledAt: new Date().toISOString() }
          : l,
      );
      return { json: { count } };
    },
    'POST /api/admin/invitations/delete': (body) => {
      const ids = idsOf(body);
      const before = links.length;
      links = links.filter((l) => !ids.includes(l.id));
      return { json: { count: before - links.length } };
    },
  };
}

/**
 * I-032's final prototype: the People page's Invite links tab as one list, waiting links first, a status tag on each
 * row, one Select all; the Family page's groups only when they have links.
 */
function InviteLinksPrototype({ page, links }: InviteLinksProps) {
  const [routes] = useState<MockRoutes>(() => {
    if (page === 'People: Invite links')
      return {
        ...adminLinkRoutes(LINKS[links](ADMIN_LINKS)),
        '/api/auth/me': { json: ADMIN },
        '/api/health': { json: { status: 'Healthy' } },
        '/api/admin/people': { json: [] },
      };
    const fake = fakeFamilyRoutes(ownersFamily(), { invitations: LINKS[links](ownersLinks()) });
    const privacy = fakePrivacyRoutes(NOTHING_KEPT);
    const familyOf = fake['/api/family'] as () => MockAnswer;
    return {
      ...fake,
      ...privacy.routes,
      '/api/auth/me': { json: OLENA },
      '/api/family': () => {
        const answer = familyOf();
        return typeof answer === 'object' && 'json' in answer
          ? { json: privacy.withMine(answer.json as Family) }
          : answer;
      },
    };
  });
  const [router] = useState(() =>
    createMemoryRouter(
      [
        { path: '/people', element: <ProtoPeoplePage tab="people" /> },
        { path: '/people/links', element: <ProtoPeoplePage tab="links" /> },
        // In <main>, as in the app shell: the page's header isn't the document's banner
        {
          path: '/family',
          element: (
            <main>
              <ProtoFamilyPage />
            </main>
          ),
        },
        { path: '*', element: <main /> },
      ],
      { initialEntries: [page === 'Family' ? '/family' : '/people/links'] },
    ),
  );

  return (
    <MockFetch routes={routes}>
      <RouterProvider router={router} />
    </MockFetch>
  );
}

const meta = {
  title: 'Prototypes/I-032 Invite links',
  component: InviteLinksPrototype,
  parameters: { layout: 'fullscreen' },
  args: { page: 'People: Invite links', links: 'Every status' },
  argTypes: {
    page: { control: 'inline-radio', options: ['People: Invite links', 'Family'] },
    links: { control: 'inline-radio', options: Object.keys(LINKS) },
  },
} satisfies Meta<typeof InviteLinksPrototype>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Opens on the Invite links tab; the Family page and the other sets of links are in the controls. */
export const FinalPrototype: Story = {
  name: 'Final prototype',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('For Petro')).toBeInTheDocument();
    await expect(canvas.queryByText('Expired and cancelled')).not.toBeInTheDocument();
  },
};
