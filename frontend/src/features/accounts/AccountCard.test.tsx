import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../../app/AppProviders';
import { AccountCard } from './AccountCard';

const renderUi = (ui: ReactNode) => render(<AppProviders env="test">{ui}</AppProviders>);

describe('the account card', () => {
  it('has a split edge of its own that adds a transaction, next to the card that opens the account', async () => {
    const onClick = vi.fn();
    const onAdd = vi.fn();
    renderUi(
      <AccountCard
        name="Mono black"
        meta="Monobank"
        balance={48211}
        currency="UAH"
        cardStyle="Solid"
        onClick={onClick}
        onAdd={onAdd}
        addLabel="Add a transaction from Mono black"
      />,
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'Add a transaction from Mono black' }),
    );
    expect(onAdd).toHaveBeenCalledOnce();
    expect(onClick).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: /^Mono black/ }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('gives the balance its length, so a long one is set smaller next to the edge (B-003)', () => {
    renderUi(
      <AccountCard
        name="Deposit"
        balance={-1250000}
        currency="UAH"
        cardStyle="Plain"
        onAdd={vi.fn()}
        addLabel="Add a transaction from Deposit"
      />,
    );

    const balance = screen.getByText('−1 250 000 ₴');
    expect(balance.style.getPropertyValue('--chars')).toBe('12');
  });
});
