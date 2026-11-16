import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw/http';
import { describe, expect, it } from 'vitest';
import { LOADED, renderApp } from '../../test/render';
import { server } from '../../test/server';
import { shiftMonth, thisMonth } from './budget';
import { notPlannedMonth, plannedMonth } from './budgetTestData';

const month = thisMonth();
const last = shiftMonth(month, -1);

/** The API answers `month` with `answer`, and keeps what the page sends. */
function useBudget(answer: (month: string) => ReturnType<typeof plannedMonth>) {
  const sent: { url: string; body: unknown }[] = [];
  server.use(
    http.get('/api/budget', ({ request }) =>
      HttpResponse.json(answer(new URL(request.url).searchParams.get('month') ?? '')),
    ),
    http.put('/api/budget/*', async ({ request }) => {
      sent.push({ url: new URL(request.url).pathname, body: await request.json() });
      return new HttpResponse(null, { status: 204 });
    }),
    http.post('/api/budget/start', async ({ request }) => {
      sent.push({ url: '/api/budget/start', body: await request.json() });
      return new HttpResponse(null, { status: 204 });
    }),
  );
  return sent;
}

describe('the Budget page', () => {
  it('shows what’s left of the month, each group and category, and folds the quiet groups', async () => {
    useBudget(plannedMonth);
    renderApp('/budget');

    expect(await screen.findByTestId('month-left', {}, LOADED)).toHaveTextContent('18 518 ₴');
    expect(screen.getByText('Spent 31 482 ₴.', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('2 500 ₴ of the total isn’t in any group.')).toBeInTheDocument();
    const daily = screen.getByRole('region', { name: 'Daily living' });
    expect(within(daily).getByRole('button', { name: /^Eating out/ })).toHaveTextContent(
      '607 ₴ over',
    );
    expect(within(daily).getByRole('button', { name: /^Clothing/ })).toHaveTextContent(
      '1 890 ₴ spent',
    );
    expect(within(daily).getByRole('button', { name: /^Clothing/ })).toHaveTextContent('No budget');
    expect(
      within(screen.getByRole('region', { name: 'Subscriptions' })).getByText(
        'its categories’ budgets',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Health: nothing planned or spent' }),
    ).toHaveAttribute('aria-expanded', 'false');
  });

  it('blocks a budget that doesn’t fit its group and saves one that does', async () => {
    const sent = useBudget(plannedMonth);
    const user = userEvent.setup();
    renderApp('/budget');

    await user.click(await screen.findByRole('button', { name: /^Eating out/ }, LOADED));
    const dialog = await screen.findByRole('dialog', { name: 'Eating out' });
    expect(within(dialog).getByText(/so up to/)).toHaveTextContent(
      'Daily living: 22 000 ₴. Its other categories take 14 500 ₴, so up to 7 500 ₴ fits here.',
    );
    const field = within(dialog).getByRole('textbox');
    await user.clear(field);
    await user.type(field, '9000');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(within(dialog).getByRole('alert')).toHaveTextContent(
      'Its categories add up to 23 500 ₴, 1 500 ₴ more than Daily living’s 22 000 ₴.',
    );
    expect(sent).toEqual([]);

    await user.clear(field);
    await user.type(field, '3000');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Eating out' })).toBeNull();
    });
    expect(sent).toEqual([
      { url: '/api/budget/categories/c-eating', body: { month, amount: 3_000 } },
    ]);
  });

  it('starts a month not planned from the last one', async () => {
    const sent = useBudget((asked) => notPlannedMonth(asked, last));
    const user = userEvent.setup();
    renderApp('/budget');

    const start = await screen.findByRole('button', { name: /^Start from/ }, LOADED);
    expect(screen.getByRole('button', { name: 'Start empty' })).toBeInTheDocument();
    await user.click(start);
    expect(await screen.findByText(/starts from .*’s plan/)).toBeInTheDocument();
    expect(sent).toEqual([{ url: '/api/budget/start', body: { month, copyLast: true } }]);
  });

  it('says when the budget couldn’t be loaded', async () => {
    server.use(http.get('/api/budget', () => new HttpResponse(null, { status: 500 })));
    renderApp('/budget');

    expect(await screen.findByText('Couldn’t load the budget.', {}, LOADED)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});

describe('the reminder banner', () => {
  it('shows over other pages while this month isn’t planned, until it is closed', async () => {
    useBudget((asked) => notPlannedMonth(asked, last));
    const user = userEvent.setup();
    renderApp('/no-such-page');

    const banner = await screen.findByText(/has no budget yet\./, {}, LOADED);
    expect(banner.closest('[role="status"]')).toHaveTextContent(/Start from .*’s plan/);
    await user.click(screen.getByRole('button', { name: 'Close' }));
    // Its page is still there; the banner stays closed this month
    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.queryByText(/has no budget yet\./)).toBeNull();
  });

  it('doesn’t show for someone who has never planned a month', async () => {
    useBudget((asked) => notPlannedMonth(asked, null));
    const { queryClient } = renderApp('/no-such-page');

    expect(await screen.findByRole('heading', { level: 1 }, LOADED)).toBeInTheDocument();
    // The month's budget has come: nothing more is on its way
    await waitFor(() => {
      expect(queryClient.getQueryState(['budget', month])?.status).toBe('success');
    });
    expect(screen.queryByText(/has no budget yet\./)).toBeNull();
  });
});
