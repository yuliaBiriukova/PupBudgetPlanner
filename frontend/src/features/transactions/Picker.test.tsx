import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../../app/AppProviders';
import { setScreenWidth } from '../../test/screen';
import { Picker } from './Picker';

describe('Picker', () => {
  it("gives the desktop list's scroll bar a gutter of its own, beside the rows (B-005)", async () => {
    setScreenWidth(1280);
    render(
      <AppProviders env="test">
        <Picker
          opened
          onClose={vi.fn()}
          title="Account"
          target={<button type="button">Account</button>}
          listHeight={344}
        >
          <ul>
            <li>Mono black</li>
          </ul>
        </Picker>
      </AppProviders>,
    );

    const list = await screen.findByRole('dialog', { name: 'Account' });
    // Mantine's gutter while the list scrolls: the bar isn't drawn over the balances at the rows' right
    expect(list.querySelector('[data-scrollarea-viewport]')).toHaveAttribute(
      'data-offset-scrollbars',
      'present',
    );
  });
});
