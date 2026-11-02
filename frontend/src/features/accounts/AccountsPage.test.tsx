import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw/http';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { renderApp } from '../../test/render';
import { setScreenWidth } from '../../test/screen';
import { server } from '../../test/server';
import type { AccountsOverview, AccountsTotal, RatesStatus } from './accountsApi';
import { account, EMPTY, OVERVIEW } from './accountsTestData';

/** The first render of the app can take over a second on a busy machine: waits for the page to load get longer. */
const LOADED = { timeout: 4000 };

/** The prototype's NBU rates (F-017). */
const RATES: Record<string, number> = { USD: 41.35, EUR: 48.1, PLN: 11.3 };

/** "In total, in UAH" as the API answers it for these accounts; earlier rates are of Friday. */
function totalFor(overview: AccountsOverview, status: RatesStatus = 'Current'): AccountsTotal {
  const others = overview.totals.filter((total) => total.currency !== 'UAH');
  if (status === 'Missing')
    return { currency: 'UAH', total: null, ratesDate: null, status, rates: [] };
  return {
    currency: 'UAH',
    total: overview.totals.reduce(
      (sum, total) => sum + total.total * (RATES[total.currency] ?? 1),
      0,
    ),
    ratesDate: others.length === 0 ? null : status === 'Current' ? '2026-11-02' : '2026-10-30',
    status,
    rates: others.map((total) => ({ currency: total.currency, rate: RATES[total.currency] ?? 0 })),
  };
}

