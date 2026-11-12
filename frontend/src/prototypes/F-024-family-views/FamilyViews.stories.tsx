import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { sectionRoutes } from '../../app/routes';
import { healthQuery } from '../../app/shell/useServerWake';
import { MockFetch } from '../../test/mockFetch';
import { ProtoAccountsPage } from './ProtoAccountsPage';
import { ProtoAppLayout } from './ProtoAppLayout';
import { ProtoReportsPage } from './ProtoReportsPage';
import { ProtoTransactionsPage } from './ProtoTransactionsPage';
import { WhoProvider } from './WhoProvider';
import { familyOf, familyRoutes, peopleOf, type FamilyChoice } from './world';

const PAGES = { Transactions: '/transactions', Accounts: '/accounts', Reports: '/reports' };

interface PrototypeProps {
  /** Who is in Olena's family: Andriy (the default), Andriy and Iryna, or nobody (no switcher anywhere). */
  family: FamilyChoice;
  /** The page it opens on; the others are in the menu. */
  start: keyof typeof PAGES;
}

/** The app as Olena with the lens of whose money, and a fake API that answers for whose money is asked. */
function Prototype({ family, start }: PrototypeProps) {
  const [client] = useState(() => new QueryClient());
  // The API counts as awake: no waking-up pill
  client.setQueryData(healthQuery.queryKey, true);
  const [state] = useState(() => {
    const kovalenko = familyOf(family);
    const router = createMemoryRouter(
      [
        {
          element: <ProtoAppLayout user={{ name: 'Olena', email: 'olena@example.com' }} />,
          children: [
            { path: 'transactions', element: <ProtoTransactionsPage /> },
            { path: 'accounts', element: <ProtoAccountsPage /> },
            { path: 'reports', element: <ProtoReportsPage /> },
            ...sectionRoutes.filter(
              (route) => !['transactions', 'accounts', 'reports'].includes(route.path ?? ''),
            ),
          ],
        },
      ],
      { initialEntries: [PAGES[start]] },
    );
    return { routes: familyRoutes(kovalenko), people: peopleOf(kovalenko), router };
  });

  return (
    <MockFetch routes={state.routes}>
      <QueryClientProvider client={client}>
        <WhoProvider people={state.people}>
          <RouterProvider router={state.router} />
        </WhoProvider>
      </QueryClientProvider>
    </MockFetch>
  );
}

const meta = {
  title: 'Prototypes/F-024 Family views',
  component: Prototype,
  parameters: { layout: 'fullscreen' },
  args: { family: 'Couple', start: 'Transactions' },
  argTypes: {
    family: { control: 'inline-radio', options: ['Couple', 'Three people', 'No family'] },
    start: { control: 'inline-radio', options: Object.keys(PAGES) },
  },
  // A new family or start page is a new app; the sidebar and the lens start as the app's default
  render: (args) => <Prototype key={`${args.family}-${args.start}`} {...args} />,
  beforeEach: () => {
    localStorage.removeItem('pup.sidebar');
    localStorage.removeItem('pup.whose');
  },
} satisfies Meta<typeof Prototype>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Variant 1, "One lens" (chosen 2026-11-12): whose money is picked in the sidebar (the phone's top bar) and kept on
 * every page and on the device; someone else's money says so over the page, with Back to mine.
 */
export const Final: Story = { name: 'Final prototype' };
