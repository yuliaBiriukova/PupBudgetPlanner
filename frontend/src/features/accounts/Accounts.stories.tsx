import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { MockFetch, type MockRoutes } from '../../test/mockFetch';
import { DEFAULT_CATEGORIES } from '../categories/categoriesTestData';
import { TransactionFormProvider } from '../transactions/TransactionFormProvider';
import { SUGGESTIONS } from '../transactions/transactionsTestData';
import { AccountsPage } from './AccountsPage';
import type { AccountsTotal, RatesStatus } from './accountsApi';
import { EMPTY, OVERVIEW, TOTAL } from './accountsTestData';

interface ScreenProps {
  data?: 'accounts' | 'hryvnias' | 'empty' | 'loading' | 'error';
  groupBy?: 'currency' | 'source';
  /** "In total, in UAH" (F-017): today's rates, earlier ones and why, none, or still loading. */
  rates?: RatesStatus | 'loading';
}

/** Accounts in hryvnias only: one total, no rates. */
const HRYVNIAS = {
  ...OVERVIEW,
  accounts: OVERVIEW.accounts.filter((account) => account.currency === 'UAH'),
  totals: OVERVIEW.totals.filter((total) => total.currency === 'UAH'),
};

function totalOf(data: ScreenProps['data'], rates: RatesStatus): AccountsTotal {
  if (data === 'hryvnias')
    return { currency: 'UAH', total: 310133, ratesDate: null, status: 'Current', rates: [] };
  if (rates === 'Missing')
    return { currency: 'UAH', total: null, ratesDate: null, status: 'Missing', rates: [] };
  return rates === 'Current' ? TOTAL : { ...TOTAL, status: rates, ratesDate: '2026-10-29' };
}

/** The Accounts page with a fake API (F-014). */
function AccountsScreen({
  data = 'accounts',
  groupBy = 'currency',
  rates = 'Current',
}: ScreenProps) {
  localStorage.setItem('pup.accounts.groupBy', groupBy);
  const routes: MockRoutes = {
    '/api/accounts':
      data === 'loading'
        ? 'pending'
        : data === 'error'
          ? { status: 500 }
          : { json: data === 'empty' ? EMPTY : data === 'hryvnias' ? HRYVNIAS : OVERVIEW },
    '/api/accounts/total': rates === 'loading' ? 'pending' : { json: totalOf(data, rates) },
    // The + on a card opens the quick-add form (F-018)
    '/api/categories': { json: DEFAULT_CATEGORIES },
    '/api/transactions/suggestions': { json: SUGGESTIONS },
  };

  // In <main>, as in the app shell: the page's header isn't the document's banner
  return (
    <MockFetch routes={routes}>
      <TransactionFormProvider>
        <main>
          <AccountsPage />
        </main>
      </TransactionFormProvider>
    </MockFetch>
  );
}

const desktop = { viewport: { value: 'desktop', isRotated: false } };

const meta = {
  title: 'Accounts/Accounts page',
  component: AccountsScreen,
  args: {},
} satisfies Meta<typeof AccountsScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ByCurrencyPhone: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const totals = await canvas.findByRole('group', { name: 'Totals' });
    await expect(await within(totals).findByText('403 744 ₴')).toBeInTheDocument();
    await expect(totals).toHaveTextContent('310 133 ₴');
  },
};

export const ByCurrencyPhoneDark: Story = { globals: { colorScheme: 'dark' } };

export const ByCurrencyDesktop: Story = { globals: desktop };

export const ByCurrencyDesktopDark: Story = { globals: { ...desktop, colorScheme: 'dark' } };

/** The + on a card adds a transaction from that account (F-018). */
export const AddFromCard: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Add a transaction from Privat card' }),
    );
    const form = await within(document.body).findByRole('dialog', { name: 'Add expense' });
    await expect(await within(form).findByRole('button', { name: /^Account:/ })).toHaveTextContent(
      'Privat card',
    );
  },
};

export const BySourcePhone: Story = { args: { groupBy: 'source' } };

export const BySourceDesktop: Story = { args: { groupBy: 'source' }, globals: desktop };

export const BySourceDesktopDark: Story = {
  args: { groupBy: 'source' },
  globals: { ...desktop, colorScheme: 'dark' },
};

