import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMemo, useState, type ReactNode } from 'react';
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router';
import { expect, within } from 'storybook/test';
import { sectionRoutes } from '../../app/routes';
import { AppLayout } from '../../app/shell/AppLayout';
import { healthQuery } from '../../app/shell/useServerWake';
import { OVERVIEW } from '../../features/accounts/accountsTestData';
import { MockFetch, type MockRoutes } from '../../test/mockFetch';
import { ME, type FamilyRole, type Who } from './deleteData';
import { DeletedScreen } from './DeleteParts';
import { DeleteContext, type DeleteSetup } from './deleteFlow';
import { ProtoSettings } from './ProtoSettings';
import { Variant1Section } from './Variant1';
import { Variant2Section } from './Variant2';
import { DELETE_PAGE, DeletePage, Variant3Section } from './Variant3';

interface StoryProps {
  /** How the person signs in (the proof asked), or the admin (no button). */
  who: Who;
  /** In a family as its owner with others, as a member, or in none. */
  family: FamilyRole;
}

const ROUTES = (who: Who): MockRoutes => ({
  '/api/auth/me': {
    json: { id: 'yulia', displayName: ME.name, email: ME.email, isAdmin: who === 'admin' },
  },
  '/api/family': { status: 204 },
  '/api/settings': { json: { displayName: ME.name, email: ME.email, reportCurrency: 'UAH' } },
  '/api/accounts': { json: OVERVIEW },
  '/api/accounts/total': {
    json: { currency: 'UAH', total: 412300, ratesDate: '2026-11-13', status: 'Current', rates: [] },
  },
});

function awakeQueryClient() {
  const client = new QueryClient();
  client.setQueryData(healthQuery.queryKey, true);
  return client;
}

/** The app on Settings as Yulia, with the variant's Delete account; after deleting, the signed-out screen. */
function DeleteStory({
  who,
  family,
  section,
  extraRoutes = [],
}: StoryProps & { section: ReactNode; extraRoutes?: RouteObject[] }) {
  const [deleted, setDeleted] = useState(false);
  const [round, setRound] = useState(0);
  const setup = useMemo<DeleteSetup>(
    () => ({
      who,
      family,
      onDeleted: () => {
        setDeleted(true);
      },
    }),
    [who, family],
  );

  return (
    <MockFetch routes={ROUTES(who)}>
      <DeleteContext.Provider value={setup}>
        {deleted ? (
          <DeletedScreen
            onAgain={() => {
              setDeleted(false);
              setRound((r) => r + 1);
            }}
          />
        ) : (
          <Shell
            key={`${who}-${family}-${String(round)}`}
            who={who}
            section={section}
            extraRoutes={extraRoutes}
          />
        )}
      </DeleteContext.Provider>
    </MockFetch>
  );
}

function Shell({
  who,
  section,
  extraRoutes,
}: {
  who: Who;
  section: ReactNode;
  extraRoutes: RouteObject[];
}) {
  const [client] = useState(awakeQueryClient);
  const [router] = useState(() =>
    createMemoryRouter(
      [
        {
          element: (
            <AppLayout user={{ name: 'Yulia', email: ME.email, isAdmin: who === 'admin' }} />
          ),
          children: [
            ...sectionRoutes.filter((route) => route.path !== 'settings'),
            { path: 'settings', element: <ProtoSettings section={section} /> },
            ...extraRoutes,
          ],
        },
      ],
      { initialEntries: ['/settings'] },
    ),
  );
  return (
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

const meta = {
  title: 'Prototypes/F-027 Delete my account',
  component: DeleteStory,
  parameters: { layout: 'fullscreen' },
  args: { who: 'password', family: 'owner', section: null },
  argTypes: {
    who: {
      control: 'inline-radio',
      options: ['password', 'google', 'admin'],
      description: 'How the person signs in, or the admin',
    },
    family: {
      control: 'inline-radio',
      options: ['owner', 'member', 'none'],
      description: 'Owner of a family with others, a member, or in none',
    },
    section: { table: { disable: true } },
    extraRoutes: { table: { disable: true } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: 'Delete account' }, { timeout: 4000 }),
    ).toBeVisible();
  },
} satisfies Meta<typeof DeleteStory>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A red word button on Settings; one pop-up (a sheet on the phone) asks everything. */
export const Variant1Dialog: Story = {
  name: 'Variant 1: One dialog',
  render: (args) => <DeleteStory {...args} section={<Variant1Section />} />,
};

/** Nothing pops up: what goes is on the page, the steps unfold in the section. */
export const Variant2InPlace: Story = {
  name: 'Variant 2: In place',
  render: (args) => <DeleteStory {...args} section={<Variant2Section />} />,
};

/** A row on Settings opens a page of its own: your money and counts on top, the confirmation under them. */
export const Variant3LastPage: Story = {
  name: 'Variant 3: The last page',
  render: (args) => (
    <DeleteStory
      {...args}
      section={<Variant3Section />}
      extraRoutes={[{ path: DELETE_PAGE.slice(1), element: <DeletePage /> }]}
    />
  ),
};
