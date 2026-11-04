import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import dayjs from 'dayjs';
import { http, HttpResponse } from 'msw/http';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderApp } from '../../test/render';
import { setScreenWidth } from '../../test/screen';
import { server } from '../../test/server';
import { OVERVIEW } from '../accounts/accountsTestData';
import { today } from '../transactions/days';
import {
  emptyYearReport,
  fakeMonthReport,
  fakeYearReport,
  reportCategoryId,
} from './reportsTestData';

/** The first render of the app can take over a second on a busy machine: waits for the page to load get longer. */
const LOADED = { timeout: 4000 };

const thisYear = dayjs(today()).year();
const thisMonth = today().slice(0, 7);

/** What the page asked the API for, in order. */
let asked: string[] = [];

function useReports(year = fakeYearReport) {
  asked = [];
  server.use(
    http.get('/api/reports/year', ({ request }) => {
      const query = new URL(request.url).searchParams;
      asked.push(`year ${query.toString()}`);
      return HttpResponse.json(
        year(Number(query.get('year')), today(), query.get('currency') === 'USD' ? 42 : 1),
      );
    }),
    http.get('/api/reports/month', ({ request }) => {
      const query = new URL(request.url).searchParams;
      asked.push(`month ${query.toString()}`);
      return HttpResponse.json(fakeMonthReport(query.get('month') ?? '', today()));
    }),
    http.get('/api/accounts', () => HttpResponse.json(OVERVIEW)),
    http.get('/api/settings', () =>
      HttpResponse.json({
        displayName: 'Olena',
        email: 'olena@example.com',
        reportCurrency: 'UAH',
      }),
    ),
  );
}

describe('Reports on the phone', () => {
  beforeEach(() => {
    useReports();
  });

  it('shows the year as months that open their month', async () => {
    const user = userEvent.setup();
    renderApp('/reports');

    const months = await screen.findByRole('list', { name: 'Months' }, LOADED);
    expect(screen.getByRole('heading', { name: 'Where the year went' })).toBeInTheDocument();
    // Categories with nothing in the year aren't shown
    expect(screen.queryByText('Sport')).not.toBeInTheDocument();

    const now = within(months).getByText('now').closest('button');
    if (!now) throw new Error('No row for this month');
    await user.click(now);

    expect(await screen.findByText(dayjs(today()).format('MMMM YYYY'))).toBeInTheDocument();
    expect(await screen.findByRole('region', { name: 'The month' })).toBeInTheDocument();
    expect(asked).toContain(`month month=${thisMonth}`);
  });

  it('opens a category’s transactions from the month', async () => {
    const lastMonth = dayjs(today()).subtract(1, 'month').format('YYYY-MM');
    renderApp(`/reports?month=${lastMonth}`);

    const home = await screen.findByRole('region', { name: 'Home expenses' }, LOADED);
    const rent = within(home).getByRole('link', { name: /^Rent/ });
    expect(rent).toHaveAttribute(
      'href',
      `/transactions?month=${lastMonth}&category=${reportCategoryId(1, 0)}`,
    );
  });

  it('steps back over the years with data only', async () => {
    const user = userEvent.setup();
    renderApp('/reports');

    await screen.findByRole('list', { name: 'Months' }, LOADED);
    expect(screen.getByRole('button', { name: 'Next year' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Previous year' }));

    expect(await screen.findByText(String(thisYear - 1))).toBeInTheDocument();
    // The test data starts in January of last year
    expect(await screen.findByRole('button', { name: 'Previous year' })).toBeDisabled();
    expect(asked).toContain(`year year=${String(thisYear - 1)}`);
  });

  it('shows the report in another currency for this visit', async () => {
    const user = userEvent.setup();
    renderApp('/reports');

    await user.click(await screen.findByRole('button', { name: /^Report currency: UAH/ }, LOADED));
    const sheet = await screen.findByRole('dialog', { name: 'Report currency' });
    await user.click(await within(sheet).findByRole('button', { name: /^USD/ }));

    expect(
      await screen.findByRole('button', { name: /^Report currency: USD/ }, LOADED),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(asked).toContain(`year year=${String(thisYear)}&currency=USD`);
    });
  });

  it('says there is nothing yet to a person who added nothing', async () => {
    useReports(emptyYearReport);
    renderApp('/reports');

    expect(
      await screen.findByRole('heading', { name: 'Nothing to report yet' }, LOADED),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous year' })).toBeDisabled();
  });

  it('offers to try again when the report doesn’t load', async () => {
    server.use(http.get('/api/reports/year', () => new HttpResponse(null, { status: 500 })));
    renderApp('/reports');

    expect(await screen.findByRole('alert', {}, LOADED)).toHaveTextContent(
      'Couldn’t load the report.',
    );
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});

describe('Reports on the desktop', () => {
  beforeEach(() => {
    setScreenWidth(1280);
    useReports();
  });

  it('shows the year as a table whose groups unfold, a category’s amount opening its transactions', async () => {
    const user = userEvent.setup();
    renderApp('/reports');

    const table = await screen.findByRole('table', {}, LOADED);
    expect(
      within(table).getByRole('columnheader', { name: /^Avg ?÷ \d+ months?$/ }),
    ).toBeInTheDocument();
    expect(within(table).queryByRole('rowheader', { name: 'Groceries' })).not.toBeInTheDocument();

    await user.click(within(table).getByRole('button', { name: 'Daily living' }));

    const groceries = within(table).getByRole('rowheader', { name: 'Groceries' }).closest('tr');
    if (!groceries) throw new Error('No Groceries row');
    const links = within(groceries).getAllByRole('link');
    expect(links.at(-1)).toHaveAttribute(
      'href',
      `/transactions?year=${String(thisYear)}&category=${reportCategoryId(2, 0)}`,
    );
  });

  it('opens a month from its heading', async () => {
    const user = userEvent.setup();
    renderApp('/reports');

    const table = await screen.findByRole('table', {}, LOADED);
    await user.click(within(table).getByRole('button', { name: /^Jan, open the month/ }));

    expect(await screen.findByText(`January ${String(thisYear)}`)).toBeInTheDocument();
    expect(asked).toContain(`month month=${String(thisYear)}-01`);
  });
});
