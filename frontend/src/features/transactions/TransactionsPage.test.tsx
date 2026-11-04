import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw/http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatMoney } from '../../shared/format/money';
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
import { EXPENSE_NOTES, fakeNotes, fakePage, fakeSummary, twoMonths } from './transactionsFakeApi';
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

/** The NBU's rates of the day the form asks for (F-019). */
const RATES = {
  date: today(),
  status: 'Current',
  rates: [
    { currency: 'EUR', rate: 48.71 },
    { currency: 'USD', rate: 45.53 },
  ],
};

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
  rates = RATES,
}: {
  latest?: Transaction[];
  suggestions?: TransactionSuggestions;
  overview?: AccountsOverview;
  /** The NBU rates the API gives for any day (F-019). */
  rates?: { date: string | null; status: string; rates: { currency: string; rate: number }[] };
} = {}) {
  const sent: Sent[] = [];
  const saved = (body: SaveTransactionRequest, id = 'new') => {
    const account = overview.accounts.find((item) => item.id === body.accountId);
    const before = account?.balance ?? 0;
    const after = before + (body.type === 'Income' ? body.amount : -body.amount);
    // A transfer: its To gets what the bank gave, or the amount itself in one currency
    const to = overview.accounts.find((item) => item.id === body.toAccountId);
    const toAmount = body.toAmount ?? body.amount;
    return {
      transaction: {
        ...body,
        id,
        accountName: account?.name ?? '',
        currency: account?.currency ?? 'UAH',
        categoryName: body.type === 'Transfer' ? null : 'Saved',
        ...(to && { toAccountName: to.name, toCurrency: to.currency, toAmount }),
      },
      balances: [
        { accountId: body.accountId, before, after },
        ...(to ? [{ accountId: to.id, before: to.balance, after: to.balance + toAmount }] : []),
      ],
    };
  };
  server.use(
    http.get('/api/accounts', () => HttpResponse.json(overview)),
    http.get('/api/accounts/total', () => HttpResponse.json(TOTAL)),
    http.get('/api/categories', () => HttpResponse.json(DEFAULT_CATEGORIES)),
    http.get('/api/transactions', ({ request }) =>
      HttpResponse.json(fakePage(latest, new URL(request.url).searchParams)),
    ),
    http.get('/api/transactions/summary', ({ request }) =>
      HttpResponse.json(fakeSummary(latest, new URL(request.url).searchParams)),
    ),
    http.get('/api/transactions/suggestions', () => HttpResponse.json(suggestions)),
    http.get('/api/transactions/notes', ({ request }) =>
      HttpResponse.json(fakeNotes(EXPENSE_NOTES, new URL(request.url).searchParams)),
    ),
    http.get('/api/rates', () => HttpResponse.json(rates)),
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

/** The month's receipts, the period's totals and its calendar come from these (F-020). */
const MONTH = twoMonths('2026-10-29');

/** The accounts with transactions on them: the page isn't the "No transactions yet" one. */
const USED: AccountsOverview = {
  ...OVERVIEW,
  accounts: OVERVIEW.accounts.map((account) => ({ ...account, transactionCount: 12 })),
};

/** An amount as the page shows it, with plain spaces: the text matchers make the page's no-break ones plain too. */
const money = (value: number) => formatMoney(value, 'UAH').replace(/\u00a0/g, ' ');

describe('the Transactions page', () => {
  it('shows a month as receipts by day, newest first, each with what the day cost', async () => {
    transactionsServer();
    renderApp('/transactions');

    const todays = await screen.findByRole('region', { name: /^Today, / }, LOADED);
    expect(within(todays).getByRole('button', { name: /Groceries/ })).toHaveTextContent(
      'Groceries−612 ₴Mono black, Silpo',
    );
    expect(todays).toHaveTextContent('Total−612 ₴');
    const yesterday = screen.getByRole('region', { name: /^Yesterday, / });
    expect(within(yesterday).getByRole('button', { name: /Salary/ })).toHaveTextContent(
      'Salary+62 000 ₴Privat card, October',
    );
    expect(yesterday).toHaveTextContent('Received+62 000 ₴');
    // This month only: 12 October is another month unless today is in October
    if (!today().startsWith('2026-10')) {
      expect(screen.queryByRole('button', { name: /Spotify/ })).not.toBeInTheDocument();
    }
  });

  it('puts the month’s spent and received on top, with how much of what came in is spent', async () => {
    transactionsServer({ latest: MONTH, overview: USED });
    renderApp('/transactions?month=2026-10');

    const totals = await screen.findByRole('region', { name: 'Totals' }, LOADED);
    const summary = fakeSummary(MONTH, new URLSearchParams('from=2026-10-01&to=2026-10-31'));
    await waitFor(() => {
      expect(totals).toHaveTextContent(money(summary.spent));
    }, LOADED);
    expect(totals).toHaveTextContent(`+${money(summary.received)}`);
    expect(
      within(totals).getByRole('img', {
        name: `${String(Math.round((summary.spent / summary.received) * 100))}% of what came in is spent`,
      }),
    ).toBeInTheDocument();
    expect(
      within(totals).getByRole('button', { name: /^Period:\s*October 2026$/ }),
    ).toBeInTheDocument();
    expect(within(totals).getByRole('button', { name: 'Previous month' })).toBeEnabled();
  });

  it('shows only a category picked in Where it went, with its own totals', async () => {
    transactionsServer({ latest: MONTH, overview: USED });
    renderApp('/transactions?month=2026-10');

    const where = await screen.findByRole('region', { name: 'Where it went' }, LOADED);
    await userEvent.click(
      await within(where).findByRole('button', { name: /^Eating out/ }, LOADED),
    );

    expect(
      await screen.findByRole('button', { name: 'Showing Eating out only. Show all categories' }),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /^Groceries−/ })).not.toBeInTheDocument();
    });
    expect(screen.getAllByRole('button', { name: /^Eating out−/ }).length).toBeGreaterThan(0);
    expect(screen.getByText('Spent, on what’s picked')).toBeInTheDocument();
  });

  it('shows only a day tapped in the calendar, and the month again; a day with a transfer says so', async () => {
    transactionsServer({ latest: MONTH, overview: USED });
    renderApp('/transactions?month=2026-10');

    const days = await screen.findByRole('region', { name: 'Days of October' }, LOADED);
    // The 15th has a transfer (dollars into Mono black): it says so, as a day with income does
    expect(
      await within(days).findByRole(
        'button',
        { name: /^Thursday 15 October: .*, a transfer$/ },
        LOADED,
      ),
    ).toBeInTheDocument();
    await userEvent.click(within(days).getByRole('button', { name: /^Thursday 1 October/ }));

    expect(await screen.findByText('Only Thursday, 1 Oct')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getAllByRole('region', { name: /, \d+ Oct$/ })).toHaveLength(1);
    });
    await userEvent.click(screen.getByRole('button', { name: 'Show all of October' }));
    await waitFor(() => {
      expect(screen.getAllByRole('region', { name: /, \d+ Oct$/ }).length).toBeGreaterThan(1);
    });
  });

  it('opens on the phone with the Filters button; the sheet’s picks show as chips', async () => {
    setScreenWidth(375);
    transactionsServer({ latest: MONTH, overview: USED });
    renderApp('/transactions?month=2026-10');

    await userEvent.click(await screen.findByRole('button', { name: 'Filters' }, LOADED));
    const sheet = await screen.findByRole('dialog', { name: 'Filters' });
    await userEvent.click(within(sheet).getByRole('button', { name: 'Wallet' }));
    await userEvent.click(within(sheet).getByRole('button', { name: 'Expenses' }));
    const count = fakeSummary(
      MONTH,
      new URLSearchParams('from=2026-10-01&to=2026-10-31&accountId=cash&type=Expense'),
    ).count;
    await userEvent.click(
      await within(sheet).findByRole(
        'button',
        { name: `Show ${String(count)} transactions` },
        LOADED,
      ),
    );

    expect(
      await screen.findByRole('button', { name: 'Clear account: Wallet' }, LOADED),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear type: Expenses' })).toBeInTheDocument();
    expect(screen.getByLabelText('2 on')).toHaveTextContent('2');
    // Several sheet steps and a Back step to wait for: slower than most when the whole suite runs at once
  }, 15_000);

  it('says nothing was found and clears the filters', async () => {
    transactionsServer({ latest: MONTH, overview: USED });
    renderApp('/transactions?month=2026-10&account=mono-usd&type=income');

    expect(await screen.findByText('Nothing found', {}, LOADED)).toBeInTheDocument();
    expect(
      screen.getByText('No transactions match these filters in October 2026.'),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(await screen.findAllByRole('region', { name: /, \d+ Oct$/ })).not.toHaveLength(0);
  });

  it('loads more as the end of the list comes near, the day’s total already whole', async () => {
    // The end of the list is always in sight: every page loads in turn
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        private readonly callback: IntersectionObserverCallback;
        constructor(callback: IntersectionObserverCallback) {
          this.callback = callback;
        }
        observe = () => {
          setTimeout(() => {
            this.callback([{ isIntersecting: true } as IntersectionObserverEntry], this as never);
          });
        };
        disconnect = vi.fn();
      },
    );
    transactionsServer({ latest: MONTH, overview: USED });
    renderApp('/transactions?month=2026-10');

    const october = MONTH.filter((item) => item.date.startsWith('2026-10'));
    expect(october.length).toBeGreaterThan(30);
    expect(await screen.findByText('That’s all of October 2026.', {}, LOADED)).toBeInTheDocument();
    const lines = screen
      .getAllByRole('region', { name: /, \d+ Oct$/ })
      .flatMap((receipt) => within(receipt).getAllByRole('button'));
    expect(lines).toHaveLength(october.length);
    // A day's foot is its whole total, as the summary has it
    const first = fakeSummary(MONTH, new URLSearchParams('from=2026-10-01&to=2026-10-01'));
    expect(screen.getByRole('region', { name: 'Thursday, 1 Oct' })).toHaveTextContent(
      `Total−${money(first.spent)}`,
    );
    vi.unstubAllGlobals();
  });

  it('adds a transaction from the slip, with the one picked account', async () => {
    transactionsServer({ latest: MONTH, overview: USED });
    renderApp('/transactions?month=2026-10&account=privat');

    const totals = await screen.findByRole('region', { name: 'Totals' }, LOADED);
    await userEvent.click(within(totals).getByRole('button', { name: 'Add transaction' }));
    const form = await screen.findByRole('dialog', { name: 'Add expense' }, LOADED);
    expect(
      await within(form).findByRole('button', { name: /^Account:/ }, LOADED),
    ).toHaveTextContent('Privat card');
  });

  it('shows Add transaction on the phone’s slip as a round +, its name for screen readers', async () => {
    setScreenWidth(375);
    transactionsServer({ latest: MONTH, overview: USED });
    renderApp('/transactions?month=2026-10');

    const totals = await screen.findByRole('region', { name: 'Totals' }, LOADED);
    const add = within(totals).getByRole('button', { name: 'Add transaction' });
    expect(add).toHaveAttribute('data-round');
    await userEvent.click(add);
    expect(await screen.findByRole('dialog', { name: 'Add expense' }, LOADED)).toBeInTheDocument();
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

describe('the Note field’s suggestions (I-017)', () => {
  /** Mono black with Groceries picked: the form can be saved once it has an amount. */
  const PICKED: TransactionSuggestions = {
    ...NONE,
    lastCategories: [{ type: 'Expense', accountId: 'mono', categoryId: categoryId('Groceries') }],
  };

  /** The rows of the list under the Note field, once it shows. */
  async function suggestions() {
    const list = await screen.findByRole('listbox', { name: 'Notes you used before' }, LOADED);
    return within(list)
      .getAllByRole('option')
      .map((option) => option.textContent);
  }

  it('lists the earlier notes that start with what is typed first; a click picks one and it is saved', async () => {
    const sent = transactionsServer({ suggestions: PICKED });
    renderApp('/transactions');

    const form = await openForm();
    await userEvent.type(within(form).getByLabelText('Amount'), '612');
    const note = within(form).getByLabelText('Note');
    await userEvent.type(note, 'si');
    expect(await suggestions()).toEqual([
      'Silpo',
      'Simcard top-up',
      'Silpo, wine for Friday',
      'Physio session',
      'Kids’ music lesson',
    ]);
    await userEvent.click(screen.getByRole('option', { name: 'Silpo, wine for Friday' }));
    expect(note).toHaveValue('Silpo, wine for Friday');
    expect(note).toHaveFocus();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    await userEvent.click(within(form).getByRole('button', { name: 'Save expense' }));

    await waitFor(() => {
      expect(sent.map((item) => (item.body as SaveTransactionRequest).note)).toEqual([
        'Silpo, wine for Friday',
      ]);
    });
  });

  it('ignores case in Ukrainian too and never suggests what is typed already', async () => {
    transactionsServer();
    renderApp('/transactions');

    const form = await openForm();
    const note = within(form).getByLabelText('Note');
    await userEvent.type(note, 'ат');
    expect(await suggestions()).toEqual([
      'АТБ',
      'Батарейки',
      'Квартплата за жовтень',
      'Вата і бинт',
    ]);
    await userEvent.clear(note);
    await userEvent.type(note, 'SILPO');
    await waitFor(async () => {
      expect(await suggestions()).toEqual(['Silpo, wine for Friday']);
    });
    await userEvent.clear(note);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('picks with the arrow keys and Enter; Escape closes the list, not the form; Enter saves what is typed', async () => {
    const sent = transactionsServer({ suggestions: PICKED });
    renderApp('/transactions');

    const form = await openForm();
    await userEvent.type(within(form).getByLabelText('Amount'), '90');
    const note = within(form).getByLabelText('Note');
    await userEvent.type(note, 'si');
    await suggestions();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(note).toHaveValue('Simcard top-up');
    expect(sent).toEqual([]);

    await userEvent.clear(note);
    await userEvent.type(note, 'ta');
    await suggestions();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Add expense' })).toBeInTheDocument();
    // Typing on without picking keeps exactly what was typed
    await userEvent.keyboard('{Enter}');

    await waitFor(() => {
      expect(sent.map((item) => (item.body as SaveTransactionRequest).note)).toEqual(['ta']);
    });
  });

  it('asks for the notes of the form’s type only', async () => {
    transactionsServer();
    renderApp('/transactions');

    const form = await openForm();
    await userEvent.click(within(form).getByText('Income'));
    const income = await screen.findByRole('dialog', { name: 'Add income' });
    await userEvent.type(within(income).getByLabelText('Note'), 'si');
    // The fake API has expense notes only
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('folds the phone keys away while the note is typed; a tap on the amount brings them back', async () => {
    setScreenWidth(375);
    transactionsServer();
    renderApp('/transactions');

    const form = await openForm();
    expect(within(form).getByRole('group', { name: 'Amount keys' })).toBeInTheDocument();
    await userEvent.click(within(form).getByLabelText('Note'));
    expect(within(form).queryByRole('group', { name: 'Amount keys' })).not.toBeInTheDocument();
    expect(within(form).getByRole('button', { name: 'Save expense' })).toBeInTheDocument();
    await userEvent.type(within(form).getByLabelText('Note'), 'si');
    expect(await suggestions()).toHaveLength(5);

    await userEvent.click(within(form).getByLabelText('Amount'));
    expect(within(form).getByRole('group', { name: 'Amount keys' })).toBeInTheDocument();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});

describe('changing a transaction', () => {
  it('opens from the list, saves the change and deletes after asking', async () => {
    const sent = transactionsServer();
    renderApp('/transactions');

    // On today's receipt: the desktop's Where it went has a Groceries line too
    const receipt = await screen.findByRole('region', { name: /^Today, / }, LOADED);
    await userEvent.click(within(receipt).getByRole('button', { name: /Groceries/ }));
    let form = await screen.findByRole('dialog', { name: 'Edit expense' });
    expect(within(form).getByLabelText('Amount')).toHaveValue('612');
    expect(within(form).getByRole('radio', { name: 'Groceries' })).toBeChecked();
    expect(within(form).queryByRole('radiogroup', { name: 'Type' })).not.toBeInTheDocument();
    await userEvent.clear(within(form).getByLabelText('Amount'));
    await userEvent.type(within(form).getByLabelText('Amount'), '640');
    await userEvent.click(within(form).getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText(/Changes saved\. Mono black:/)).toBeInTheDocument();

    await userEvent.click(
      within(screen.getByRole('region', { name: /^Today, / })).getByRole('button', {
        name: /Groceries/,
      }),
    );
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

/** The last transfer: dollars sold into Mono black. */
const LAST_EXCHANGE: TransactionSuggestions = {
  ...NONE,
  lastAccounts: [{ type: 'Transfer', accountId: 'mono-usd' }],
  lastTransfer: { fromAccountId: 'mono-usd', toAccountId: 'mono' },
};

/** Opens the form and switches it to Transfer. */
async function openTransfer() {
  const form = await openForm();
  await userEvent.click(within(form).getByText('Transfer'));
  return screen.findByRole('dialog', { name: 'Add transfer' });
}

describe('transfers', () => {
  it('moves money between two accounts in one currency: one amount, no category', async () => {
    const sent = transactionsServer({
      suggestions: { ...NONE, lastTransfer: { fromAccountId: 'mono', toAccountId: 'cash' } },
    });
    renderApp('/transactions');

    const form = await openTransfer();
    expect(within(form).getByRole('button', { name: /^From/ })).toHaveTextContent('Mono black');
    expect(within(form).getByRole('button', { name: /^To/ })).toHaveTextContent('Wallet');
    expect(within(form).queryByRole('radiogroup', { name: 'Category' })).not.toBeInTheDocument();
    expect(within(form).queryByLabelText(/^To Wallet/)).not.toBeInTheDocument();

    // The To list leaves out the From account
    await userEvent.click(within(form).getByRole('button', { name: /^To/ }));
    const list = await screen.findByRole('dialog', { name: 'To' });
    expect(within(list).queryByRole('button', { name: /^Mono black/ })).not.toBeInTheDocument();
    await userEvent.click(within(list).getByRole('button', { name: /^Privat card/ }));

    await userEvent.type(within(form).getByLabelText('Amount'), '2000');
    await userEvent.type(within(form).getByLabelText('Note'), 'Savings');
    await userEvent.click(within(form).getByRole('button', { name: 'Save transfer' }));

    expect(await screen.findByText('Transfer saved.')).toBeInTheDocument();
    expect(screen.getByText(/Mono black.*Privat card/)).toBeInTheDocument();
    expect(sent.map((item) => item.body)).toEqual([
      {
        type: 'Transfer',
        date: today(),
        accountId: 'mono',
        categoryId: null,
        amount: 2000,
        note: 'Savings',
        toAccountId: 'privat',
        toAmount: null,
      },
    ]);
  });

  it('suggests an exchange’s second amount at the NBU rate, takes the bank’s own and goes back', async () => {
    const sent = transactionsServer({ suggestions: LAST_EXCHANGE });
    renderApp('/transactions');

    const form = await openTransfer();
    expect(within(form).getByRole('button', { name: /^From/ })).toHaveTextContent('Mono dollars');
    expect(within(form).getByRole('button', { name: /^To/ })).toHaveTextContent('Mono black');
    await userEvent.type(within(form).getByLabelText('From Mono dollars'), '100');
    const to = within(form).getByLabelText('To Mono black');
    await waitFor(() => {
      expect(to).toHaveValue('4 553');
    });
    expect(form).toHaveTextContent(
      /At the NBU rate of .*: \$1 = 45\.53 ₴\. Change it to what the bank gave you\./,
    );

    await userEvent.clear(to);
    await userEvent.type(to, '4490');
    expect(form).toHaveTextContent('Your rate: $1 = 44.90 ₴. NBU: $1 = 45.53 ₴.');
    await userEvent.click(within(form).getByRole('button', { name: 'Use the NBU rate' }));
    expect(to).toHaveValue('4 553');
    await userEvent.clear(to);
    await userEvent.type(to, '4490');
    await userEvent.click(within(form).getByRole('button', { name: 'Save transfer' }));

    expect(await screen.findByText('Exchange saved.')).toBeInTheDocument();
    expect(sent.map((item) => item.body)).toEqual([
      expect.objectContaining({
        accountId: 'mono-usd',
        amount: 100,
        toAccountId: 'mono',
        toAmount: 4490,
      }),
    ]);
  });

  it('swaps From and To with their amounts', async () => {
    transactionsServer({ suggestions: LAST_EXCHANGE });
    renderApp('/transactions');

    const form = await openTransfer();
    await userEvent.type(within(form).getByLabelText('From Mono dollars'), '100');
    await userEvent.clear(within(form).getByLabelText('To Mono black'));
    await userEvent.type(within(form).getByLabelText('To Mono black'), '4490');
    await userEvent.click(within(form).getByRole('button', { name: 'Swap From and To' }));

    expect(within(form).getByRole('button', { name: /^From/ })).toHaveTextContent('Mono black');
    expect(within(form).getByLabelText('From Mono black')).toHaveValue('4 490');
    expect(within(form).getByLabelText('To Mono dollars')).toHaveValue('100');
    // Buying dollars reads the same way as selling them
    expect(form).toHaveTextContent('Your rate: $1 = 44.90 ₴.');
  });

  it('asks for the second amount when the NBU has no rate', async () => {
    const sent = transactionsServer({
      suggestions: LAST_EXCHANGE,
      rates: { date: null, status: 'Missing', rates: [] },
    });
    renderApp('/transactions');

    const form = await openTransfer();
    await userEvent.type(within(form).getByLabelText('From Mono dollars'), '100');
    expect(
      await within(form).findByText(
        'No NBU rate for this day right now. Type how much Mono black got.',
      ),
    ).toBeInTheDocument();
    expect(within(form).getByLabelText('To Mono black')).toHaveValue('');
    await userEvent.click(within(form).getByRole('button', { name: 'Save transfer' }));
    expect(within(form).getByLabelText('To Mono black')).toHaveAccessibleDescription(
      'Enter how much Mono black got.',
    );
    expect(sent).toEqual([]);
  });

  it('says an earlier rate is an earlier one', async () => {
    transactionsServer({
      suggestions: LAST_EXCHANGE,
      rates: { ...RATES, date: '2026-10-30', status: 'NotPublished' },
    });
    renderApp('/transactions');

    const form = await openTransfer();
    await waitFor(() => {
      expect(form).toHaveTextContent(
        /isn’t out yet\. At the rate of 30 Oct 2026: \$1 = 45\.53 ₴\./,
      );
    });
  });

  it('moves the phone keys to the To amount, the first key replacing the suggestion', async () => {
    setScreenWidth(375);
    const sent = transactionsServer({ suggestions: LAST_EXCHANGE });
    renderApp('/transactions');

    const form = await openTransfer();
    const keys = within(form).getByRole('group', { name: 'Amount keys' });
    for (const key of ['1', '0', '0'])
      await userEvent.click(within(keys).getByRole('button', { name: key }));
    await waitFor(() => {
      expect(within(form).getByLabelText('To Mono black')).toHaveValue('4 553');
    });
    await userEvent.click(within(form).getByLabelText('To Mono black'));
    for (const key of ['4', '4', '9', '0'])
      await userEvent.click(within(keys).getByRole('button', { name: key }));
    expect(within(form).getByLabelText('To Mono black')).toHaveValue('4 490');
    expect(within(form).getByLabelText('From Mono dollars')).toHaveValue('100');
    await userEvent.click(within(keys).getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(sent.map((item) => (item.body as SaveTransactionRequest).toAmount)).toEqual([4490]);
    });
  });

  it('lists transfers and exchanges, and asks before deleting what both balances go back to', async () => {
    const exchange: Transaction = {
      id: 't9',
      type: 'Transfer',
      date: today(),
      accountId: 'mono-usd',
      accountName: 'Mono dollars',
      currency: 'USD',
      categoryId: null,
      categoryName: null,
      amount: 100,
      note: null,
      toAccountId: 'mono',
      toAccountName: 'Mono black',
      toCurrency: 'UAH',
      toAmount: 4490,
    };
    const transfer: Transaction = {
      ...exchange,
      id: 't10',
      accountId: 'mono',
      accountName: 'Mono black',
      currency: 'UAH',
      amount: 2000,
      note: 'Cash for the market',
      toAccountId: 'cash',
      toAccountName: 'Wallet',
      toCurrency: 'UAH',
      toAmount: 2000,
    };
    transactionsServer({ latest: [exchange, transfer] });
    renderApp('/transactions');

    const exchangeRow = await screen.findByRole('button', { name: /^Exchange/ }, LOADED);
    expect(exchangeRow).toHaveTextContent('Exchange$100');
    expect(exchangeRow).toHaveTextContent('Mono dollarsMono black');
    expect(exchangeRow).toHaveTextContent('4 490 ₴');
    expect(screen.getByRole('button', { name: /^Transfer/ })).toHaveTextContent(
      'Transfer2 000 ₴Mono blackWallet, Cash for the market',
    );

    await userEvent.click(exchangeRow);
    const form = await screen.findByRole('dialog', { name: 'Edit exchange' });
    expect(within(form).getByLabelText('To Mono black')).toHaveValue('4 490');
    await userEvent.click(within(form).getByRole('button', { name: 'Delete this exchange' }));
    const ask = await screen.findByRole('dialog', { name: 'Delete this exchange?' });
    expect(ask).toHaveTextContent('Exchange from Mono dollars to Mono black');
    expect(ask).toHaveTextContent(
      'Mono dollars goes back to $1 340, Mono black to 43 721 ₴. This can’t be undone.',
    );
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