/** F-014's "Total: earlier rates": today's NBU rates aren't out yet (F-017). */
export const TotalEarlierRates: Story = {
  args: { rates: 'NotPublished' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText(
        'NBU hasn’t published today’s rates yet. At the rates of 29 Oct 2026:',
      ),
    ).toBeInTheDocument();
  },
};

export const TotalEarlierRatesDesktopDark: Story = {
  ...TotalEarlierRates,
  globals: { ...desktop, colorScheme: 'dark' },
};

/** The NBU can't be reached: the latest earlier rates, saying why. */
export const TotalNbuUnavailable: Story = { args: { rates: 'Unavailable' }, globals: desktop };

/** No rates at all: no grand total, each currency's total still there. */
export const TotalNoRates: Story = { args: { rates: 'Missing' } };

export const TotalNoRatesDesktopDark: Story = {
  args: { rates: 'Missing' },
  globals: { ...desktop, colorScheme: 'dark' },
};

/** The accounts are in, the NBU rates still on their way. */
export const TotalLoading: Story = { args: { rates: 'loading' } };

/** Hryvnias only: one total, no rates. */
export const TotalHryvniasOnly: Story = { args: { data: 'hryvnias' }, globals: desktop };

export const FirstVisit: Story = { args: { data: 'empty' } };

export const Loading: Story = { args: { data: 'loading' } };

export const CouldNotLoad: Story = { args: { data: 'error' } };

/** Archived accounts opened under the list: the balance shows only when it isn't zero. */
export const ArchivedOpen: Story = {
  globals: desktop,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: /Archived/ }));
    await expect(canvas.getByText('Old Privat dollars').closest('li')).toHaveTextContent(
      '$12 left',
    );
  },
};

/** New account: the card and its four styles on top of the form. */
export const NewAccount: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('group', { name: 'Totals' });
    await userEvent.click(canvas.getByRole('button', { name: 'Add account' }));
    const body = within(canvasElement.ownerDocument.body);
    await expect(await body.findByRole('radio', { name: 'Solid' })).toBeChecked();
  },
};

export const NewAccountDesktopDark: Story = {
  ...NewAccount,
  globals: { ...desktop, colorScheme: 'dark' },
};

/** From the dollars' ghost card: USD already picked; the currency list searched by name. */
export const NewFromGroupCurrencyList: Story = {
  globals: desktop,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: 'Add USD account' }));
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole('button', { name: 'Currency' }));
    await userEvent.type(body.getByLabelText('Search currencies'), 'pou');
    await expect(body.getByText('Pound sterling')).toBeInTheDocument();
  },
};

/** Another bank typed in, with common banks suggested. */
export const NewAnotherBank: Story = {
  globals: desktop,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('group', { name: 'Totals' });
    await userEvent.click(canvas.getByRole('button', { name: 'Add account' }));
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole('button', { name: 'Another bank' }));
    await userEvent.type(body.getByLabelText('Bank name'), 'O');
    await expect(body.getByRole('button', { name: 'OTP Bank' })).toBeInTheDocument();
  },
};

/** A new source of your own: the card turns plain. */
export const NewOwnSource: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('group', { name: 'Totals' });
    await userEvent.click(canvas.getByRole('button', { name: 'Add account' }));
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole('button', { name: 'New source' }));
    await userEvent.type(body.getByLabelText('New source'), 'Crypto wallet');
    await expect(body.getByRole('radio', { name: 'Plain' })).toBeChecked();
  },
};

/** Add account with no name, an empty bank name and a wrong amount: the mistakes under the fields. */
export const NewWithMistakes: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('group', { name: 'Totals' });
    await userEvent.click(canvas.getByRole('button', { name: 'Add account' }));
    const body = within(canvasElement.ownerDocument.body);
    const form = await body.findByRole('dialog', { name: 'New account' });
    await userEvent.click(within(form).getByRole('button', { name: 'Another bank' }));
    const opening = within(form).getByLabelText('Opening balance');
    await userEvent.clear(opening);
    await userEvent.type(opening, '1,240.5.0');
    await userEvent.click(within(form).getByRole('button', { name: 'Add account' }));
    await expect(within(form).getByText('Give the account a name.')).toBeInTheDocument();
    await expect(within(form).getByText('Pick your bank or type its name.')).toBeInTheDocument();
    await expect(within(form).getByText('Enter an amount like 1240 or −300.')).toBeInTheDocument();
  },
};