/** The API with these accounts and NBU rates; returns what the page sent. */
function accountsServer(
  first: AccountsOverview = OVERVIEW,
  after: AccountsOverview = first,
  rates: RatesStatus = 'Current',
) {
  const sent: { url: string; body: unknown }[] = [];
  let overview = first;
  server.use(
    http.get('/api/accounts', () => HttpResponse.json(overview)),
    http.get('/api/accounts/total', () => HttpResponse.json(totalFor(overview, rates))),
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
    http.delete('/api/accounts/:id', ({ request }) => {
      sent.push({ url: `DELETE ${new URL(request.url).pathname}`, body: null });
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

    const totals = await screen.findByRole('group', { name: 'Totals' }, LOADED);
    expect(totals).toHaveTextContent('310 133 ₴');
    expect(totals).toHaveTextContent('$1 740');
    const dollars = screen.getByRole('region', { name: 'US dollar' });
    expect(within(dollars).getByText('USD, 2 accounts')).toBeInTheDocument();
    expect(within(dollars).getByRole('button', { name: /^Dollars at home/ })).toHaveTextContent(
      'Cash',
    );
    expect(within(dollars).getByRole('button', { name: 'Add USD account' })).toBeInTheDocument();
    expect(screen.getByText('−4 312 ₴')).toBeInTheDocument();
  });

  it('groups by source when asked, and remembers it', async () => {
    accountsServer();
    renderApp('/accounts');

    await userEvent.click(await screen.findByRole('radio', { name: 'Source' }, LOADED));

    expect(screen.getByRole('region', { name: 'Monobank' })).toHaveTextContent('Bank, 3 accounts');
    expect(screen.getByRole('region', { name: 'Deposit' })).toBeInTheDocument();
    expect(localStorage.getItem('pup.accounts.groupBy')).toBe('source');
  });

  it('adds the first account, typing a bank that is then kept', async () => {
    const wallet = account('new', 'Mono black', {
      source: 'Bank',
      bankName: 'Monobank',
      cardStyle: 'Solid',
      balance: 21501,
      openingBalance: 21501,
    });
    const sent = accountsServer(EMPTY, {
      ...EMPTY,
      accounts: [wallet],
      totals: [{ currency: 'UAH', accounts: 1, total: 21501 }],
      banks: [{ id: 'b-mono', name: 'Monobank' }],
    });
    renderApp('/accounts');

    await userEvent.click(
      await screen.findByRole('button', { name: 'Add your first account' }, LOADED),
    );
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
          openingBalance: 21501,
          cardStyle: 'Solid',
        }) as unknown,
      },
    ]);
    expect(await screen.findByRole('region', { name: 'Hryvnia' })).toBeInTheDocument();
    // The longest test here (about 2 s on its own): a busy machine needs more than the default 5 s
  }, 10_000);

  it('says what is missing under the fields and sends nothing', async () => {
    const sent = accountsServer();
    renderApp('/accounts');

    await screen.findByRole('group', { name: 'Totals' }, LOADED);
    await userEvent.click(screen.getByRole('button', { name: 'Add account' }));
    const form = await screen.findByRole('dialog', { name: 'New account' });
    await userEvent.clear(within(form).getByLabelText('Opening balance'));
    await userEvent.type(within(form).getByLabelText('Opening balance'), '1,240.5.0');
    await userEvent.click(within(form).getByRole('button', { name: 'Add account' }));

    expect(within(form).getByText('Give the account a name.')).toBeInTheDocument();
    expect(within(form).getByText('Enter an amount like 1240 or −300.')).toBeInTheDocument();
    await waitFor(() => {
      expect(within(form).getByLabelText('Name')).toHaveFocus();
    });
    expect(sent).toEqual([]);
  });

  it('clears a zero opening balance when the field is focused', async () => {
    accountsServer();
    renderApp('/accounts');

    await screen.findByRole('group', { name: 'Totals' }, LOADED);
    await userEvent.click(screen.getByRole('button', { name: 'Add account' }));
    const form = await screen.findByRole('dialog', { name: 'New account' });
    const opening = within(form).getByLabelText('Opening balance');
    expect(opening).toHaveValue('0');

    await userEvent.click(opening);
    expect(opening).toHaveValue('');
    await userEvent.type(opening, '450');
    expect(opening).toHaveValue('450');

    // Left empty, it shows 0 again
    await userEvent.clear(opening);
    await userEvent.click(within(form).getByLabelText('Name'));
    expect(opening).toHaveValue('0');
  });

  it('opens the form from a group with its currency picked', async () => {
    accountsServer();
    renderApp('/accounts');

    await userEvent.click(await screen.findByRole('button', { name: 'Add EUR account' }, LOADED));
    const form = await screen.findByRole('dialog', { name: 'New account' });

    expect(within(form).getByRole('button', { name: 'Currency' })).toHaveTextContent('EUREuro');
  });

  it('finds a currency by its name, and Escape closes only the list', async () => {
    accountsServer();
    renderApp('/accounts');

    await screen.findByRole('group', { name: 'Totals' }, LOADED);
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

    await userEvent.click(await screen.findByRole('button', { name: /^Mono dollars/ }, LOADED));
    const form = await screen.findByRole('dialog', { name: 'Edit Mono dollars' });
    await userEvent.click(within(form).getByRole('button', { name: 'Archive' }));
    const ask = await screen.findByRole('dialog', { name: 'Archive Mono dollars?' });
    expect(ask).toHaveTextContent('It still has $1 240.');
    await userEvent.click(within(ask).getByRole('button', { name: 'Archive' }));
    expect(await screen.findByText('Mono dollars archived')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Archived/ }));
    expect(screen.getByText('Old Privat dollars').closest('li')).toHaveTextContent(
      /PrivatBank, archived 20 Sept? 2026, \$12 left/,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Restore Old Privat dollars' }));
    expect(await screen.findByText('Old Privat dollars is back')).toBeInTheDocument();

    expect(sent.map((s) => s.url)).toEqual([
      '/api/accounts/mono-usd/archive',
      '/api/accounts/old-usd/restore',
    ]);
  });

  it('deletes from the end of the edit form once the name is typed; Keep it goes back to the form', async () => {
    const without: AccountsOverview = {
      ...OVERVIEW,
      accounts: OVERVIEW.accounts.filter((a) => a.id !== 'mono-usd'),
      totals: OVERVIEW.totals.map((total) =>
        total.currency === 'USD' ? { ...total, accounts: 1, total: 500 } : total,
      ),
    };
    const sent = accountsServer(OVERVIEW, without);
    renderApp('/accounts');

    await userEvent.click(await screen.findByRole('button', { name: /^Mono dollars/ }, LOADED));
    let form = await screen.findByRole('dialog', { name: 'Edit Mono dollars' });
    const end = within(form).getByRole('region', { name: 'Archive or delete' });
    expect(end).toHaveTextContent('Remove it for good. This can’t be undone.');
    await userEvent.click(within(end).getByRole('button', { name: 'Delete' }));

    let ask = await screen.findByRole('dialog', { name: 'Delete Mono dollars?' });
    expect(ask).toHaveTextContent('It’s removed from Pup Budget for good. This can’t be undone.');
    expect(ask).toHaveTextContent('It still has $1 240. That money leaves the USD total.');
    await userEvent.click(within(ask).getByRole('button', { name: 'Keep it' }));
    form = await screen.findByRole('dialog', { name: 'Edit Mono dollars' });

    await userEvent.click(within(form).getByRole('button', { name: 'Delete' }));
    ask = await screen.findByRole('dialog', { name: 'Delete Mono dollars?' });
    const confirm = within(ask).getByRole('button', { name: 'Delete for good' });
    const name = within(ask).getByLabelText('To confirm, type Mono dollars');
    expect(name).toHaveFocus();
    await userEvent.type(name, 'Mono dollar');
    expect(confirm).toBeDisabled();
    await userEvent.type(name, 'S ');
    expect(confirm).toBeEnabled();
    await userEvent.click(confirm);

    expect(await screen.findByText('Mono dollars deleted')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /^Mono dollars/ })).not.toBeInTheDocument();
    });
    // The dollar total counts down to what is left: jsdom's animation frames never get there, the E2E test checks it
    expect(sent.map((s) => s.url)).toEqual(['DELETE /api/accounts/mono-usd']);
  });

  it('deletes an archived account from Archived, next to Restore', async () => {
    const without: AccountsOverview = {
      ...OVERVIEW,
      archived: OVERVIEW.archived.filter((a) => a.id !== 'old-usd'),
    };
    const sent = accountsServer(OVERVIEW, without);
    renderApp('/accounts');

    await userEvent.click(await screen.findByRole('button', { name: /Archived/ }, LOADED));
    await userEvent.click(screen.getByRole('button', { name: 'Delete Old Privat dollars' }));
    const ask = await screen.findByRole('dialog', { name: 'Delete Old Privat dollars?' });
    expect(ask).toHaveTextContent('It still has $12.');
    await userEvent.type(within(ask).getByRole('textbox'), 'old privat dollars');
    await userEvent.click(within(ask).getByRole('button', { name: 'Delete for good' }));

    expect(await screen.findByText('Old Privat dollars deleted')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText('Old Privat dollars')).not.toBeInTheDocument();
    });
    expect(sent.map((s) => s.url)).toEqual(['DELETE /api/accounts/old-usd']);
  });

  it('offers to try again when the accounts can’t be loaded', async () => {
    server.use(http.get('/api/accounts', () => new HttpResponse(null, { status: 500 })));
    renderApp('/accounts');

    expect(await screen.findByRole('alert', {}, LOADED)).toHaveTextContent(
      'Couldn’t load your accounts.',
    );
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});

