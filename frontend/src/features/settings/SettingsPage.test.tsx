import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw/http';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LOADED, renderApp } from '../../test/render';
import { setScreenWidth } from '../../test/screen';
import { server } from '../../test/server';
import type { AccountsTotal } from '../accounts/accountsApi';
import { OVERVIEW } from '../accounts/accountsTestData';
import type { UserSettings } from './settingsApi';

/** NBU rates, hryvnias for one unit; the accounts come to 400 000 ₴. */
const RATES: Record<string, number> = { UAH: 1, USD: 40, EUR: 50, PLN: 10 };
const IN_HRYVNIAS = 400_000;

/** The total as the API gives it in the report currency, with the rates it used in hryvnias. */
function totalIn(currency: string): AccountsTotal {
  const used = ['USD', 'EUR', 'PLN', currency].filter((code, i, all) => all.indexOf(code) === i);
  return {
    currency,
    total: IN_HRYVNIAS / (RATES[currency] ?? 1),
    ratesDate: '2026-10-31',
    status: 'Current',
    rates: used
      .filter((code) => code !== 'UAH')
      .map((code) => ({ currency: code, rate: RATES[code] ?? 0 })),
  };
}

/** The API with Olena's settings; returns what the page sent. `failOnce` fails the first save. */
function settingsServer({ failOnce = false } = {}) {
  const sent: { url: string; body: unknown }[] = [];
  let settings: UserSettings = {
    displayName: 'Olena',
    email: 'olena@example.com',
    reportCurrency: 'UAH',
  };
  let fail = failOnce;
  const save =
    (change: (body: Record<string, string>) => void) =>
    async ({ request }: { request: Request }) => {
      const body = (await request.json()) as Record<string, string>;
      sent.push({ url: new URL(request.url).pathname, body });
      if (fail) {
        fail = false;
        return new HttpResponse(null, { status: 503 });
      }
      change(body);
      return HttpResponse.json(settings);
    };
  server.use(
    http.get('/api/settings', () => HttpResponse.json(settings)),
    http.get('/api/accounts', () => HttpResponse.json(OVERVIEW)),
    http.get('/api/accounts/total', () => HttpResponse.json(totalIn(settings.reportCurrency))),
    http.put(
      '/api/settings/name',
      save((body) => {
        settings = { ...settings, displayName: body.displayName ?? '' };
      }),
    ),
    http.put(
      '/api/settings/report-currency',
      save((body) => {
        settings = { ...settings, reportCurrency: body.currency ?? '' };
      }),
    ),
  );
  return sent;
}

const currencyGroup = () => screen.getByRole('radiogroup', { name: 'Report currency' });
const themeGroup = () => screen.getByRole('radiogroup', { name: 'Theme' });
const anotherCurrency = () => screen.getByRole('button', { name: /Another currency/ });

beforeEach(() => {
  setScreenWidth(1440);
  document.cookie = 'XSRF-TOKEN=token-from-the-api; path=/';
});

afterEach(() => {
  document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  localStorage.clear();
});

