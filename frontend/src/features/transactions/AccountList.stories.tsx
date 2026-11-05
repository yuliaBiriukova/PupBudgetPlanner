import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import type { Account } from '../accounts/accountsApi';
import { account } from '../accounts/accountsTestData';
import { AccountField } from './AccountField';

const bank = (name: string) =>
  ({ source: 'Bank', bankId: `b-${name}`, bankName: name, cardStyle: 'Solid' }) as const;
const money = (balance: number) => ({ balance, openingBalance: balance });

/**
 * An account per currency in one bank, as people keep them (I-024): three "Mono", two "ФОП", three "Privat", oldest
 * first, each with when its latest transaction was added; "Mono" in euros and "Privat" in dollars never used.
 */
const ACCOUNTS: Account[] = [
  account('mono', 'Mono', {
    ...bank('Monobank'),
    ...money(18420),
    lastUsedAt: '2026-11-04T12:05:00Z',
  }),
  account('mono-usd', 'Mono', {
    ...bank('Monobank'),
    currency: 'USD',
    ...money(640),
    lastUsedAt: '2026-11-05T09:12:00Z',
  }),
  account('mono-eur', 'Mono', { ...bank('Monobank'), currency: 'EUR', ...money(0) }),
  account('fop', 'ФОП', {
    ...bank('Monobank'),
    ...money(52300),
    lastUsedAt: '2026-11-02T10:30:00Z',
  }),
  account('fop-usd', 'ФОП', {
    ...bank('Monobank'),
    currency: 'USD',
    ...money(2110),
    lastUsedAt: '2026-10-14T11:45:00Z',
  }),
  account('privat', 'Privat', {
    ...bank('PrivatBank'),
    ...money(7935),
    lastUsedAt: '2026-10-30T16:20:00Z',
  }),
  account('privat-usd', 'Privat', { ...bank('PrivatBank'), currency: 'USD', ...money(0) }),
  account('privat-eur', 'Privat', {
    ...bank('PrivatBank'),
    currency: 'EUR',
    ...money(215),
    lastUsedAt: '2026-09-03T14:10:00Z',
  }),
  account('cash', 'Wallet', { ...money(1260), lastUsedAt: '2026-11-04T18:40:00Z' }),
  account('cash-usd', 'Dollars at home', {
    currency: 'USD',
    ...money(900),
    lastUsedAt: '2026-10-21T08:00:00Z',
  }),
  account('deposit', 'Deposit for the new apartment', {
    source: 'Own',
    sourceId: 's-deposit',
    sourceName: 'Deposit',
    cardStyle: 'Plain',
    ...money(120000),
    lastUsedAt: '2026-07-01T09:00:00Z',
  }),
];

/** The quick-add form's account field with "Mono" in hryvnias picked; a tap opens the list. */
function Field() {
  const [value, setValue] = useState('mono');
  const picked = ACCOUNTS.find((item) => item.id === value);
  if (!picked) return null;
  return (
    <div style={{ maxWidth: 480, padding: 16 }}>
      <AccountField value={picked} accounts={ACCOUNTS} onChange={setValue} />
    </div>
  );
}

const meta = {
  title: 'Transactions/Account list',
  component: Field,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Field>;

export default meta;

type Story = StoryObj<typeof meta>;

const desktop = { viewport: { value: 'desktop', isRotated: false } };

/**
 * The list opened (I-024): the account used last first, each row the name and its bank (wrapping when it doesn't fit)
 * and the balance with the currency's code, so the three "Mono" are told apart.
 */
export const OpenPhone: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /Mono/ }));
    const list = within(document.body).getByRole('list', { name: 'Your accounts' });
    const rows = within(list).getAllByRole('button');
    await expect(rows[0]).toHaveTextContent(/Mono\s*Monobank\s*\$640\s*USD/);
    await expect(rows[2]).toHaveAttribute('aria-pressed', 'true');
  },
};

export const OpenPhoneDark: Story = { ...OpenPhone, globals: { colorScheme: 'dark' } };

export const OpenDesktop: Story = { ...OpenPhone, globals: desktop };

export const OpenDesktopDark: Story = {
  ...OpenPhone,
  globals: { ...desktop, colorScheme: 'dark' },
};
