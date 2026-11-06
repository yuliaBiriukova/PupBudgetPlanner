import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';
import { CurrencyPicker } from './CurrencyPicker';

const CURRENCIES = ['UAH', 'AUD', 'CAD', 'CHF', 'CZK', 'EUR', 'GBP', 'JPY', 'PLN', 'USD'];

interface PickerProps {
  value?: string;
  /** Settings' look: no label above, "Another currency" until one from the list is picked. */
  settings?: boolean;
  /** The Reports page's look: a filter pill with the code (F-022). */
  pill?: boolean;
}

/** A currency field with its list (F-016): a dropdown on the desktop, a sheet on the phone. */
function Picker({ value: start = 'UAH', settings = false, pill = false }: PickerProps) {
  const [value, setValue] = useState(start);
  const other = !['UAH', 'USD', 'EUR'].includes(value);
  return (
    <div
      style={{
        maxWidth: 480,
        padding: 16,
        display: pill ? 'flex' : undefined,
        justifyContent: 'flex-end',
      }}
    >
      <CurrencyPicker
        label={settings ? 'Another currency' : 'Currency'}
        hideLabel={settings}
        placeholder={settings && !other ? 'Another currency' : undefined}
        marked={settings && other}
        value={value}
        onChange={setValue}
        currencies={CURRENCIES}
        yours={['UAH', 'PLN', 'USD']}
        sheetTitle={settings ? 'Report currency' : 'Currency'}
        pill={pill}
      />
    </div>
  );
}

const desktop = { viewport: { value: 'desktop', isRotated: false } };

const meta = {
  title: 'Shared/Currency picker',
  component: Picker,
  args: {},
} satisfies Meta<typeof Picker>;

export default meta;

type Story = StoryObj<typeof meta>;

/** As in the account form. */
export const Field: Story = {};

export const SettingsPlaceholder: Story = { args: { settings: true } };

export const SettingsPicked: Story = { args: { settings: true, value: 'PLN' } };

export const SheetOnPhone: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: /Currency/ }));
    await expect(await screen.findByRole('list', { name: 'Yours' })).toBeVisible();
  },
};

export const SheetOnPhoneDark: Story = { ...SheetOnPhone, globals: { colorScheme: 'dark' } };

export const DropdownOnDesktop: Story = { ...SheetOnPhone, globals: desktop };

export const DropdownOnDesktopDark: Story = {
  ...SheetOnPhone,
  globals: { ...desktop, colorScheme: 'dark' },
};

/** A search with two matches: the dropdown is as tall as its rows. */
export const Searching: Story = {
  globals: desktop,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: /Currency/ }));
    await userEvent.type(await screen.findByLabelText('Search currencies'), 'dollar');
    await expect(screen.getByRole('button', { name: /CAD/ })).toBeVisible();
  },
};

/** Typed with the keys alone, no click into the search (B-004): the first match is marked, ↓ moves the mark. */
export const TypingWithTheKeys: Story = {
  globals: desktop,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: /Currency/ }));
    const search = await screen.findByLabelText('Search currencies');
    await waitFor(async () => {
      await expect(search).toHaveFocus();
    });
    await userEvent.keyboard('dol{ArrowDown}');
    await expect(screen.getByRole('button', { name: /^AUD/ })).toHaveAttribute('data-active');
  },
};

export const NothingFound: Story = {
  globals: desktop,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: /Currency/ }));
    await userEvent.type(await screen.findByLabelText('Search currencies'), 'rouble');
    await expect(screen.getByText(/No currency matches/)).toBeVisible();
  },
};

/** The Reports page's report currency (F-022): the filter pill, the list 300 px wide under its end. */
export const Pill: Story = {
  args: { pill: true },
  globals: desktop,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: /^Currency: UAH/ }));
    await expect(await screen.findByRole('list', { name: 'Yours' })).toBeVisible();
  },
};

export const PillOnPhone: Story = { args: { pill: true } };
