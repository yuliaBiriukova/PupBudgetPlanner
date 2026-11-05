import type { Meta, StoryObj } from '@storybook/react-vite';
import dayjs from 'dayjs';
import { MemoryRouter } from 'react-router';
import { expect, userEvent, within } from 'storybook/test';
import { MockFetch, type MockRoutes } from '../../test/mockFetch';
import { OVERVIEW } from '../accounts/accountsTestData';
import { today } from '../transactions/days';
import { ReportsPage } from './ReportsPage';
import { emptyYearReport, fakeMonthReport, fakeYearReport } from './reportsTestData';

interface ReportsProps {
  /** The page's address: its period and currency (`month=2026-10`, `currency=USD`). */
  search?: string;
  /** `started`: a person whose first entry is this month, so the months before it are folded. */
  data?: 'year' | 'started' | 'none' | 'loading' | 'error';
}

/** The Reports page (F-022) over a test year in the spreadsheet's shape, with a fake API. */
function ReportsScreen({ search = '', data = 'year' }: ReportsProps) {
  const rate = (query: URLSearchParams) => (query.get('currency') === 'USD' ? 42 : 1);
  const answer = (make: (query: URLSearchParams) => unknown) =>
    data === 'loading'
      ? ('pending' as const)
      : data === 'error'
        ? { status: 500 }
        : (_: unknown, query: URLSearchParams) => ({ json: make(query) });
  const routes: MockRoutes = {
    '/api/reports/year': answer((query) =>
      data === 'none'
        ? emptyYearReport(Number(query.get('year')))
        : fakeYearReport(
            Number(query.get('year')),
            today(),
            rate(query),
            data === 'started' ? `${today().slice(0, 7)}-01` : undefined,
          ),
    ),
    '/api/reports/month': answer((query) =>
      fakeMonthReport(query.get('month') ?? '', today(), rate(query)),
    ),
    '/api/accounts': { json: OVERVIEW },
    '/api/settings': {
      json: { displayName: 'Olena', email: 'olena@example.com', reportCurrency: 'UAH' },
    },
  };

  return (
    <MemoryRouter initialEntries={[`/reports${search ? `?${search}` : ''}`]}>
      <MockFetch routes={routes}>
        <main>
          <ReportsPage />
        </main>
      </MockFetch>
    </MemoryRouter>
  );
}

const desktop = { viewport: { value: 'desktop', isRotated: false } };
const tablet = { viewport: { value: 'tablet', isRotated: false } };
const lastMonth = dayjs(today()).subtract(1, 'month').format('YYYY-MM');

const meta = {
  title: 'Reports/Reports page',
  component: ReportsScreen,
  args: {},
} satisfies Meta<typeof ReportsScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The phone: a short head, the year so far on the slip, the months as rows, where the year went. */
export const YearPhone: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: 'Where the year went' }),
    ).toBeInTheDocument();
    await expect(canvas.getByRole('list', { name: 'Months' })).toBeInTheDocument();
  },
};

export const YearPhoneDark: Story = { globals: { colorScheme: 'dark' } };

/** The desktop: the year's table, groups folded to their totals, the bars over the months, this month in sight. */
export const YearDesktop: Story = {
  globals: desktop,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const fold = await canvas.findByRole('button', { name: 'Daily living' });
    await userEvent.click(fold);
    await expect(fold).toHaveAttribute('aria-expanded', 'true');
    await expect(canvas.getByRole('rowheader', { name: 'Groceries' })).toBeInTheDocument();
  },
};

export const YearDesktopDark: Story = { globals: { ...desktop, colorScheme: 'dark' } };

/** The tablet: the same table, scrolling sideways with its bar on, the period beside the title. */
export const YearTablet: Story = { globals: tablet };

/** A person who started this month: the months before it are one folded column, a tap unfolds them. */
export const YearStartedDesktop: Story = {
  args: { data: 'started' },
  globals: desktop,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const folded = await canvas.findByRole('button', { name: /before your first entry/ });
    await userEvent.click(folded);
    await expect(
      canvas.getByRole('button', { name: /^Jan\s*, open the month/ }),
    ).toBeInTheDocument();
    // And back: the story ends folded
    await userEvent.click(canvas.getByRole('button', { name: /^Fold / }));
    await expect(
      canvas.queryByRole('button', { name: /^Jan\s*, open the month/ }),
    ).not.toBeInTheDocument();
  },
};

/** The same on the phone: the months before the first entry are one row. */
export const YearStartedPhone: Story = { args: { data: 'started' } };

/** In another currency for this visit: the pill says USD. */
export const YearInDollars: Story = { args: { search: 'currency=USD' }, globals: desktop };

/** Last month on the phone: the month's balance first, then a receipt a group. */
export const MonthPhone: Story = { args: { search: `month=${lastMonth}` } };

export const MonthPhoneDark: Story = {
  args: { search: `month=${lastMonth}` },
  globals: { colorScheme: 'dark' },
};

/** The desktop: the group receipts with the month's balance beside them. */
export const MonthDesktop: Story = {
  args: { search: `month=${lastMonth}` },
  globals: desktop,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole('region', { name: 'The month' })).toBeInTheDocument();
    await expect(canvas.getByRole('region', { name: 'Home expenses' })).toBeInTheDocument();
  },
};

export const MonthDesktopDark: Story = {
  args: { search: `month=${lastMonth}` },
  globals: { ...desktop, colorScheme: 'dark' },
};

/** A person with nothing added yet. */
export const Empty: Story = { args: { data: 'none' } };

export const Loading: Story = { args: { data: 'loading' } };

export const LoadingDesktop: Story = { args: { data: 'loading' }, globals: desktop };

export const LoadError: Story = {
  args: { data: 'error' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole('alert')).toHaveTextContent('Couldn’t load the report.');
  },
};
