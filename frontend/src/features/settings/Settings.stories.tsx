import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef } from 'react';
import { expect, screen, userEvent, within } from 'storybook/test';
import { MockFetch, type MockRoutes } from '../../test/mockFetch';
import { OVERVIEW } from '../accounts/accountsTestData';
import { SettingsPage } from './SettingsPage';

/** NBU rates of the prototype (hryvnias for one unit) and what the accounts come to in hryvnias. */
const RATES: Record<string, number> = { UAH: 1, USD: 45.53, EUR: 48.6, PLN: 11.2 };
const IN_HRYVNIAS = OVERVIEW.totals.reduce(
  (sum, total) => sum + total.total * (RATES[total.currency] ?? 1),
  0,
);

const totalIn = (currency: string) => ({
  currency,
  total: IN_HRYVNIAS / (RATES[currency] ?? 1),
  ratesDate: '2026-10-31',
  status: 'Current',
  rates: ['USD', 'EUR', 'PLN'].map((code) => ({ currency: code, rate: RATES[code] })),
});

interface ScreenProps {
  data?: 'settings' | 'loading' | 'error';
  /** The saved report currency. */
  currency?: string;
  /** Saving fails (Couldn't save). */
  saveFails?: boolean;
}

/** The Settings page with a fake API (F-016). */
function SettingsScreen({ data = 'settings', currency = 'UAH', saveFails = false }: ScreenProps) {
  // What the fake API has saved; changed by the PUTs, read when it answers
  const saved = useRef({ displayName: 'Yulia Biriukova', reportCurrency: currency });
  const settings = () => ({ json: { ...saved.current, email: 'yulia@example.com' } });
  const routes: MockRoutes = {
    '/api/settings': () =>
      data === 'loading' ? 'pending' : data === 'error' ? { status: 500 } : settings(),
    '/api/accounts': { json: OVERVIEW },
    '/api/accounts/total': () => ({ json: totalIn(saved.current.reportCurrency) }),
    'PUT /api/settings/report-currency': (body) => {
      if (saveFails) return { status: 503 };
      saved.current.reportCurrency = (body as { currency: string }).currency;
      return settings();
    },
    'PUT /api/settings/name': (body) => {
      if (saveFails) return { status: 503 };
      saved.current.displayName = (body as { displayName: string }).displayName;
      return settings();
    },
  };

  // In <main>, as in the app shell: the page's header isn't the document's banner
  return (
    <MockFetch routes={routes}>
      <main>
        <SettingsPage />
      </main>
    </MockFetch>
  );
}

const desktop = { viewport: { value: 'desktop', isRotated: false } };

const meta = {
  title: 'Settings/Settings page',
  component: SettingsScreen,
  args: {},
} satisfies Meta<typeof SettingsScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Phone: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByLabelText('Name')).toHaveValue('Yulia Biriukova');
    await expect(canvas.getByRole('radio', { name: 'Hryvnia' })).toBeChecked();
  },
};

export const PhoneDark: Story = { globals: { colorScheme: 'dark' } };

export const Desktop: Story = { globals: desktop };

export const DesktopDark: Story = { globals: { ...desktop, colorScheme: 'dark' } };

/** A name being changed: Cancel and Save name show. */
export const ChangingTheName: Story = {
  globals: desktop,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const name = await canvas.findByLabelText('Name');
    await userEvent.clear(name);
    await userEvent.type(name, 'Yulia B.');
    await expect(canvas.getByRole('button', { name: 'Save name' })).toBeVisible();
  },
};

/** A currency from the list: the field is marked, none of the three is. */
export const AnotherCurrencyPicked: Story = { args: { currency: 'PLN' }, globals: desktop };

export const AnotherCurrencyPickedPhone: Story = { args: { currency: 'PLN' } };

/** The list on the desktop: a dropdown over the page, your currencies first. */
export const CurrencyListDesktop: Story = {
  globals: desktop,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: /Another currency/ }));
    await expect(await screen.findByRole('list', { name: 'Yours' })).toBeVisible();
  },
};

/** The list on the phone: a sheet. */
export const CurrencyListPhone: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: /Another currency/ }));
    await expect(await screen.findByRole('dialog', { name: 'Report currency' })).toBeVisible();
  },
};

export const CouldNotSave: Story = {
  args: { saveFails: true },
  globals: desktop,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('radio', { name: 'Euro' }));
    await expect(await canvas.findByRole('alert')).toHaveTextContent('Couldn’t save the currency');
  },
};

export const Loading: Story = { args: { data: 'loading' } };

export const CouldNotLoad: Story = { args: { data: 'error' } };
