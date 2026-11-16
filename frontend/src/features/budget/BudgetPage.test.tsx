import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw/http';
import { describe, expect, it } from 'vitest';
import { LOADED, renderApp } from '../../test/render';
import { setScreenWidth } from '../../test/screen';
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
    http.delete('/api/budget', ({ request }) => {
      const url = new URL(request.url);
      sent.push({ url: `DELETE ${url.pathname}${url.search}`, body: null });
      return new HttpResponse(null, { status: 204 });
    }),
  );
  return sent;
}

describe('the Budget page', () => {
  it('shows what’s left of the month, each group and category, every group open', async () => {
    useBudget(plannedMonth);
    renderApp('/budget');

    expect(await screen.findByTestId('month-left', {}, LOADED)).toHaveTextContent('18 518 ₴');
    // On the slip, as Transactions' (owner's review of PR #115): the month, what's left and spent, the days to go
    const slip = screen.getByRole('region', { name: 'The month' });
    expect(within(slip).getByRole('heading', { level: 1 })).toHaveTextContent(month.slice(0, 4));
    expect(slip).toHaveTextContent('Spent31 482 ₴');
    expect(slip).toHaveTextContent('2 500 ₴ of the total isn’t in any group.');
    expect(within(slip).getByRole('button', { name: 'Change total' })).toBeInTheDocument();
    const daily = screen.getByRole('region', { name: 'Daily living' });
    expect(within(daily).getByRole('button', { name: /^Eating out/ })).toHaveTextContent(
      '607 ₴ over',
    );
    // The group's head is a line like a category's (owner's review of PR #115)
    expect(within(daily).getByRole('button', { name: /^Daily living/ })).toHaveTextContent(
      '12 286 ₴ of 22 000 ₴',
    );
    // Only the categories with a budget are listed; Clothing (spent, no budget) comes in with +
    expect(
      within(daily)
        .getAllByTestId('budget-row')
        .map((row) => row.textContent),
    ).toEqual([
      expect.stringContaining('Food'),
      expect.stringContaining('Eating out'),
      expect.stringContaining('Transportation'),
    ]);
    expect(
      within(daily).getByRole('button', { name: 'Budget for another Daily living category' }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: 'Subscriptions' })).getByText(
        'its categories’ budgets',
      ),
    ).toBeInTheDocument();
    // No accordions: a group with nothing planned or spent is open too, after the others
    const health = screen.getByRole('region', { name: 'Health' });
    expect(within(health).getByRole('button', { name: /^Health/ })).toHaveTextContent('No budget');
    expect(
      within(health).getByRole('button', { name: 'Budget for a category in Health' }),
    ).toBeInTheDocument();
  });

  it('shows under the month on the desktop where the total goes and the spending outside the plan', async () => {
    setScreenWidth(1280);
    useBudget(plannedMonth);
    const user = userEvent.setup();
    renderApp('/budget');

    const split = await screen.findByRole('region', { name: /^Where the 50.000.₴ goes$/ }, LOADED);
    const legend = within(split).getAllByRole('button');
    expect(legend).toHaveLength(4);
    for (const [row, text] of [
      [legend[0], 'Home expenses23 000 ₴46 %'],
      [legend[1], 'Daily living22 000 ₴44 %'],
      [legend[2], 'Entertainment2 000 ₴4 %'],
      [legend[3], 'Subscriptions500 ₴1 %'],
    ] as const)
      expect(row).toHaveTextContent(text);
    expect(split).toHaveTextContent('Not in any group2 500 ₴5 %');

    const outside = screen.getByRole('region', { name: 'Spent outside the plan' });
    expect(outside).toHaveTextContent('2 586 ₴ in categories without a budget');
    const rows = within(outside).getAllByRole('button');
    expect(rows).toHaveLength(2);
    // As Transactions' "Where it went": the amount and its share of the month's 31 482 spent
    expect(rows[0]).toHaveTextContent('Clothing1 890 ₴6%');
    expect(rows[1]).toHaveTextContent('Activities696 ₴2%');
    // A row opens New budget with its category picked
    await user.click(rows[0] ?? outside);
    const dialog = await screen.findByRole('dialog', { name: 'New budget in Daily living' });
    expect(within(dialog).getByRole('radio', { name: 'Clothing' })).toBeChecked();
  });

  it('deletes the month’s plan after asking', async () => {
    const sent = useBudget(plannedMonth);
    const user = userEvent.setup();
    renderApp('/budget');

    await screen.findByTestId('month-left', {}, LOADED);
    // The desktop's button under the month and the phone's after the groups: one shows, by the CSS
    const [deleteButton] = screen.getAllByRole('button', { name: /^Delete .*’s plan$/ });
    if (!deleteButton) throw new Error('no Delete plan button');
    await user.click(deleteButton);
    const dialog = await screen.findByRole('dialog', { name: /^Delete .*’s plan\?$/ });
    expect(dialog).toHaveTextContent('Transactions stay');
    await user.click(within(dialog).getByRole('button', { name: 'Delete plan' }));
    expect(await screen.findByText(/’s plan is deleted\.$/)).toBeInTheDocument();
    expect(sent).toEqual([{ url: `DELETE /api/budget?month=${month}`, body: null }]);
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
