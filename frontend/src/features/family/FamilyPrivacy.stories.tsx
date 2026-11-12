import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { expect, within } from 'storybook/test';
import { sectionRoutes } from '../../app/routes';
import { AppLayout } from '../../app/shell/AppLayout';
import { healthQuery } from '../../app/shell/useServerWake';
import { MockFetch } from '../../test/mockFetch';
import { ANDRIY_ID } from './familyTestData';
import { familyOf } from './familyViewsFakeApi';
import { ANDRIY_KEEPS, familyPrivacyRoutes, NOTHING_KEPT, OLENA_KEEPS } from './privacyFakeApi';
import { FAMILY, ME } from './whose';
import { WHO_KEY } from './WhoseProvider';

const PAGES = {
  Family: '/family',
  Transactions: '/transactions',
  Accounts: '/accounts',
  Reports: '/reports',
};
const WHOSE = { Mine: ME, "Andriy's": ANDRIY_ID, "The family's": FAMILY };
const OLENA = { 'Some kept': OLENA_KEEPS, 'Nothing kept': NOTHING_KEPT };

interface FamilyPrivacyProps {
  /** The page it opens on; the others are in the menu. */
  start: keyof typeof PAGES;
  /** The lens's choice kept on the device when the app opens. */
  whose: keyof typeof WHOSE;
  /** What Olena keeps from the family when the app opens; every change is kept while it is shown. */
  olena: keyof typeof OLENA;
  /** What Andriy shares of his transactions (his hidden account, balance-only account and Gifts are fixed). */
  andriy: 'Every transaction' | 'Only totals';
  /** Who is in Olena's family. */
  family: 'Couple' | 'Three people';
}

function awakeQueryClient() {
  const queryClient = new QueryClient();
  queryClient.setQueryData(healthQuery.queryKey, true);
  return queryClient;
}

/**
 * The app as Olena (F-030): the Family page's "What the family sees", the marks on her own cards and lines, and
 * Andriy's money without what he keeps, on a fake API that applies both their settings.
 */
function FamilyPrivacy({ start, olena, andriy, family }: FamilyPrivacyProps) {
  const [client] = useState(awakeQueryClient);
  const [state] = useState(() => {
    const members = familyOf(family);
    if (!members) throw new Error('A family is needed');
    return {
      routes: familyPrivacyRoutes(members, OLENA[olena], {
        ...ANDRIY_KEEPS,
        transactions: andriy === 'Only totals' ? 'Totals' : 'Every',
      }),
      router: createMemoryRouter(
        [
          {
            element: <AppLayout user={{ name: 'Olena', email: 'olena@example.com' }} />,
            children: sectionRoutes,
          },
        ],
        { initialEntries: [PAGES[start]] },
      ),
    };
  });

  return (
    <MockFetch routes={state.routes}>
      <QueryClientProvider client={client}>
        <RouterProvider router={state.router} />
      </QueryClientProvider>
    </MockFetch>
  );
}

const meta = {
  title: 'Family/Family privacy',
  component: FamilyPrivacy,
  parameters: { layout: 'fullscreen' },
  args: {
    start: 'Family',
    whose: 'Mine',
    olena: 'Some kept',
    andriy: 'Every transaction',
    family: 'Couple',
  },
  argTypes: {
    start: { control: 'inline-radio', options: Object.keys(PAGES) },
    whose: { control: 'inline-radio', options: Object.keys(WHOSE) },
    olena: { control: 'inline-radio', options: Object.keys(OLENA) },
    andriy: { control: 'inline-radio', options: ['Every transaction', 'Only totals'] },
    family: { control: 'inline-radio', options: ['Couple', 'Three people'] },
  },
  // New settings, a new page or a new choice is a new app; the sidebar starts as the app's default
  render: (args) => (
    <FamilyPrivacy
      key={`${args.start}-${args.whose}-${args.olena}-${args.andriy}-${args.family}`}
      {...args}
    />
  ),
  beforeEach: ({ args }) => {
    localStorage.removeItem('pup.sidebar');
    const who = WHOSE[args.whose];
    if (who === ME) localStorage.removeItem(WHO_KEY);
    else localStorage.setItem(WHO_KEY, who);
  },
} satisfies Meta<typeof FamilyPrivacy>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The Family page: what the family sees of Olena's money, as three rows that unfold. */
export const FamilyPage: Story = {
  name: 'What the family sees',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: 'What the family sees' }),
    ).toBeInTheDocument();
  },
};

/** Olena's own accounts: her hidden card has an eye-off, her balance-only one coins. */
export const MyAccounts: Story = {
  name: 'My accounts, marked',
  args: { start: 'Accounts' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Hidden from the family:')).toBeInTheDocument();
  },
};

/** Olena's own lines: a lock on those the family doesn't see. */
export const MyTransactions: Story = {
  name: 'My transactions, marked',
  args: { start: 'Transactions' },
};

/** Andriy's accounts: his hidden one gone, his pocket cash with the coins mark; the band says he keeps some. */
export const AndriysAccounts: Story = {
  name: "Andriy's accounts",
  args: { start: 'Accounts', whose: "Andriy's" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Pocket')).toBeInTheDocument();
    await expect(canvas.queryByText('Dollars in the box')).not.toBeInTheDocument();
    await expect(canvas.getByText(/Andriy keeps some of it private/)).toBeInTheDocument();
  },
};

/** Andriy shares only totals: his slip and Where it went stay, no lines. */
export const AndriysTotals: Story = {
  name: "Andriy's totals only",
  args: { start: 'Transactions', whose: "Andriy's", andriy: 'Only totals' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: 'Only totals by category' }),
    ).toBeInTheDocument();
  },
};

/** The family's money: Andriy's hidden account and lines are gone; the band says some of his money is private. */
export const FamilysMoney: Story = {
  name: "The family's money",
  args: { start: 'Transactions', whose: "The family's" },
};