describe('the Settings page', () => {
  it('shows the name, the email, the report currency with the total in it, and the theme', async () => {
    settingsServer();
    renderApp('/settings');

    expect(await screen.findByLabelText('Name', {}, LOADED)).toHaveValue('Olena');
    expect(screen.getByText('olena@example.com')).toBeInTheDocument();
    expect(screen.getByText('Can’t be changed yet.')).toBeInTheDocument();
    expect(within(currencyGroup()).getByRole('radio', { name: 'Hryvnia' })).toBeChecked();
    expect(anotherCurrency()).toHaveTextContent('Another currency');
    expect(await screen.findByText('400 000 ₴')).toBeInTheDocument();
    expect(screen.getByText(/\$1 = 40\.00 ₴/)).toBeInTheDocument();
    expect(within(themeGroup()).getByRole('radio', { name: 'System' })).toBeChecked();
    // Nothing to save until the name changes
    expect(screen.queryByRole('button', { name: 'Save name' })).not.toBeInTheDocument();
  });

  it('saves a new name, trimmed', async () => {
    const sent = settingsServer();
    renderApp('/settings');

    const name = await screen.findByLabelText('Name', {}, LOADED);
    await userEvent.clear(name);
    await userEvent.type(name, '  Olena K.  ');
    await userEvent.click(screen.getByRole('button', { name: 'Save name' }));

    expect(await screen.findByText('Name saved')).toBeInTheDocument();
    expect(sent).toEqual([{ url: '/api/settings/name', body: { displayName: 'Olena K.' } }]);
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Save name' })).not.toBeInTheDocument();
    });
  });

  it('asks for a name instead of saving an empty one, and Cancel puts the saved one back', async () => {
    const sent = settingsServer();
    renderApp('/settings');

    const name = await screen.findByLabelText('Name', {}, LOADED);
    await userEvent.clear(name);
    await userEvent.click(screen.getByRole('button', { name: 'Save name' }));

    expect(screen.getByText('Enter your name.')).toBeInTheDocument();
    expect(sent).toEqual([]);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(name).toHaveValue('Olena');
  });

  it('saves US dollars the moment they are picked, and shows the total in them', async () => {
    const sent = settingsServer();
    renderApp('/settings');

    await screen.findByText('400 000 ₴', {}, LOADED);
    await userEvent.click(within(currencyGroup()).getByRole('radio', { name: 'US dollar' }));

    expect(await screen.findByText('Totals are now in USD')).toBeInTheDocument();
    expect(sent).toEqual([{ url: '/api/settings/report-currency', body: { currency: 'USD' } }]);
    expect(await screen.findByText('$10 000')).toBeInTheDocument();
    expect(within(currencyGroup()).getByRole('radio', { name: 'US dollar' })).toBeChecked();
  });

  it('picks any other currency from the list, your own first', async () => {
    const sent = settingsServer();
    renderApp('/settings');

    await screen.findByText('400 000 ₴', {}, LOADED);
    await userEvent.click(anotherCurrency());
    const list = screen.getByRole('dialog', { name: 'Report currency' });
    const yours = within(list).getByRole('list', { name: 'Yours' });
    expect(
      within(yours)
        .getAllByRole('button')
        .map((item) => item.textContent),
    ).toEqual(['UAHUkrainian hryvnia', 'EUREuro', 'PLNPolish zloty', 'USDUS dollar']);
    await userEvent.type(within(list).getByLabelText('Search currencies'), 'zlo');
    await userEvent.click(within(list).getByRole('button', { name: /PLN\s*Polish zloty/ }));

    expect(await screen.findByText('Totals are now in PLN')).toBeInTheDocument();
    expect(sent).toEqual([{ url: '/api/settings/report-currency', body: { currency: 'PLN' } }]);
    expect(anotherCurrency()).toHaveTextContent('PLNPolish zloty');
    expect(within(currencyGroup()).queryByRole('radio', { checked: true })).not.toBeInTheDocument();
    expect(await screen.findByText('40 000 PLN')).toBeInTheDocument();
  });

  it('says when the currency couldn’t be saved, puts the saved one back, and tries again', async () => {
    const sent = settingsServer({ failOnce: true });
    renderApp('/settings');

    await screen.findByText('400 000 ₴', {}, LOADED);
    await userEvent.click(within(currencyGroup()).getByRole('radio', { name: 'Euro' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Couldn’t save the currency.');
    expect(within(currencyGroup()).getByRole('radio', { name: 'Hryvnia' })).toBeChecked();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Totals are now in EUR')).toBeInTheDocument();
    expect(sent.map((request) => request.body)).toEqual([{ currency: 'EUR' }, { currency: 'EUR' }]);
    // The notification is an alert too: the error's own text is what must be gone
    expect(screen.queryByText(/Couldn’t save the currency/)).not.toBeInTheDocument();
  });

  it('switches the theme on this device', async () => {
    settingsServer();
    renderApp('/settings');

    await userEvent.click(
      within(await screen.findByRole('radiogroup', { name: 'Theme' }, LOADED)).getByRole('radio', {
        name: 'Dark',
      }),
    );

    expect(within(themeGroup()).getByRole('radio', { name: 'Dark' })).toBeChecked();
    expect(document.documentElement).toHaveAttribute('data-mantine-color-scheme', 'dark');
  });

  it('says when the settings couldn’t be loaded, and tries again', async () => {
    let fail = true;
    settingsServer();
    server.use(
      http.get('/api/settings', () => {
        if (fail) {
          fail = false;
          return new HttpResponse(null, { status: 503 });
        }
        return HttpResponse.json({
          displayName: 'Olena',
          email: 'olena@example.com',
          reportCurrency: 'UAH',
        });
      }),
    );
    renderApp('/settings');

    expect(await screen.findByRole('alert', {}, LOADED)).toHaveTextContent(
      'Couldn’t load your settings.',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByLabelText('Name')).toHaveValue('Olena');
  });
});
