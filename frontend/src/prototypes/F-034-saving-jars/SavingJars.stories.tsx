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
import { AccountsPage, type CardFit } from './AccountsPage';
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
function Final({ start, cardFit }: { start: keyof typeof PAGES; cardFit?: CardFit }) {
  const [client] = useState(awakeClient);
  const [router] = useState(() =>
    createMemoryRouter(
      [
        {
          element: <AppLayout user={{ name: 'Olena', email: 'olena@example.com' }} />,
          children: [
            { path: 'jars', element: <JarsPage /> },
            { path: 'budget', element: <ProtoBudgetPage /> },
            { path: 'accounts', element: <AccountsPage cardFit={cardFit} /> },
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

/**
 * "1 789 ₴ of jar money spent" on an account card that is too narrow for it (five a row at 1920 px), owner 2026-11-27:
 * three ways, each opening on Accounts.
 */
export const CardFit1: StoryObj<typeof meta> = {
  name: 'Card fit 1: Two lines',
  args: { start: 'Accounts', cardFit: 'wrap' },
  render: (args) => <Final key={args.start} {...args} />,
};

export const CardFit2: StoryObj<typeof meta> = {
  name: 'Card fit 2: Short on the card',
  args: { start: 'Accounts', cardFit: 'short' },
  render: (args) => <Final key={args.start} {...args} />,
};

export const CardFit3: StoryObj<typeof meta> = {
  name: 'Card fit 3: Four a row',
  args: { start: 'Accounts', cardFit: 'four' },
  render: (args) => <Final key={args.start} {...args} />,
};
