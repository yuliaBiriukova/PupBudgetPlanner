import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw/http';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { renderApp } from '../../test/render';
import { setScreenWidth } from '../../test/screen';
import { server } from '../../test/server';
import type { AccountsOverview } from '../accounts/accountsApi';
import { OVERVIEW, TOTAL } from '../accounts/accountsTestData';
import { DEFAULT_CATEGORIES } from '../categories/categoriesTestData';
import { addDays, today } from './days';
import type {
  SaveTransactionRequest,
  Transaction,
  TransactionSuggestions,
} from './transactionsApi';
import { categoryId } from './transactionsTestData';

/** The first render of the app can take over a second on a busy machine: waits for the page to load get longer. */
const LOADED = { timeout: 4000 };

/** The one element a query found, for userEvent (no non-null assertions). */
function only(elements: HTMLElement[], at = 0): HTMLElement {
  const element = elements.at(at);
  if (!element) throw new Error('Nothing found');
  return element;
}

const NONE: TransactionSuggestions = { lastAccounts: [], lastCategories: [], mostUsed: [] };

/** The prototype's latest transactions, today's first. */
const LATEST: Transaction[] = [
  {
    id: 't1',
    type: 'Expense',
    date: today(),
    accountId: 'mono',
    accountName: 'Mono black',
    currency: 'UAH',
    categoryId: categoryId('Groceries'),
    categoryName: 'Groceries',
    amount: 612,
    note: 'Silpo',
  },
  {
    id: 't2',
    type: 'Income',
    date: addDays(today(), -1),
    accountId: 'privat',
    accountName: 'Privat card',
    currency: 'UAH',
    categoryId: categoryId('Salary', 'Income'),
    categoryName: 'Salary',
    amount: 62000,
    note: 'October',
  },
  {
    id: 't3',
    type: 'Expense',
    date: '2026-10-12',
    accountId: 'mono-usd',
    accountName: 'Mono dollars',
    currency: 'USD',
    categoryId: categoryId('Spotify'),
    categoryName: 'Spotify',
    amount: 11,
    note: null,
  },
];

interface Sent {
  method: string;
  url: string;
  body: unknown;
}

