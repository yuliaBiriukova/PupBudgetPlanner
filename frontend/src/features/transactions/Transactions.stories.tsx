import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useRef } from 'react';
import { MemoryRouter } from 'react-router';
import { expect, userEvent, within } from 'storybook/test';
import { MockFetch, type MockRoutes } from '../../test/mockFetch';
import { EMPTY, OVERVIEW } from '../accounts/accountsTestData';
import { DEFAULT_CATEGORIES } from '../categories/categoriesTestData';
import { useTransactionForm } from './transactionForm';
import { TransactionFormProvider } from './TransactionFormProvider';
import { TransactionsPage } from './TransactionsPage';
import { EXPENSE_NOTES, fakeNotes, fakePage, fakeSummary } from './transactionsFakeApi';
import { latestTransactions, SUGGESTIONS } from './transactionsTestData';

interface ScreenProps {
  data?: 'latest' | 'empty' | 'loading' | 'error';
  /** The form opened over the page: to add, to change a transaction, from an account's card. */
  form?: 'add' | 'edit' | 'edit-exchange' | 'from-account';
  /** The NBU rates the form gets for an exchange (F-019): the day's, an earlier day's, none. */
  rates?: 'current' | 'earlier' | 'none';
  /** What the form gets from the API. */
  formData?: 'ready' | 'loading' | 'error' | 'no-accounts';
  /** The save answers with an error. */
  saveFails?: boolean;
  /** The Note field's suggestions (I-017): the earlier notes, none at all, or still loading. */
  notes?: 'some' | 'none' | 'loading';
}

/** Opens the form as the + or a row would. */
function Opener({ form }: { form?: ScreenProps['form'] }) {
  const api = useTransactionForm();
  // Once, as the story starts
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    if (form === 'add') api.add();
    if (form === 'from-account') api.add({ accountId: 'privat' });
    // Salary, an income on Privat card
    const salary = latestTransactions().find((item) => item.id === 't5');
    if (form === 'edit' && salary) api.edit(salary);
    // $100 sold into Mono black (F-019)
    const exchange = latestTransactions().find((item) => item.id === 't3');
    if (form === 'edit-exchange' && exchange) api.edit(exchange);
  }, [api, form]);
  return null;
}

/** The Transactions page and the quick-add form with a fake API (F-018). */
function TransactionsScreen({
  data = 'latest',
  form,
  formData = 'ready',
  saveFails,
  rates = 'current',
  notes = 'some',
}: ScreenProps) {
  const answer = (json: unknown) =>
    formData === 'loading' ? 'pending' : formData === 'error' ? { status: 500 } : { json };
  const routes: MockRoutes = {
    '/api/transactions':
      data === 'loading'
        ? 'pending'
        : data === 'error'
          ? { status: 500 }
          : (_, query) => ({
              json: fakePage(data === 'empty' ? [] : latestTransactions(), query),
            }),
    '/api/transactions/summary': (_, query) => ({
      json: fakeSummary(data === 'empty' ? [] : latestTransactions(), query),
    }),
    '/api/accounts': answer(formData === 'no-accounts' ? EMPTY : OVERVIEW),
    '/api/categories': answer(DEFAULT_CATEGORIES),
    '/api/transactions/suggestions': answer(SUGGESTIONS),
    '/api/transactions/notes':
      notes === 'loading'
        ? 'pending'
        : (_, query) => ({ json: notes === 'none' ? [] : fakeNotes(EXPENSE_NOTES, query) }),
    'POST /api/transactions': saveFails ? { status: 500 } : 'pending',
    '/api/rates': {
      json:
        rates === 'none'
          ? { date: null, status: 'Missing', rates: [] }
          : {
              date: rates === 'earlier' ? '2026-10-28' : '2026-10-29',
              status: rates === 'earlier' ? 'NotPublished' : 'Current',
              rates: [
                { currency: 'EUR', rate: 48.71 },
                { currency: 'USD', rate: 45.53 },
              ],
            },
    },
  };

  // In <main>, as in the app shell: the page's header isn't the document's banner
  return (
    <MemoryRouter>
      <MockFetch routes={routes}>
        <TransactionFormProvider>
          <main>
            <TransactionsPage />
          </main>
          <Opener form={form} />
        </TransactionFormProvider>
      </MockFetch>
    </MemoryRouter>
  );
}

