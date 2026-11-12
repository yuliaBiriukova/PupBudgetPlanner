import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMemo, useState, type ReactNode } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { expect, within } from 'storybook/test';
import { sectionRoutes } from '../../app/routes';
import { healthQuery } from '../../app/shell/useServerWake';
import { familyOf } from '../../features/family/familyViewsFakeApi';
import { WHO_KEY } from '../../features/family/WhoseProvider';
import { MockFetch } from '../../test/mockFetch';
import {
  ANDRIYS,
  NOTHING_PRIVATE,
  PrivacyContext,
  SOME_PRIVATE,
  type Privacy,
  type PrivacyState,
} from './privacy';
import { privacyRoutes } from './privacyFakeApi';
import { AccountsPage } from './ProtoAccountsPage';
import { AppLayout } from './ProtoAppLayout';
import { ProtoFamilyPage } from './ProtoFamilyPage';
import { TransactionsPage } from './ProtoTransactionsPage';

const STARTS = { 'Some kept private': SOME_PRIVATE, 'Nothing private': NOTHING_PRIVATE };
const ANDRIY_LINES = {
  'Every transaction': ANDRIYS,
  'Only totals': { ...ANDRIYS, lines: 'Totals' } satisfies Privacy,
};

/** F-030's copies of the pages: the Family page's new section, the private marks, Andriy's totals-only page. */
const PAGES: Record<string, ReactNode> = {
  family: <ProtoFamilyPage />,
  transactions: <TransactionsPage />,
  accounts: <AccountsPage />,
};

interface FamilyPrivacyProps {
  /** Olena's settings when the page opens; every change is kept while the story is shown. */
  start: keyof typeof STARTS;
  /** What Andriy shares of his transactions (his hidden account, balance-only account and Gifts are fixed). */
  andriy: keyof typeof ANDRIY_LINES;
  /** Who is in Olena's family. */
  family: 'Couple' | 'Three people';
}

function awakeQueryClient() {
  const queryClient = new QueryClient();
  queryClient.setQueryData(healthQuery.queryKey, true);
  return queryClient;
}

/**
 * The app as Olena on the Family page, with "What the family sees of your money". Her own cards and lines show what
 * she keeps private; with the lens on Andriy's money or the family's, what he keeps is gone and the band says so.
 */
function FamilyPrivacy({ start, andriy, family }: FamilyPrivacyProps) {
  const [client] = useState(awakeQueryClient);
  const [privacy, setPrivacy] = useState<Privacy>(() => structuredClone(STARTS[start]));
  const [state] = useState(() => {
    const members = familyOf(family);
    if (!members) throw new Error('A family is needed');
    return {
      routes: privacyRoutes(members, ANDRIY_LINES[andriy]),
      router: createMemoryRouter(
        [
          {
            element: <AppLayout user={{ name: 'Olena', email: 'olena@example.com' }} />,
            children: sectionRoutes.map((route) =>
              route.path && PAGES[route.path] ? { ...route, element: PAGES[route.path] } : route,
            ),
          },
        ],
        { initialEntries: ['/family'] },
      ),
    };
  });
  const value = useMemo<PrivacyState>(
    () => ({
      privacy,
      andriy: ANDRIY_LINES[andriy],
      setLevel: (accountId, level) => {
        setPrivacy((now) => {
          const others = Object.entries(now.accounts).filter(([id]) => id !== accountId);
          const accounts = Object.fromEntries(
            level === 'Everything' ? others : [...others, [accountId, level]],
          );
          return { ...now, accounts };
        });
      },
      setLines: (lines) => {
        setPrivacy((now) => ({ ...now, lines }));
      },
      setCategory: (categoryId, isPrivate) => {
        setPrivacy((now) => ({
          ...now,
          categories: isPrivate
            ? [...now.categories.filter((id) => id !== categoryId), categoryId]
            : now.categories.filter((id) => id !== categoryId),
        }));
      },
    }),
    [privacy, andriy],
  );

  return (
    <MockFetch routes={state.routes}>
      <QueryClientProvider client={client}>
        <PrivacyContext.Provider value={value}>
          <RouterProvider router={state.router} />
        </PrivacyContext.Provider>
      </QueryClientProvider>
    </MockFetch>
  );
}

const meta = {
  title: 'Prototypes/F-030 Family privacy',
  component: FamilyPrivacy,
  parameters: { layout: 'fullscreen' },
  args: { start: 'Some kept private', andriy: 'Every transaction', family: 'Couple' },
  argTypes: {
    start: { control: 'inline-radio', options: Object.keys(STARTS) },
    andriy: { control: 'inline-radio', options: Object.keys(ANDRIY_LINES) },
    family: { control: 'inline-radio', options: ['Couple', 'Three people'] },
  },
  // New settings or a new family are a new app; the sidebar and the lens start as the app's defaults
  render: (args) => <FamilyPrivacy key={`${args.start}-${args.andriy}-${args.family}`} {...args} />,
  beforeEach: () => {
    localStorage.removeItem('pup.sidebar');
    localStorage.removeItem(WHO_KEY);
  },
} satisfies Meta<typeof FamilyPrivacy>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Variant 1 "Rows", folding (owner, 2026-11-12): your transactions, your accounts and private categories as three
 * rows that unfold; the marks on your own cards and lines; Andriy's money without what he keeps.
 */
export const Final: Story = {
  name: 'Final prototype',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: 'What the family sees' }),
    ).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: /Your accounts/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  },
};
