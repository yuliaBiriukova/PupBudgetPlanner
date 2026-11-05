import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../../app/AppProviders';
import { setScreenWidth } from '../../test/screen';
import { CurrencyPicker } from './CurrencyPicker';

describe('CurrencyPicker', () => {
  it("gives the desktop list's scroll bar a gutter of its own, beside the rows (B-005)", async () => {
    setScreenWidth(1280);
    render(
      <AppProviders env="test">
        <CurrencyPicker
          value="UAH"
          onChange={vi.fn()}
          currencies={['UAH', 'USD', 'EUR', 'PLN']}
          yours={['UAH']}
          label="Currency"
          sheetTitle="Currency"
        />
      </AppProviders>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Currency' }));
    const list = await screen.findByRole('dialog', { name: 'Currency' });
    expect(list.querySelector('[data-scrollarea-viewport]')).toHaveAttribute(
      'data-offset-scrollbars',
      'present',
    );
  });
});