const desktop = { viewport: { value: 'desktop', isRotated: false } };

const meta = {
  title: 'Transactions/Transactions page and quick add',
  component: TransactionsScreen,
  args: {},
} satisfies Meta<typeof TransactionsScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

export const LatestPhone: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole('region', { name: /^Today, / })).toHaveTextContent(
      'Groceries',
    );
  },
};

export const LatestPhoneDark: Story = { globals: { colorScheme: 'dark' } };

export const LatestDesktop: Story = { globals: desktop };

export const Empty: Story = { args: { data: 'empty' } };

export const Loading: Story = { args: { data: 'loading' } };

export const CouldNotLoad: Story = { args: { data: 'error' } };

/** The form on the phone: the last account (Mono black) and its last category (Groceries) picked, the app's keys. */
export const AddPhone: Story = {
  args: { form: 'add' },
  play: async () => {
    const form = await within(document.body).findByRole('dialog', { name: 'Add expense' });
    await expect(await within(form).findByRole('radio', { name: 'Groceries' })).toBeChecked();
  },
};

export const AddPhoneDark: Story = { args: { form: 'add' }, globals: { colorScheme: 'dark' } };

/** The desktop dialog: the amount typed, Cancel and Save. */
export const AddDesktop: Story = { args: { form: 'add' }, globals: desktop };

export const AddDesktopDark: Story = {
  args: { form: 'add' },
  globals: { ...desktop, colorScheme: 'dark' },
};

/** A receipt added up on the keys: arithmetic on the display, its result on the top line. */
export const SumOnTheKeys: Story = {
  args: { form: 'add' },
  play: async () => {
    const form = await within(document.body).findByRole('dialog', { name: 'Add expense' });
    const keys = await within(form).findByRole('group', { name: 'Amount keys' });
    for (const key of ['1', '2', '00', 'Plus', '3', '5', '0'])
      await userEvent.click(within(keys).getByRole('button', { name: key }));
    await expect(form).toHaveTextContent('= 1 550 ₴');
  },
};

/** Save with nothing entered: the red display, and "Pick a category." by its label. */
export const NothingEntered: Story = {
  args: { form: 'add' },
  globals: desktop,
  play: async () => {
    const form = await within(document.body).findByRole('dialog', { name: 'Add expense' });
    await userEvent.click(within(form).getByRole('button', { name: /^Account:/ }));
    await userEvent.click(
      within(await within(document.body).findByRole('dialog', { name: 'Account' })).getByRole(
        'button',
        { name: /^Privat card/ },
      ),
    );
    await userEvent.click(within(form).getByRole('button', { name: 'Save expense' }));
    await expect(within(form).getByText('Pick a category.')).toBeInTheDocument();
  },
};

/** The save failed: the banner on top, everything typed kept. */
export const CouldNotSave: Story = {
  args: { form: 'add', saveFails: true },
  globals: desktop,
  play: async () => {
    const form = await within(document.body).findByRole('dialog', { name: 'Add expense' });
    await userEvent.type(await within(form).findByLabelText('Amount'), '250');
    await userEvent.click(within(form).getByRole('button', { name: 'Save expense' }));
    await expect(await within(form).findByRole('alert')).toHaveTextContent('Couldn’t save.');
  },
};

export const IncomePhone: Story = {
  args: { form: 'add' },
  play: async () => {
    const form = await within(document.body).findByRole('dialog', { name: 'Add expense' });
    await userEvent.click(await within(form).findByText('Income'));
    await expect(
      await within(document.body).findByRole('dialog', { name: 'Add income' }),
    ).toBeInTheDocument();
  },
};

/** All categories with a search: a dropdown on the desktop. */
export const AllCategoriesDesktop: Story = {
  args: { form: 'add' },
  globals: desktop,
  play: async () => {
    const form = await within(document.body).findByRole('dialog', { name: 'Add expense' });
    await userEvent.click(await within(form).findByRole('button', { name: /All categories/ }));
    await userEvent.type(within(document.body).getByLabelText('Search categories'), 'sub');
  },
};

