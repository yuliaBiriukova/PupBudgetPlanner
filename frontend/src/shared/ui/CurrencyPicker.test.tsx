import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../../app/AppProviders';
import { setScreenWidth } from '../../test/screen';
import { CurrencyPicker } from './CurrencyPicker';
import { ResponsiveDialog } from './ResponsiveDialog';

const picker = (onChange = vi.fn()) => (
  <CurrencyPicker
    value="UAH"
    onChange={onChange}
    currencies={['UAH', 'USD', 'EUR', 'PLN', 'AUD', 'CAD']}
    yours={['UAH', 'USD']}
    label="Currency"
    sheetTitle="Currency"
  />
);

/**
 * The account form's picker in its dialog, with Mantine's real transitions: `env="test"` draws pop-ups at once, which
 * hid B-004 (the desktop dropdown is drawn a frame after it is opened).
 */
const inDialog = (onChange = vi.fn(), onClose = vi.fn()) =>
  render(
    <AppProviders>
      <ResponsiveDialog opened onClose={onClose} title="New account">
        {picker(onChange)}
      </ResponsiveDialog>
    </AppProviders>,
  );

/**
 * The desktop dropdown's search and rows. jsdom has no layout, so with real transitions Floating UI takes the button for
 * scrolled away and hides the dropdown (`visibility: hidden`): the queries look at hidden elements too. The E2E test
 * types into it in a real browser.
 */
const searchBox = () => screen.findByRole('searchbox', { name: 'Search currencies', hidden: true });
const row = (code: string) =>
  screen.getByRole('button', { name: new RegExp(`^${code}`), hidden: true });

describe('CurrencyPicker', () => {
  it("gives the desktop list's scroll bar a gutter of its own, beside the rows (B-005)", async () => {
    setScreenWidth(1280);
    render(<AppProviders env="test">{picker()}</AppProviders>);

    await userEvent.click(screen.getByRole('button', { name: 'Currency' }));
    const list = await screen.findByRole('dialog', { name: 'Currency' });
    expect(list.querySelector('[data-scrollarea-viewport]')).toHaveAttribute(
      'data-offset-scrollbars',
      'present',
    );
  });

  it('types into the desktop search as soon as the list opens, and Enter picks the first match (B-004)', async () => {
    setScreenWidth(1280);
    const onChange = vi.fn();
    inDialog(onChange);

    await userEvent.click(await screen.findByRole('button', { name: 'Currency' }));
    const search = await searchBox();
    await waitFor(() => {
      expect(search).toHaveFocus();
    });
    // The keys alone, no click into the search first
    await userEvent.keyboard('pln');

    expect(search).toHaveValue('pln');
    expect(row('PLN')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^EUR/, hidden: true })).not.toBeInTheDocument();
    await userEvent.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith('PLN');
  });

  it('puts the search in focus in the phone sheet, not its close button (B-004)', async () => {
    setScreenWidth(375);
    render(<AppProviders>{picker()}</AppProviders>);

    await userEvent.click(screen.getByRole('button', { name: 'Currency' }));
    const search = await searchBox();
    // The sheet focuses its first field a moment after it opens
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(search).toHaveFocus();
  });

  it('marks your currencies first, ↓ ↑ move the mark, Enter picks it', async () => {
    setScreenWidth(1280);
    const onChange = vi.fn();
    inDialog(onChange);

    await userEvent.click(await screen.findByRole('button', { name: 'Currency' }));
    const search = await searchBox();
    await waitFor(() => {
      expect(search).toHaveFocus();
    });
    await userEvent.keyboard('dol');

    // US dollar is yours, so it comes and is marked first
    expect(row('USD')).toHaveAttribute('data-active');
    expect(search).toHaveAttribute('aria-activedescendant', row('USD').id);
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowUp}');
    expect(row('AUD')).toHaveAttribute('data-active');
    expect(row('USD')).not.toHaveAttribute('data-active');
    await userEvent.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith('AUD');
  });

  it('closes the list with Escape and leaves the dialog open', async () => {
    setScreenWidth(1280);
    const onClose = vi.fn();
    inDialog(vi.fn(), onClose);

    await userEvent.click(await screen.findByRole('button', { name: 'Currency' }));
    const search = await searchBox();
    await waitFor(() => {
      expect(search).toHaveFocus();
    });
    await userEvent.keyboard('{Escape}');

    await waitFor(() => {
      expect(
        screen.queryByRole('searchbox', { name: 'Search currencies' }),
      ).not.toBeInTheDocument();
    });
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Currency' })).toHaveFocus();
  });
});