describe('In total, in UAH (F-017)', () => {
  it('starts with everything in hryvnias at today’s NBU rates, with the rates and their date', async () => {
    accountsServer();
    renderApp('/accounts');

    const totals = await screen.findByRole('group', { name: 'Totals' }, LOADED);
    expect(totals).toHaveTextContent('In total, in UAH');
    expect(await within(totals).findByText('403 744 ₴')).toBeInTheDocument();
    expect(totals).toHaveTextContent(
      'At NBU rates of 2 Nov 2026: $1 = 41.35 ₴, €1 = 48.10 ₴, 1 PLN = 11.30 ₴',
    );
    // Then each currency on its own
    expect(totals).toHaveTextContent('310 133 ₴');
    expect(totals).toHaveTextContent('$1 740');
  });

  it('says when today’s rates aren’t published yet and uses the earlier ones', async () => {
    accountsServer(OVERVIEW, OVERVIEW, 'NotPublished');
    renderApp('/accounts');

    const totals = await screen.findByRole('group', { name: 'Totals' }, LOADED);
    expect(
      await within(totals).findByText(
        'NBU hasn’t published today’s rates yet. At the rates of 30 Oct 2026:',
      ),
    ).toBeInTheDocument();
    expect(totals).toHaveTextContent('403 744 ₴');
  });

  it('says when the NBU can’t be reached and uses the earlier rates', async () => {
    accountsServer(OVERVIEW, OVERVIEW, 'Unavailable');
    renderApp('/accounts');

    const totals = await screen.findByRole('group', { name: 'Totals' }, LOADED);
    expect(
      await within(totals).findByText(
        'Can’t reach the NBU right now. At the rates of 30 Oct 2026:',
      ),
    ).toBeInTheDocument();
  });

  it('without any rates says so and still shows each currency’s total', async () => {
    accountsServer(OVERVIEW, OVERVIEW, 'Missing');
    renderApp('/accounts');

    const totals = await screen.findByRole('group', { name: 'Totals' }, LOADED);
    expect(
      await within(totals).findByText('NBU rates aren’t available right now. Try again later.'),
    ).toBeInTheDocument();
    expect(totals).toHaveTextContent('310 133 ₴');
    expect(totals).not.toHaveTextContent('403 744 ₴');
  });

  it('with hryvnias only shows one total and no rates', async () => {
    const hryvnias: AccountsOverview = {
      ...OVERVIEW,
      accounts: OVERVIEW.accounts.filter((a) => a.currency === 'UAH'),
      totals: OVERVIEW.totals.filter((total) => total.currency === 'UAH'),
    };
    accountsServer(hryvnias);
    renderApp('/accounts');

    const totals = await screen.findByRole('group', { name: 'Totals' }, LOADED);
    expect(await within(totals).findByText('310 133 ₴')).toBeInTheDocument();
    expect(within(totals).getAllByText(/₴/)).toHaveLength(1);
    expect(totals).not.toHaveTextContent('NBU');
  });

  it('counts up after a dollar account is added', async () => {
    const added = account('new', 'Dollars in the drawer', { currency: 'USD', balance: 100 });
    accountsServer(OVERVIEW, {
      ...OVERVIEW,
      accounts: [...OVERVIEW.accounts, added],
      totals: OVERVIEW.totals.map((total) =>
        total.currency === 'USD' ? { ...total, accounts: 3, total: 1840 } : total,
      ),
    });
    renderApp('/accounts');

    const totals = await screen.findByRole('group', { name: 'Totals' }, LOADED);
    await within(totals).findByText('403 744 ₴');
    await userEvent.click(screen.getByRole('button', { name: 'Add USD account' }));
    const form = await screen.findByRole('dialog', { name: 'New account' });
    await userEvent.type(within(form).getByLabelText('Name'), 'Dollars in the drawer');
    await userEvent.click(within(form).getByRole('radio', { name: 'Cash' }));
    const opening = within(form).getByLabelText('Opening balance');
    await userEvent.clear(opening);
    await userEvent.type(opening, '100');
    await userEvent.click(within(form).getByRole('button', { name: 'Add account' }));

    // 403 744 + 100 × 41.35
    expect(
      await within(totals).findByText('407 879 ₴', undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
  }, 10_000);
});