/** The calendar: Today and Yesterday, then the month; a sheet on the phone. */
export const CalendarPhone: Story = {
  args: { form: 'add' },
  play: async () => {
    const form = await within(document.body).findByRole('dialog', { name: 'Add expense' });
    await userEvent.click(
      await within(form).findByRole('button', { name: 'Pick a day in the calendar' }),
    );
  },
};

/** From the + on Privat card's card (Accounts page): that account picked. */
export const FromAnAccount: Story = { args: { form: 'from-account' }, globals: desktop };

/** A row opened: its title and Delete instead of the type switch. */
export const EditDesktop: Story = { args: { form: 'edit' }, globals: desktop };

export const EditPhoneDark: Story = { args: { form: 'edit' }, globals: { colorScheme: 'dark' } };

/** Delete asks first and says what the balance goes back to. */
export const DeleteAsks: Story = {
  args: { form: 'edit' },
  globals: desktop,
  play: async () => {
    const form = await within(document.body).findByRole('dialog', { name: 'Edit income' });
    await userEvent.click(await within(form).findByRole('button', { name: 'Delete this income' }));
    await expect(
      await within(document.body).findByRole('dialog', { name: 'Delete this income?' }),
    ).toHaveTextContent('Privat card goes back to');
  },
};

export const FormLoading: Story = { args: { form: 'add', formData: 'loading' } };

export const FormCouldNotLoad: Story = { args: { form: 'add', formData: 'error' } };

/** No accounts yet: the form says to add one first. */
export const FormWithoutAccounts: Story = { args: { form: 'add', formData: 'no-accounts' } };

/** Opens the form on Transfer (F-019): the last transfer's From and To picked, $100 → Mono black. */
async function openTransfer(amount?: string) {
  const body = within(document.body);
  const form = await body.findByRole('dialog', { name: 'Add expense' });
  await userEvent.click(await within(form).findByText('Transfer'));
  const transfer = await body.findByRole('dialog', { name: 'Add transfer' });
  if (amount) await userEvent.type(within(transfer).getByLabelText('From Mono dollars'), amount);
  return transfer;
}

/** A transfer in one currency: one amount in blue, From and To with the swap between them, no category. */
export const TransferDesktop: Story = {
  args: { form: 'add' },
  globals: desktop,
  play: async () => {
    const form = await openTransfer();
    await userEvent.click(within(form).getByRole('button', { name: /^To/ }));
    await userEvent.click(await within(document.body).findByRole('button', { name: /^Wallet/ }));
    await userEvent.click(within(form).getByRole('button', { name: /^From/ }));
    await userEvent.click(
      await within(document.body).findByRole('button', { name: /^Mono black/ }),
    );
    await userEvent.type(within(form).getByLabelText('Amount'), '2000');
  },
};

/** An exchange: the second amount suggested at the NBU rate of the day, the line saying so. */
export const ExchangeDesktop: Story = {
  args: { form: 'add' },
  globals: desktop,
  play: async () => {
    const form = await openTransfer('100');
    await expect(await within(form).findByLabelText('To Mono black')).toHaveValue('4 553');
  },
};

/** The bank's own figure: "Your rate" next to the NBU's, and "Use the NBU rate". */
export const ExchangeYourRateDesktopDark: Story = {
  args: { form: 'add' },
  globals: { ...desktop, colorScheme: 'dark' },
  play: async () => {
    const form = await openTransfer('100');
    const to = within(form).getByLabelText('To Mono black');
    await userEvent.clear(to);
    await userEvent.type(to, '4490');
    await expect(form).toHaveTextContent('Your rate');
  },
};

/** On the phone the keys type into the display with the ring; a tap on the other moves them. */
export const ExchangePhone: Story = {
  args: { form: 'add' },
  play: async () => {
    const form = await openTransfer();
    const keys = within(form).getByRole('group', { name: 'Amount keys' });
    for (const key of ['1', '0', '0'])
      await userEvent.click(within(keys).getByRole('button', { name: key }));
    await userEvent.click(within(form).getByLabelText('To Mono black'));
  },
};

