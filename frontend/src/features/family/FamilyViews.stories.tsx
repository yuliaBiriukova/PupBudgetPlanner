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
import { familyOf, familyViewsRoutes, type FamilyChoice } from './familyViewsFakeApi';
import { FAMILY, ME } from './whose';
import { WHO_KEY } from './WhoseProvider';

const PAGES = { Transactions: '/transactions', Accounts: '/accounts', Reports: '/reports' };
const WHOSE = { Mine: ME, "Andriy's": ANDRIY_ID, "The family's": FAMILY };

interface FamilyViewsProps {
  /** Who is in Olena's family: Andriy (the default), Andriy and Iryna, or nobody (no lens anywhere). */
  family: FamilyChoice;
  /** The page it opens on; the others are in the menu. */
  start: keyof typeof PAGES;
  /** The lens's choice kept on the device when the app opens. */
  whose: keyof typeof WHOSE;
}

/** A query cache where the API has already answered its health check: no waking-up pill. */
function awakeQueryClient() {
  const queryClient = new QueryClient();
  queryClient.setQueryData(healthQuery.queryKey, true);
  return queryClient;
}

/** The app as Olena, with the lens of whose money, on a fake API that answers for whose money is asked. */
function FamilyViews({ family, start }: FamilyViewsProps) {
  const [client] = useState(awakeQueryClient);
  const [state] = useState(() => ({
    routes: familyViewsRoutes(familyOf(family)),
    router: createMemoryRouter(
      [
        {
          element: <AppLayout user={{ name: 'Olena', email: 'olena@example.com' }} />,
          children: sectionRoutes,
        },
      ],
      { initialEntries: [PAGES[start]] },
    ),
  }));

  return (
    <MockFetch routes={state.routes}>
      <QueryClientProvider client={client}>
        <RouterProvider router={state.router} />
      </QueryClientProvider>
    </MockFetch>
  );
}

const meta = {
  title: 'Family/Family views',
  component: FamilyViews,
  parameters: { layout: 'fullscreen' },
  args: { family: 'Couple', start: 'Transactions', whose: 'Mine' },
  argTypes: {
    family: { control: 'inline-radio', options: ['Couple', 'Three people', 'No family'] },
    start: { control: 'inline-radio', options: Object.keys(PAGES) },
    whose: { control: 'inline-radio', options: Object.keys(WHOSE) },
  },
  // A new family, page or choice is a new app; the sidebar starts as the app's default
  render: (args) => <FamilyViews key={`${args.family}-${args.start}-${args.whose}`} {...args} />,
  beforeEach: ({ args }) => {
    localStorage.removeItem('pup.sidebar');
    const who = WHOSE[args.whose];
    if (who === ME) localStorage.removeItem(WHO_KEY);
    else localStorage.setItem(WHO_KEY, who);
  },
} satisfies Meta<typeof FamilyViews>;

export default meta;

type Story = StoryObj<typeof meta>;

/** F-024: the lens shows your own money; it opens the list of whose money to show. */
export const Mine: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole('button', { name: /whose money/i })).toBeVisible();
    await expect(canvas.queryByText('Back to mine')).not.toBeInTheDocument();
  },
};

/** Andriy's money: his lines open nothing, the slip has no Add, the band says whose it is. */
export const AndriysMoney: Story = { name: "Andriy's money", args: { whose: "Andriy's" } };

/** The family's money on Accounts: everyone's cards, Andriy's say whose they are and open nothing. */
export const FamilysAccounts: Story = {
  name: "The family's accounts",
  args: { whose: "The family's", start: 'Accounts' },
};

/** The family's report: categories of the same group and name count as one. */
export const FamilysReport: Story = {
  name: "The family's report",
  args: { whose: "The family's", start: 'Reports' },
};

/** Three people: the list has Andriy and Iryna; the family's initials stack. */
export const ThreePeople: Story = {
  name: 'Three people',
  args: { family: 'Three people', whose: "The family's" },
};

/** No family: no lens and no band, the shell as before F-024. */
export const NoFamily: Story = { name: 'No family', args: { family: 'No family' } };
