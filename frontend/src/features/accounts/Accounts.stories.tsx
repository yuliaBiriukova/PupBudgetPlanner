import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { MockFetch, type MockRoutes } from '../../test/mockFetch';
import { AccountsPage } from './AccountsPage';
import { EMPTY, OVERVIEW } from './accountsTestData';

interface ScreenProps {
  data?: 'accounts' | 'empty' | 'loading' | 'error';
  groupBy?: 'currency' | 'source';
}

/** The Accounts page with a fake API (F-014). */
function AccountsScreen({ data = 'accounts', groupBy = 'currency' }: ScreenProps) {
  localStorage.setItem('pup.accounts.groupBy', groupBy);
  const routes: MockRoutes = {
    '/api/accounts':
      data === 'loading'
        ? 'pending'
        : data === 'error'
          ? { status: 500 }
          : { json: data === 'empty' ? EMPTY : OVERVIEW },
  };

  // In <main>, as in the app shell: the page's header isn't the document's banner
  return (
    <MockFetch routes={routes}>
      <main>
        <AccountsPage />
      </main>
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
    await expect(await canvas.findByRole('group', { name: 'Totals' })).toHaveTextContent(
      '310 132.20 ₴',
    );
  },
};

export const ByCurrencyPhoneDark: Story = { globals: { colorScheme: 'dark' } };

export const ByCurrencyDesktop: Story = { globals: desktop };

export const ByCurrencyDesktopDark: Story = { globals: { ...desktop, colorScheme: 'dark' } };

export const BySourcePhone: Story = { args: { groupBy: 'source' } };

export const BySourceDesktop: Story = { args: { groupBy: 'source' }, globals: desktop };

export const BySourceDesktopDark: Story = {
  args: { groupBy: 'source' },
  globals: { ...desktop, colorScheme: 'dark' },
};

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
      '$12.40 left',
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
    await expect(
      within(form).getByText('Enter an amount like 1240.50 or −300.'),
    ).toBeInTheDocument();
  },
};

/** Edit: the card shows the balance now; Archive sits with the buttons. */
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
    ).toHaveTextContent('It still has $1 240.00.');
  },
};