export const ExchangePhoneDark: Story = {
  ...ExchangePhone,
  globals: { colorScheme: 'dark' },
};

/** The day's rate isn't out yet: the latest earlier one is suggested and the line says so. */
export const ExchangeEarlierRate: Story = {
  args: { form: 'add', rates: 'earlier' },
  globals: desktop,
  play: async () => {
    const form = await openTransfer('100');
    await expect(await within(form).findByText(/isn’t out yet/)).toBeInTheDocument();
  },
};

/** No rate at all: the To amount is asked for, and Save without it turns it red. */
export const ExchangeNoRate: Story = {
  args: { form: 'add', rates: 'none' },
  globals: desktop,
  play: async () => {
    const form = await openTransfer('100');
    await userEvent.click(within(form).getByRole('button', { name: 'Save transfer' }));
    await expect(within(form).getByLabelText('To Mono black')).toHaveAttribute('aria-invalid');
  },
};

/** A row opens "Edit exchange", with the bank's figure kept. */
export const EditExchangeDesktop: Story = { args: { form: 'edit-exchange' }, globals: desktop };

/** Delete says what both balances go back to. */
export const DeleteExchangeAsks: Story = {
  args: { form: 'edit-exchange' },
  globals: desktop,
  play: async () => {
    const form = await within(document.body).findByRole('dialog', { name: 'Edit exchange' });
    await userEvent.click(
      await within(form).findByRole('button', { name: 'Delete this exchange' }),
    );
    await expect(
      await within(document.body).findByRole('dialog', { name: 'Delete this exchange?' }),
    ).toHaveTextContent('Mono black to');
  },
};

/** Types a note into the form's Note field (I-017), as the person would. */
async function typeNote(text: string) {
  const form = await within(document.body).findByRole('dialog', { name: 'Add expense' });
  const note = await within(form).findByLabelText('Note');
  await userEvent.type(note, text);
  return form;
}

/**
 * The earlier notes under the Note field on the phone (I-017): the app's keys fold away for the phone's keyboard, the
 * field scrolls to the top and the list hangs under it, the notes that start with "si" first.
 */
export const NoteSuggestionsPhone: Story = {
  args: { form: 'add' },
  play: async () => {
    await typeNote('si');
    const list = await within(document.body).findByRole('listbox', {
      name: 'Notes you used before',
    });
    await expect(
      within(list)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual([
      'Silpo',
      'Simcard top-up',
      'Silpo, wine for Friday',
      'Physio session',
      'Kids’ music lesson',
    ]);
  },
};

export const NoteSuggestionsPhoneDark: Story = {
  ...NoteSuggestionsPhone,
  globals: { colorScheme: 'dark' },
};

/** The desktop: a dropdown under the field, ↓ ↑ move through it. */
export const NoteSuggestionsDesktop: Story = {
  args: { form: 'add' },
  globals: desktop,
  play: async () => {
    await typeNote('si');
    await within(document.body).findByRole('listbox', { name: 'Notes you used before' });
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
  },
};

export const NoteSuggestionsDesktopDark: Story = {
  ...NoteSuggestionsDesktop,
  globals: { ...desktop, colorScheme: 'dark' },
};

/** Ukrainian: case ignored, АТБ first. */
export const NoteSuggestionsUkrainian: Story = {
  args: { form: 'add' },
  globals: desktop,
  play: async () => {
    await typeNote('ат');
    await expect(
      await within(document.body).findByRole('option', { name: 'АТБ' }),
    ).toBeInTheDocument();
  },
};

/** No earlier note has it: no list at all. */
export const NoteSuggestionsNone: Story = {
  args: { form: 'add', notes: 'none' },
  globals: desktop,
  play: async () => {
    await typeNote('si');
    await expect(within(document.body).queryByRole('listbox')).not.toBeInTheDocument();
  },
};

/** The notes still loading: no spinner, no list until they come. */
export const NoteSuggestionsLoading: Story = {
  args: { form: 'add', notes: 'loading' },
  play: async () => {
    await typeNote('si');
    await expect(within(document.body).queryByRole('listbox')).not.toBeInTheDocument();
  },
};
