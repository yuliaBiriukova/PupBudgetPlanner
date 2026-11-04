import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router';
import { expect, userEvent, within } from 'storybook/test';
import { MockFetch, type MockRoutes } from '../../test/mockFetch';
import { OVERVIEW } from '../accounts/accountsTestData';
import { DEFAULT_CATEGORIES } from '../categories/categoriesTestData';
import { addDays, today } from './days';
import { categoryId, SUGGESTIONS } from './transactionsTestData';
import { fakePage, fakeSummary, twoMonths } from './transactionsFakeApi';
import { TransactionFormProvider } from './TransactionFormProvider';
import { TransactionsPage } from './TransactionsPage';

interface ListProps {
  /** The page's address: its filters (`month=…&category=…`). */
  search?: string;
  data?: 'months' | 'none' | 'loading' | 'error' | 'loading-more' | 'totals-error';
}

/** The Transactions page (F-020, variant 8) over two months of the prototype's spending, with a fake API. */
function ListScreen({ search = '', data = 'months' }: ListProps) {
  const items = data === 'none' ? [] : twoMonths();
  const routes: MockRoutes = {
    '/api/transactions':
      data === 'loading'
        ? 'pending'
        : data === 'error'
          ? { status: 500 }
          : (_, query) =>
              data === 'loading-more' && query.get('offset') !== '0'
                ? 'pending'
                : { json: fakePage(items, query) },
    '/api/transactions/summary':
      data === 'loading'
        ? 'pending'
        : data === 'totals-error'
          ? { status: 500 }
          : (_, query) => ({ json: fakeSummary(items, query) }),
    '/api/accounts': {
      json:
        data === 'none'
          ? OVERVIEW
          : {
              ...OVERVIEW,
              accounts: OVERVIEW.accounts.map((account) => ({ ...account, transactionCount: 12 })),
            },
    },
    '/api/categories': { json: DEFAULT_CATEGORIES },
    '/api/transactions/suggestions': { json: SUGGESTIONS },
  };

  return (
    <MemoryRouter initialEntries={[`/transactions${search ? `?${search}` : ''}`]}>
      <MockFetch routes={routes}>
        <TransactionFormProvider>
          <main>
            <TransactionsPage />
          </main>
        </TransactionFormProvider>
      </MockFetch>
    </MemoryRouter>
  );
}

const desktop = { viewport: { value: 'desktop', isRotated: false } };
const tablet = { viewport: { value: 'tablet', isRotated: false } };
const lastMonth = addDays(today().slice(0, 7) + '-01', -1).slice(0, 7);

const meta = {
  title: 'Transactions/Transactions list',
  component: ListScreen,
  args: {},
} satisfies Meta<typeof ListScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Last month, a whole one: the totals on the slip, the calendar folded to a week, the receipts. */
export const MonthPhone: Story = {
  args: { search: `month=${lastMonth}` },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole('region', { name: 'Totals' })).toHaveTextContent('Spent');
    await expect(await canvas.findByRole('button', { name: 'Filters' })).toBeInTheDocument();
  },
};

export const MonthPhoneDark: Story = {
  args: { search: `month=${lastMonth}` },
  globals: { colorScheme: 'dark' },
};

/** The desktop: the calendar open and "Where it went" on the left, the filters over the receipts. */
export const MonthDesktop: Story = { args: { search: `month=${lastMonth}` }, globals: desktop };

export const MonthDesktopDark: Story = {
  args: { search: `month=${lastMonth}` },
  globals: { ...desktop, colorScheme: 'dark' },
};

/** The tablet: Account, Type and By category buttons; no left column. */
export const MonthTablet: Story = { args: { search: `month=${lastMonth}` }, globals: tablet };

/** This month, opened from the menu: the page's first look. */
export const ThisMonth: Story = {};

/** The calendar opened on the phone, a day picked: only its receipt. */
export const DayPicked: Story = {
  args: { search: `month=${lastMonth}&day=${lastMonth}-10` },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: /^Calendar/ }));
    await expect(await canvas.findByText(/^Only /)).toBeInTheDocument();
  },
};

/** Eating out picked in Where it went: the calendar, the totals and the receipts are its own. */
export const CategoryDesktop: Story = {
  args: { search: `month=${lastMonth}&category=${categoryId('Eating out')}` },
  globals: desktop,
};

/** The phone's Filters sheet: account and type as pills, the category bars, "Show N transactions". */
export const FiltersSheet: Story = {
  args: { search: `month=${lastMonth}` },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: 'Filters' }));
    const sheet = await within(document.body).findByRole('dialog', { name: 'Filters' });
    await userEvent.click(within(sheet).getByRole('button', { name: 'Wallet' }));
    await expect(
      await within(sheet).findByRole('button', { name: /^Show \d+ transactions?$/ }),
    ).toBeInTheDocument();
  },
};

/** Two filters on: the button's count and a chip with its own × each. */
export const FiltersOnPhone: Story = {
  args: { search: `month=${lastMonth}&account=cash&category=${categoryId('Eating out')}` },
};

/** One account: its own currency, a transfer as money out of it or into it. */
export const OneAccount: Story = {
  args: { search: `month=${lastMonth}&account=mono` },
  globals: desktop,
};

/** Income picked: "Where it came from" in green. */
export const IncomeDesktop: Story = {
  args: { search: `month=${lastMonth}&type=income` },
  globals: desktop,
};

/** This year: no calendar, the categories on the left. */
export const Year: Story = { args: { search: `year=${today().slice(0, 4)}` }, globals: desktop };

export const NothingFound: Story = {
  args: { search: `month=${lastMonth}&account=mono-usd&type=income` },
};

export const NoTransactions: Story = { args: { data: 'none' } };

export const Loading: Story = { args: { data: 'loading' } };

export const LoadingMore: Story = { args: { search: `month=${lastMonth}`, data: 'loading-more' } };

export const CouldNotLoad: Story = { args: { data: 'error' } };

export const TotalsCouldNotLoad: Story = { args: { data: 'totals-error' } };