/** A copy of an account in use (I-020): the same name, currency and bank; the name says so. */
export const NewCopy: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('group', { name: 'Totals' });
    await userEvent.click(canvas.getByRole('button', { name: 'Add account' }));
    const body = within(canvasElement.ownerDocument.body);
    const form = await body.findByRole('dialog', { name: 'New account' });
    await userEvent.type(within(form).getByLabelText('Name'), 'Mono black');
    await userEvent.click(within(form).getByRole('button', { name: 'Add account' }));
    await expect(
      within(form).getByText('You already have this account. Give it another name.'),
    ).toBeInTheDocument();
  },
};

export const NewCopyDesktopDark: Story = {
  ...NewCopy,
  globals: { ...desktop, colorScheme: 'dark' },
};

/** Edit: the card shows the balance now; Archive and Delete sit at the end of the form (I-011). */
export const Edit: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: /Mono dollars/ }));
    const body = within(canvasElement.ownerDocument.body);
    await expect(
      await body.findByRole('dialog', { name: 'Edit Mono dollars' }),
    ).toBeInTheDocument();
  },
};

export const EditDesktopDark: Story = { ...Edit, globals: { ...desktop, colorScheme: 'dark' } };

/** Archive asks first, and warns when there is still money on the account. */
export const ArchiveWithMoney: Story = {
  globals: desktop,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: /Mono dollars/ }));
    const body = within(canvasElement.ownerDocument.body);
    const form = await body.findByRole('dialog', { name: 'Edit Mono dollars' });
    await userEvent.click(within(form).getByRole('button', { name: 'Archive' }));
    await expect(
      await body.findByRole('dialog', { name: 'Archive Mono dollars?' }),
    ).toHaveTextContent('It still has $1 240.');
  },
};

/** The end of the edit form (I-011): Archive and Delete, each with a line on what it does. */
export const EditEnd: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: /Mono dollars/ }));
    const body = within(canvasElement.ownerDocument.body);
    const form = await body.findByRole('dialog', { name: 'Edit Mono dollars' });
    const end = within(form).getByRole('region', { name: 'Archive or delete' });
    end.scrollIntoView({ block: 'end' });
    await expect(within(end).getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  },
};

export const EditEndDark: Story = { ...EditEnd, globals: { colorScheme: 'dark' } };

/** Delete from the edit form, with money still on the account: the button waits for the name. */
export const DeleteWithMoney: Story = {
  globals: desktop,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: /Mono dollars/ }));
    const body = within(canvasElement.ownerDocument.body);
    const form = await body.findByRole('dialog', { name: 'Edit Mono dollars' });
    await userEvent.click(within(form).getByRole('button', { name: 'Delete' }));
    const ask = await body.findByRole('dialog', { name: 'Delete Mono dollars?' });
    await expect(ask).toHaveTextContent('It still has $1 240.');
    await expect(within(ask).getByRole('button', { name: 'Delete for good' })).toBeDisabled();
  },
};

export const DeleteWithMoneyPhoneDark: Story = {
  ...DeleteWithMoney,
  globals: { colorScheme: 'dark' },
};

/** The name typed (any case): Delete for good works. */
export const DeleteNameTyped: Story = {
  play: async (context) => {
    await DeleteWithMoney.play?.(context);
    const body = within(context.canvasElement.ownerDocument.body);
    const ask = await body.findByRole('dialog', { name: 'Delete Mono dollars?' });
    await userEvent.type(within(ask).getByRole('textbox'), 'mono dollars');
    await expect(within(ask).getByRole('button', { name: 'Delete for good' })).toBeEnabled();
  },
};

/** Delete from Archived, nothing left on the account: no money line. */
export const DeleteFromArchived: Story = {
  globals: desktop,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: /Archived/ }));
    await userEvent.click(canvas.getByRole('button', { name: 'Delete Oschad salary card' }));
    const body = within(canvasElement.ownerDocument.body);
    const ask = await body.findByRole('dialog', { name: 'Delete Oschad salary card?' });
    await expect(ask).not.toHaveTextContent('It still has');
  },
};

export const DeleteFromArchivedPhoneDark: Story = {
  ...DeleteFromArchived,
  globals: { colorScheme: 'dark' },
};
