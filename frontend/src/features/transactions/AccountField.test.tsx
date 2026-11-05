import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../../app/AppProviders';
import { account } from '../accounts/accountsTestData';
import { AccountList } from './AccountField';

const bank = (name: string) =>
  ({ source: 'Bank', bankId: `b-${name}`, bankName: name, cardStyle: 'Solid' }) as const;

/** Three "Mono", one a currency, oldest first; the dollar one used last, the euro one never. */
const ACCOUNTS = [
  account('mono', 'Mono', {
    ...bank('Monobank'),
    balance: 18420,
    lastUsedAt: '2026-11-04T12:05:00+00:00',
  }),
  account('mono-usd', 'Mono', {
    ...bank('Monobank'),
    currency: 'USD',
    balance: 640,
    lastUsedAt: '2026-11-05T09:12:00+00:00',
  }),
  account('mono-eur', 'Mono', { ...bank('Monobank'), currency: 'EUR' }),
  account('cash', 'Wallet', { balance: 1260, lastUsedAt: '2026-11-04T18:40:00+00:00' }),
];

describe('AccountList', () => {
  it('shows each account with its bank, balance and currency, the one used last first (I-024)', () => {
    render(
      <AppProviders env="test">
        <AccountList accounts={ACCOUNTS} value="mono" onPick={vi.fn()} />
      </AppProviders>,
    );

    const rows = within(screen.getByRole('list', { name: 'Your accounts' })).getAllByRole('button');
    // The amounts' no-break spaces as plain ones
    expect(rows.map((row) => row.textContent.replace(/\s/g, ' '))).toEqual([
      'Mono Monobank$640USD',
      'Wallet Cash1 260 ₴UAH',
      'Mono Monobank18 420 ₴UAH',
      'Mono Monobank€0EUR',
    ]);
    expect(rows[2]).toHaveAttribute('aria-pressed', 'true');
  });

  it('picks the account of the row, whichever currency it is in', async () => {
    const onPick = vi.fn();
    render(
      <AppProviders env="test">
        <AccountList accounts={ACCOUNTS} value="mono" onPick={onPick} />
      </AppProviders>,
    );

    await userEvent.click(screen.getByRole('button', { name: /Mono Monobank\$640\s*USD/ }));

    expect(onPick).toHaveBeenCalledWith('mono-usd');
  });
});
