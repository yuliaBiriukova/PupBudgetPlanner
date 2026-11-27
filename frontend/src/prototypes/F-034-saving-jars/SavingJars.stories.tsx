import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { sectionRoutes } from '../../app/routes';
import { healthQuery } from '../../app/shell/useServerWake';
import { OVERVIEW, TOTAL } from '../../features/accounts/accountsTestData';
import { thisMonth } from '../../features/budget/budget';
import { plannedMonth } from '../../features/budget/budgetTestData';
import { OLENA_ID } from '../../features/family/familyTestData';
import { MockFetch, type MockRoutes } from '../../test/mockFetch';
import { AccountsPage } from './AccountsPage';
import type { JarMoneyKind } from './JarMoney';
import { JarsPage } from './JarsPage';
import { AppLayout } from './ProtoAppLayout';
import { ProtoBudgetPage } from './ProtoBudgetPage';
import { JarWorldProvider } from './world';

/** What the shell asks: Olena, signed in, in no family, with this month planned (no banner). */
const ROUTES: MockRoutes = {
  '/api/auth/me': {
    json: { id: OLENA_ID, displayName: 'Olena', email: 'olena@example.com', isAdmin: false },
  },
  '/api/family': { status: 204 },
  // The month has 80 000 ₴ in total, so the jars fit in it next to the groups' 47 500 ₴
  '/api/budget': (_body, query) => ({
    json: { ...plannedMonth(query.get('month') ?? thisMonth()), total: 80_000 },
  }),
  '/api/accounts': { json: OVERVIEW },
  '/api/accounts/total': { json: TOTAL },
};

/** A query cache where the API has already answered its health check: no waking-up pill. */
function awakeClient() {
  const queryClient = new QueryClient();
  queryClient.setQueryData(healthQuery.queryKey, true);
  return queryClient;
}

const PAGES = { Jars: '/jars', Budget: '/budget', Accounts: '/accounts' } as const;

/**
 * The final prototype (owner, 2026-11-19: the drawn jars without a table view, the account cards saying only what is
 * free): Jars after Budget in the menu; the Jars page shows the jars on a shelf; Budget has the month's jars and the
 * saved money; Accounts says what of each account is free. The jars live in the prototype; the API counts as awake.
 */
function Final({ start, money = 'list' }: { start: keyof typeof PAGES; money?: JarMoneyKind }) {
  const [client] = useState(awakeClient);
  const [router] = useState(() =>
    createMemoryRouter(
      [
        {
          element: <AppLayout user={{ name: 'Olena', email: 'olena@example.com' }} />,
          children: [
            { path: 'jars', element: <JarsPage money={money} /> },
            { path: 'budget', element: <ProtoBudgetPage /> },
            { path: 'accounts', element: <AccountsPage /> },
            ...sectionRoutes.filter(
              (route) => !['jars', 'budget', 'accounts'].includes(route.path ?? ''),
            ),
          ],
        },
      ],
      { initialEntries: [PAGES[start]] },
    ),
  );
  return (
    <MockFetch routes={ROUTES}>
      <QueryClientProvider client={client}>
        <JarWorldProvider>
          <RouterProvider router={router} />
        </JarWorldProvider>
      </QueryClientProvider>
    </MockFetch>
  );
}

const meta = {
  title: 'Prototypes/F-034 Saving jars',
  component: Final,
  parameters: { layout: 'fullscreen' },
  args: { start: 'Jars' },
  argTypes: {
    start: { control: 'inline-radio', options: Object.keys(PAGES) },
    money: { table: { disable: true } },
  },
  beforeEach: () => {
    localStorage.removeItem('pup.sidebar');
  },
} satisfies Meta<typeof Final>;

export default meta;

/** Opens on Jars; Budget and Accounts are in the menu. `start` opens another page first. */
export const FinalPrototype: StoryObj<typeof meta> = {
  name: 'Final prototype',
  render: (args) => <Final key={args.start} {...args} />,
};

/** The block under the shelf, round of 2026-11-27 (owner: "Where the jar money lies" seemed redundant or not
 * straightforward). Each opens on Jars; scroll under the shelf. */
export const JarMoney1: StoryObj<typeof meta> = {
  name: 'Jar money 1: Only when short',
  args: { money: 'short' },
  render: (args) => <Final key={args.start} {...args} />,
};

export const JarMoney2: StoryObj<typeof meta> = {
  name: 'Jar money 2: Bars',
  args: { money: 'bars' },
  render: (args) => <Final key={args.start} {...args} />,
};

export const JarMoney3: StoryObj<typeof meta> = {
  name: 'Jar money 3: How Free adds up',
  args: { money: 'sum' },
  render: (args) => <Final key={args.start} {...args} />,
};
