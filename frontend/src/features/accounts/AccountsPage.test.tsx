import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw/http';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { renderApp } from '../../test/render';
import { setScreenWidth } from '../../test/screen';
import { server } from '../../test/server';
import type { AccountsOverview } from './accountsApi';
import { account, EMPTY, OVERVIEW } from './accountsTestData';

/** The API with these accounts; returns what the page sent. */
function accountsServer(first: AccountsOverview = OVERVIEW, after: AccountsOverview = first) {
  const sent: { url: string; body: unknown }[] = [];
  let overview = first;
  server.use(
    http.get('/api/accounts', () => HttpResponse.json(overview)),
    http.post('/api/accounts', async ({ request }) => {
      const body = await request.json();
      sent.push({ url: '/api/accounts', body });
      overview = after;
      return HttpResponse.json(after.accounts.at(-1));
    }),
    http.post('/api/accounts/:id/:action', ({ request }) => {
      sent.push({ url: new URL(request.url).pathname, body: null });
      overview = after;
      return new HttpResponse(null, { status: 204 });
    }),
  );
  return sent;
}

beforeEach(() => {
  setScreenWidth(1440);
  document.cookie = 'XSRF-TOKEN=token-from-the-api; path=/';
});

afterEach(() => {
  document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
});

describe('the Accounts page', () => {
  it('shows the totals per currency and the accounts grouped by currency', async () => {
    accountsServer();
    renderApp('/accounts');

    const totals = await screen.findByRole('group', { name: 'Totals' });
    expect(totals).toHaveTextContent('310 132.20 ₴');
    expect(totals).toHaveTextContent('$1 740.00');
    const dollars = screen.getByRole('region', { name: 'US dollar' });
    expect(within(dollars).getByText('USD, 2 accounts')).toBeInTheDocument();
    expect(within(dollars).getByRole('button', { name: /Dollars at home/ })).toHaveTextContent(
      'Cash',
    );
    expect(within(dollars).getByRole('button', { name: 'Add USD account' })).toBeInTheDocument();
    expect(screen.getByText('−4 312.40 ₴')).toBeInTheDocument();
  });

  it('groups by source when asked, and remembers it', async () => {
    accountsServer();
    renderApp('/accounts');

    await userEvent.click(await screen.findByRole('radio', { name: 'Source' }));

    expect(screen.getByRole('region', { name: 'Monobank' })).toHaveTextContent('Bank, 3 accounts');
    expect(screen.getByRole('region', { name: 'Deposit' })).toBeInTheDocument();
    expect(localStorage.getItem('pup.accounts.groupBy')).toBe('source');
  });

  it('adds the first account, typing a bank that is then kept', async () => {
    const wallet = account('new', 'Mono black', {
      source: 'Bank',
      bankName: 'Monobank',
      cardStyle: 'Solid',
      balance: 21500.5,
      openingBalance: 21500.5,
    });
    const sent = accountsServer(EMPTY, {
      ...EMPTY,
      accounts: [wallet],
      totals: [{ currency: 'UAH', accounts: 1, total: 21500.5 }],
      banks: [{ id: 'b-mono', name: 'Monobank' }],
    });
    renderApp('/accounts');

    await userEvent.click(await screen.findByRole('button', { name: 'Add your first account' }));
    const form = await screen.findByRole('dialog', { name: 'New account' });
    await userEvent.type(within(form).getByLabelText('Name'), 'Mono black');
    await userEvent.click(within(form).getByRole('button', { name: 'Monobank' }));
    const opening = within(form).getByLabelText('Opening balance');
    await userEvent.clear(opening);
    await userEvent.type(opening, '21 500,50');
    await userEvent.click(within(form).getByRole('button', { name: 'Add account' }));

    expect(await screen.findByText('Mono black added')).toBeInTheDocument();
    expect(sent).toEqual([
      {
        url: '/api/accounts',
        body: expect.objectContaining({
          name: 'Mono black',
          currency: 'UAH',
          source: 'Bank',
          bankName: 'Monobank',
          openingBalance: 21500.5,
          cardStyle: 'Solid',
        }) as unknown,
      },
    ]);
    expect(await screen.findByRole('region', { name: 'Hryvnia' })).toBeInTheDocument();
  });

  it('says what is missing under the fields and sends nothing', async () => {
    const sent = accountsServer();
    renderApp('/accounts');

    await screen.findByRole('group', { name: 'Totals' });
    await userEvent.click(screen.getByRole('button', { name: 'Add account' }));
    const form = await screen.findByRole('dialog', { name: 'New account' });
    await userEvent.clear(within(form).getByLabelText('Opening balance'));
    await userEvent.type(within(form).getByLabelText('Opening balance'), '12.345');
    await userEvent.click(within(form).getByRole('button', { name: 'Add account' }));

    expect(within(form).getByText('Give the account a name.')).toBeInTheDocument();
    expect(within(form).getByText('Enter an amount like 1240.50 or −300.')).toBeInTheDocument();
    await waitFor(() => {
      expect(within(form).getByLabelText('Name')).toHaveFocus();
    });
    expect(sent).toEqual([]);
  });

  it('opens the form from a group with its currency picked', async () => {
    accountsServer();
    renderApp('/accounts');

    await userEvent.click(await screen.findByRole('button', { name: 'Add EUR account' }));
    const form = await screen.findByRole('dialog', { name: 'New account' });

    expect(within(form).getByRole('button', { name: 'Currency' })).toHaveTextContent('EUREuro');
  });

  it('finds a currency by its name, and Escape closes only the list', async () => {
    accountsServer();
    renderApp('/accounts');

    await screen.findByRole('group', { name: 'Totals' });
    await userEvent.click(screen.getByRole('button', { name: 'Add account' }));
    const form = await screen.findByRole('dialog', { name: 'New account' });
    await userEvent.click(within(form).getByRole('button', { name: 'Currency' }));
    await userEvent.type(within(form).getByLabelText('Search currencies'), 'pou');

    expect(within(form).getByRole('button', { name: /GBP\s*Pound sterling/ })).toBeInTheDocument();
    expect(within(form).queryByRole('button', { name: /USD/ })).not.toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(within(form).queryByLabelText('Search currencies')).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'New account' })).toBeInTheDocument();
  });

  it('archives after a warning about the money still on it, and restores', async () => {
    const sent = accountsServer();
    renderApp('/accounts');

    await userEvent.click(await screen.findByRole('button', { name: /Mono dollars/ }));
    const form = await screen.findByRole('dialog', { name: 'Edit Mono dollars' });
    await userEvent.click(within(form).getByRole('button', { name: 'Archive' }));
    const ask = await screen.findByRole('dialog', { name: 'Archive Mono dollars?' });
    expect(ask).toHaveTextContent('It still has $1 240.00.');
    await userEvent.click(within(ask).getByRole('button', { name: 'Archive' }));
    expect(await screen.findByText('Mono dollars archived')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Archived/ }));
    expect(screen.getByText('Old Privat dollars').closest('li')).toHaveTextContent(
      /PrivatBank, archived 20 Sept? 2026, \$12\.40 left/,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Restore Old Privat dollars' }));
    expect(await screen.findByText('Old Privat dollars is back')).toBeInTheDocument();

    expect(sent.map((s) => s.url)).toEqual([
      '/api/accounts/mono-usd/archive',
      '/api/accounts/old-usd/restore',
    ]);
  });

  it('offers to try again when the accounts can’t be loaded', async () => {
    server.use(http.get('/api/accounts', () => new HttpResponse(null, { status: 500 })));
    renderApp('/accounts');

    expect(await screen.findByRole('alert')).toHaveTextContent('Couldn’t load your accounts.');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
