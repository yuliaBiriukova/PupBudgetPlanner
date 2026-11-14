import type { Meta, StoryObj } from '@storybook/react-vite';
import { notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { expect, within } from 'storybook/test';
import { sectionRoutes } from '../../app/routes';
import { healthQuery } from '../../app/shell/useServerWake';
import { OVERVIEW } from '../../features/accounts/accountsTestData';
import { DEFAULT_CATEGORIES } from '../../features/categories/categoriesTestData';
import {
  EXPENSE_NOTES,
  fakeNotes,
  fakePage,
  fakeSummary,
} from '../../features/transactions/transactionsFakeApi';
import { latestTransactions, SUGGESTIONS } from '../../features/transactions/transactionsTestData';
import { MockFetch, type MockRoutes } from '../../test/mockFetch';
import { PwaContext, type Moment, type Platform, type PwaState, type Variant } from './pwa';
import { InstallSheet, OfflineStart, UpdateNotice } from './PwaParts';
import { AppLayout } from './ProtoAppLayout';

interface PwaStoryProps {
  /** Where the app runs: Chrome or Edge (the browser's own Install), Safari on the iPhone (the steps), installed. */
  platform: Platform;
  /** What happens while the story is shown: a release came out, or the network went. */
  moment: Moment;
}

const ROUTES: MockRoutes = {
  '/api/family': { status: 204 },
  '/api/auth/me': {
    json: { id: 'yulia', displayName: 'Yulia', email: 'yulia@example.com', isAdmin: false },
  },
  '/api/transactions': (_, query) => ({ json: fakePage(latestTransactions(), query) }),
  '/api/transactions/summary': (_, query) => ({
    json: fakeSummary(latestTransactions(), query),
  }),
  '/api/accounts': { json: OVERVIEW },
  '/api/categories': { json: DEFAULT_CATEGORIES },
  '/api/transactions/suggestions': { json: SUGGESTIONS },
  '/api/transactions/notes': (_, query) => ({ json: fakeNotes(EXPENSE_NOTES, query) }),
};

function awakeQueryClient() {
  const queryClient = new QueryClient();
  queryClient.setQueryData(healthQuery.queryKey, true);
  return queryClient;
}

/** The app as Yulia on Transactions, in a browser that can install it or in the installed app. */
function PwaStory({ variant, platform, moment }: PwaStoryProps & { variant: Variant }) {
  const [client] = useState(awakeQueryClient);
  const [router] = useState(() =>
    createMemoryRouter(
      [
        {
          element: <AppLayout user={{ name: 'Yulia', email: 'yulia@example.com' }} />,
          children: sectionRoutes,
        },
      ],
      { initialEntries: ['/transactions'] },
    ),
  );
  const [sheet, setSheet] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [cardDismissed, setCardDismissed] = useState(false);

  const state = useMemo<PwaState>(
    () => ({
      variant,
      platform,
      offline: moment === 'Offline',
      installed,
      cardDismissed,
      openSheet: () => {
        setSheet(true);
      },
      dismissCard: () => {
        setCardDismissed(true);
      },
    }),
    [variant, platform, moment, installed, cardDismissed],
  );

  return (
    <MockFetch routes={ROUTES}>
      <QueryClientProvider client={client}>
        <PwaContext.Provider value={state}>
          <RouterProvider router={router} />
          <UpdateNotice moment={moment} />
          <InstallSheet
            opened={sheet}
            platform={platform}
            onClose={() => {
              setSheet(false);
            }}
            onInstall={() => {
              setSheet(false);
              setInstalled(true);
              // Here the browser asks "Install Pup Budget?" in its own dialog
              notifications.show({ message: 'Pup Budget is on your home screen.' });
            }}
          />
        </PwaContext.Provider>
      </QueryClientProvider>
    </MockFetch>
  );
}

const meta = {
  title: 'Prototypes/F-025 Installable app',
  component: PwaStory,
  parameters: { layout: 'fullscreen' },
  args: { variant: 'both', platform: 'Chrome or Edge', moment: 'Nothing new' },
  argTypes: {
    variant: { table: { disable: true } },
    platform: {
      control: 'inline-radio',
      options: ['Chrome or Edge', 'iPhone Safari', 'Installed app'],
    },
    moment: { control: 'inline-radio', options: ['Nothing new', 'Update ready', 'Offline'] },
  },
  beforeEach: () => {
    localStorage.removeItem('pup.sidebar');
  },
} satisfies Meta<typeof PwaStory>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Variant 3, chosen by the owner (2026-11-14): on the phone the card once at the top of the page, then the row in
 * More after Not now; on the desktop the sidebar's row in Chrome or Edge.
 */
export const Final: Story = {
  name: 'Final prototype',
};

/** Opened from the home screen without a network (a page the app can't reach by itself). */
export const OfflineAtStart: Story = {
  name: 'Final: offline at start',
  render: () => <OfflineStart />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('alert')).toHaveTextContent('You’re offline.');
  },
};