/** The API: accounts, categories, these transactions and suggestions; returns what the app sent. */
function transactionsServer({
  latest = LATEST,
  suggestions = NONE,
  overview = OVERVIEW,
}: {
  latest?: Transaction[];
  suggestions?: TransactionSuggestions;
  overview?: AccountsOverview;
} = {}) {
  const sent: Sent[] = [];
  const saved = (body: SaveTransactionRequest, id = 'new') => {
    const account = overview.accounts.find((item) => item.id === body.accountId);
    const before = account?.balance ?? 0;
    const after = before + (body.type === 'Expense' ? -body.amount : body.amount);
    return {
      transaction: {
        ...body,
        id,
        accountName: account?.name ?? '',
        currency: account?.currency ?? 'UAH',
        categoryName: 'Saved',
      },
      balances: [{ accountId: body.accountId, before, after }],
    };
  };
  server.use(
    http.get('/api/accounts', () => HttpResponse.json(overview)),
    http.get('/api/accounts/total', () => HttpResponse.json(TOTAL)),
    http.get('/api/categories', () => HttpResponse.json(DEFAULT_CATEGORIES)),
    http.get('/api/transactions', () => HttpResponse.json({ items: latest })),
    http.get('/api/transactions/suggestions', () => HttpResponse.json(suggestions)),
    http.post('/api/transactions', async ({ request }) => {
      const body = (await request.json()) as SaveTransactionRequest;
      sent.push({ method: 'POST', url: '/api/transactions', body });
      return HttpResponse.json(saved(body));
    }),
    http.put('/api/transactions/:id', async ({ request, params }) => {
      const body = (await request.json()) as SaveTransactionRequest;
      sent.push({ method: 'PUT', url: `/api/transactions/${String(params.id)}`, body });
      return HttpResponse.json(saved(body, String(params.id)));
    }),
    http.delete('/api/transactions/:id', ({ params }) => {
      sent.push({ method: 'DELETE', url: `/api/transactions/${String(params.id)}`, body: null });
      return HttpResponse.json({ balances: [{ accountId: 'mono', before: 48211, after: 48823 }] });
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

/** Opens the form with the sidebar's button (the tab bar's on the phone). */
async function openForm() {
  await userEvent.click(
    only(await screen.findAllByRole('button', { name: 'Add transaction' }, LOADED)),
  );
  const form = await screen.findByRole('dialog', { name: 'Add expense' });
  await within(form).findByText('Amount');
  return form;
}

/** The category pills. */
const pills = (form: HTMLElement) => within(form).getByRole('radiogroup', { name: 'Category' });

/** Picks an account from the form's account field. */
async function pickAccount(form: HTMLElement, name: string) {
  await userEvent.click(within(form).getByRole('button', { name: /^Account:/ }));
  const list = await screen.findByRole('dialog', { name: 'Account' });
  await userEvent.click(within(list).getByRole('button', { name: new RegExp(`^${name}`) }));
}

describe('the Transactions page', () => {
  it('lists the latest transactions by day, today and yesterday by name', async () => {
    transactionsServer();
    renderApp('/transactions');

    const today = await screen.findByRole('region', { name: /^Today, / }, LOADED);
    expect(within(today).getByRole('button', { name: /Groceries/ })).toHaveTextContent(
      'GroceriesMono black, Silpo−612 ₴',
    );
    const yesterday = screen.getByRole('region', { name: /^Yesterday, / });
    expect(within(yesterday).getByRole('button', { name: /Salary/ })).toHaveTextContent(
      '+62 000 ₴',
    );
    expect(screen.getByRole('region', { name: '12 Oct 2026' })).toHaveTextContent(
      'SpotifyMono dollars−$11',
    );
  });

  it('explains what to do when there is nothing yet', async () => {
    transactionsServer({ latest: [] });
    renderApp('/transactions');

    expect(await screen.findByText('No transactions yet', {}, LOADED)).toBeInTheDocument();
    await userEvent.click(only(screen.getAllByRole('button', { name: 'Add transaction' }), -1));
    expect(await screen.findByRole('dialog', { name: 'Add expense' })).toBeInTheDocument();
  });

  it('says so when the list could not be loaded', async () => {
    transactionsServer();
    server.use(http.get('/api/transactions', () => new HttpResponse(null, { status: 500 })));
    renderApp('/transactions');

    expect(await screen.findByRole('alert', {}, LOADED)).toHaveTextContent(
      'Couldn’t load your transactions.',
    );
  });
});

describe('adding a transaction', () => {
  it('picks the last account and the category last used with it; the amount is typed on the desktop', async () => {
    const sent = transactionsServer({
      suggestions: {
        ...NONE,
        lastAccounts: [{ type: 'Expense', accountId: 'cash' }],
        lastCategories: [
          { type: 'Expense', accountId: 'cash', categoryId: categoryId('Eating out') },
        ],
      },
    });
    renderApp('/transactions');

    const form = await openForm();
    expect(within(form).getByRole('button', { name: /^Account:/ })).toHaveTextContent('Wallet');
    expect(within(form).getByRole('radio', { name: 'Eating out' })).toBeChecked();
    expect(within(form).getByLabelText('Amount')).toHaveFocus();
    await userEvent.type(within(form).getByLabelText('Amount'), '1200+350');
    expect(within(form).getByLabelText('Amount')).toHaveValue('1 200 + 350');
    expect(form).toHaveTextContent('= 1 550 ₴');
    await userEvent.type(within(form).getByLabelText('Note'), 'Lunch with Vlad');
    await userEvent.click(within(form).getByRole('button', { name: 'Save expense' }));

    expect(await screen.findByText(/Expense saved\. Wallet:/)).toBeInTheDocument();
    expect(sent).toEqual([
      {
        method: 'POST',
        url: '/api/transactions',
        body: {
          type: 'Expense',
          date: today(),
          accountId: 'cash',
          categoryId: categoryId('Eating out'),
          amount: 1550,
          note: 'Lunch with Vlad',
        },
      },
    ]);
  });

  it('works a sum out on the phone keys, and = only while there is one', async () => {
    setScreenWidth(375);
    const sent = transactionsServer({
      suggestions: {
        ...NONE,
        lastCategories: [
          { type: 'Expense', accountId: 'mono', categoryId: categoryId('Groceries') },
        ],
      },
    });
    renderApp('/transactions');

    const form = await openForm();
    const keys = within(form).getByRole('group', { name: 'Amount keys' });
    expect(within(keys).getByRole('button', { name: 'Work out the sum' })).toBeDisabled();
    for (const key of ['1', '2', '00', 'Plus', '3', '5', '0'])
      await userEvent.click(within(keys).getByRole('button', { name: key }));
    expect(within(form).getByLabelText('Amount')).toHaveValue('1 200 + 350');
    await userEvent.click(within(keys).getByRole('button', { name: 'Work out the sum' }));
    expect(within(form).getByLabelText('Amount')).toHaveValue('1 550');
    await userEvent.click(within(keys).getByRole('button', { name: 'Delete the last digit' }));
    await userEvent.click(within(keys).getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(sent.map((item) => (item.body as SaveTransactionRequest).amount)).toEqual([155]);
    });
  });

  it('says what is missing and saves nothing', async () => {
    const sent = transactionsServer();
    renderApp('/transactions');

    const form = await openForm();
    // No transactions yet: the first account, no category
    expect(within(form).getByRole('button', { name: /^Account:/ })).toHaveTextContent('Mono black');
    await userEvent.click(within(form).getByRole('button', { name: 'Save expense' }));

    expect(within(form).getByText('Pick a category.')).toBeInTheDocument();
    expect(within(form).getByLabelText('Amount')).toHaveAttribute('aria-invalid', 'true');
    expect(within(form).getByLabelText('Amount')).toHaveAccessibleDescription('Enter the amount.');
    await userEvent.type(within(form).getByLabelText('Amount'), '300-500');
    await userEvent.click(within(form).getByRole('radio', { name: 'Rent' }));
    await userEvent.click(within(form).getByRole('button', { name: 'Save expense' }));
    expect(within(form).getByLabelText('Amount')).toHaveAccessibleDescription(
      'The sum must be more than zero.',
    );
    expect(within(form).queryByText('Pick a category.')).not.toBeInTheDocument();
    expect(sent).toEqual([]);
  });

  it('keeps everything typed when the save fails', async () => {
    transactionsServer();
    server.use(http.post('/api/transactions', () => new HttpResponse(null, { status: 500 })));
    renderApp('/transactions');

    const form = await openForm();
    await userEvent.type(within(form).getByLabelText('Amount'), '250');
    await userEvent.click(within(form).getByRole('radio', { name: 'Rent' }));
    await userEvent.click(within(form).getByRole('button', { name: 'Save expense' }));

    expect(await within(form).findByRole('alert')).toHaveTextContent('Couldn’t save.');
    expect(within(form).getByLabelText('Amount')).toHaveValue('250');
    expect(within(form).getByRole('radio', { name: 'Rent' })).toBeChecked();
  });

  it('lets a category picked for the person follow the account, and keeps one picked by hand', async () => {
    transactionsServer({
      suggestions: {
        ...NONE,
        lastCategories: [
          { type: 'Expense', accountId: 'mono', categoryId: categoryId('Groceries') },
          { type: 'Expense', accountId: 'cash', categoryId: categoryId('Eating out') },
        ],
      },
    });
    renderApp('/transactions');

    const form = await openForm();
    expect(within(form).getByRole('radio', { name: 'Groceries' })).toBeChecked();
    await pickAccount(form, 'Wallet');
    expect(within(form).getByRole('radio', { name: 'Eating out' })).toBeChecked();
    await pickAccount(form, 'Privat card');
    expect(within(pills(form)).queryByRole('radio', { checked: true })).not.toBeInTheDocument();

    // Picked by hand: it stays
    await userEvent.click(within(form).getByRole('button', { name: /All categories/ }));
    await userEvent.type(screen.getByLabelText('Search categories'), 'sub');
    const list = screen.getByRole('dialog', { name: 'Category' });
    expect(
      within(list)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Spotify', 'Phone', 'Subscriptions']);
    await userEvent.click(within(list).getByRole('button', { name: 'Phone' }));
    await pickAccount(form, 'Wallet');
    expect(within(form).getByRole('radio', { name: 'Phone' })).toBeChecked();
  });

  it('switches to income with its own categories and keeps the amount', async () => {
    const sent = transactionsServer();
    renderApp('/transactions');

    const form = await openForm();
    await userEvent.type(within(form).getByLabelText('Amount'), '1500');
    await userEvent.click(within(form).getByText('Income'));

    const income = await screen.findByRole('dialog', { name: 'Add income' });
    expect(
      within(pills(income))
        .getAllByRole('radio')
        .map((radio) => radio.textContent),
    ).toEqual(['Salary', 'Gifts', 'Other']);
    expect(
      within(income).queryByRole('button', { name: /All categories/ }),
    ).not.toBeInTheDocument();
    await userEvent.click(within(income).getByRole('radio', { name: 'Other' }));
    await userEvent.click(within(income).getByRole('button', { name: 'Save income' }));

    await waitFor(() => {
      expect(sent[0]?.body).toMatchObject({
        type: 'Income',
        amount: 1500,
        categoryId: categoryId('Other', 'Income'),
      });
    });
  });

  it('picks a day of the week strip, but none after today', async () => {
    const sent = transactionsServer();
    renderApp('/transactions');

    const form = await openForm();
    const week = within(form).getByRole('radiogroup', { name: /This week|–/ });
    const days = within(week).getAllByRole('radio');
    expect(days).toHaveLength(7);
    expect(days.find((day) => day.getAttribute('aria-checked') === 'true')).toBeDefined();
    await userEvent.click(within(form).getByRole('button', { name: 'The week before' }));
    const before = within(form).getByRole('radiogroup', { name: /–/ });
    await userEvent.click(only(within(before).getAllByRole('radio')));
    await userEvent.type(within(form).getByLabelText('Amount'), '45');
    await userEvent.click(within(form).getByRole('radio', { name: 'Rent' }));
    await userEvent.click(within(form).getByRole('button', { name: 'Save expense' }));

    await waitFor(() => {
      expect((sent[0]?.body as SaveTransactionRequest).date < addDays(today(), -6)).toBe(true);
    });
  });
});

describe('changing a transaction', () => {
  it('opens from the list, saves the change and deletes after asking', async () => {
    const sent = transactionsServer();
    renderApp('/transactions');

    await userEvent.click(await screen.findByRole('button', { name: /Groceries/ }, LOADED));
    let form = await screen.findByRole('dialog', { name: 'Edit expense' });
    expect(within(form).getByLabelText('Amount')).toHaveValue('612');
    expect(within(form).getByRole('radio', { name: 'Groceries' })).toBeChecked();
    expect(within(form).queryByRole('radiogroup', { name: 'Type' })).not.toBeInTheDocument();
    await userEvent.clear(within(form).getByLabelText('Amount'));
    await userEvent.type(within(form).getByLabelText('Amount'), '640');
    await userEvent.click(within(form).getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText(/Changes saved\. Mono black:/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Groceries/ }));
    form = await screen.findByRole('dialog', { name: 'Edit expense' });
    await userEvent.click(within(form).getByRole('button', { name: 'Delete this expense' }));
    const ask = await screen.findByRole('dialog', { name: 'Delete this expense?' });
    expect(ask).toHaveTextContent('−612 ₴Groceries, Mono black');
    expect(ask).toHaveTextContent('Mono black goes back to 48 823 ₴. This can’t be undone.');
    await userEvent.click(within(ask).getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText(/Deleted\. Mono black:/)).toBeInTheDocument();

    expect(sent.map((item) => `${item.method} ${item.url}`)).toEqual([
      'PUT /api/transactions/t1',
      'DELETE /api/transactions/t1',
    ]);
    expect(sent[0]?.body).toMatchObject({ amount: 640, note: 'Silpo', date: today() });
  });
});

describe('the Accounts page', () => {
  it('adds a transaction from an account’s card with that account, for either type', async () => {
    transactionsServer({
      suggestions: { ...NONE, lastAccounts: [{ type: 'Expense', accountId: 'mono' }] },
    });
    renderApp('/accounts');

    await userEvent.click(
      await screen.findByRole('button', { name: 'Add a transaction from Privat card' }, LOADED),
    );
    const form = await screen.findByRole('dialog', { name: 'Add expense' });
    expect(await within(form).findByRole('button', { name: /^Account:/ })).toHaveTextContent(
      'Privat card',
    );
    await userEvent.click(within(form).getByText('Income'));
    expect(
      within(await screen.findByRole('dialog', { name: 'Add income' })).getByRole('button', {
        name: /^Account:/,
      }),
    ).toHaveTextContent('Privat card');
  });

  it('lets an account with transactions only be archived, in its own currency', async () => {
    const withTransactions: AccountsOverview = {
      ...OVERVIEW,
      accounts: OVERVIEW.accounts.map((account) =>
        account.id === 'mono' ? { ...account, transactionCount: 37 } : account,
      ),
    };
    transactionsServer({ overview: withTransactions });
    renderApp('/accounts');

    await userEvent.click(await screen.findByRole('button', { name: /^Mono black/ }, LOADED));
    const form = await screen.findByRole('dialog', { name: 'Edit Mono black' });
    expect(within(form).getByRole('button', { name: 'Currency' })).toBeDisabled();
    const remove = within(form).getByRole('button', { name: 'Delete' });
    expect(remove).toBeDisabled();
    expect(remove).toHaveAccessibleDescription(
      'It has 37 transactions, so it can only be archived. Only an account without transactions can be deleted.',
    );
  });
});
