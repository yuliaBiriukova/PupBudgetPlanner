import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw/http';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LOADED, renderApp } from '../../test/render';
import { setScreenWidth } from '../../test/screen';
import { server } from '../../test/server';
import { JARS, OVERVIEW_WITH_JARS, TOTAL_WITH_JARS } from './jarsTestData';

/** A jar on the shelf, by the start of its name. */
async function tileOf(name: string) {
  const tile = (await screen.findAllByTestId('jar-tile', {}, LOADED)).find((item) =>
    item.textContent.startsWith(name),
  );
  if (!tile) throw new Error(`No jar ${name}`);
  return tile;
}

/** The API with Olena's jars and accounts; keeps what the page sends. */
function jarsServer() {
  const sent: { url: string; body: unknown }[] = [];
  server.use(
    http.get('/api/jars', () => HttpResponse.json(JARS)),
    http.get('/api/accounts', () => HttpResponse.json(OVERVIEW_WITH_JARS)),
    http.get('/api/accounts/total', () => HttpResponse.json(TOTAL_WITH_JARS)),
    http.get('/api/rates', () =>
      HttpResponse.json({
        date: '2026-11-17',
        status: 'Current',
        rates: [{ currency: 'USD', rate: 41.35 }],
      }),
    ),
    http.post('/api/jars/:id/moves', async ({ request, params }) => {
      sent.push({ url: `/api/jars/${String(params.id)}/moves`, body: await request.json() });
      return HttpResponse.json(JARS.find((jar) => jar.id === params.id));
    }),
    http.post('/api/jars/:id/close', ({ params }) => {
      sent.push({ url: `/api/jars/${String(params.id)}/close`, body: null });
      return new HttpResponse(null, { status: 204 });
    }),
  );
  return sent;
}

beforeEach(() => {
  setScreenWidth(1440);
  document.cookie = 'XSRF-TOKEN=token-from-the-api; path=/';
});

afterEach(() => {
  document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
});

describe('the Jars page', () => {
  it('shows what is set aside and free, each jar on the shelf, and where the jar money lies', async () => {
    jarsServer();
    renderApp('/jars');

    expect(await screen.findByTestId('jars-set-aside', {}, LOADED)).toHaveTextContent('339 890 ₴');
    expect(screen.getByTestId('jars-free')).toHaveTextContent(/^\d/);
    const tiles = await screen.findAllByTestId('jar-tile');
    expect(tiles.map((tile) => tile.textContent.replace(/\s/g, ' '))).toEqual([
      'Car138 000 ₴34% of 400 000 ₴',
      'Apartment100 000 ₴8% of 1 200 000 ₴',
      'Summer in the Carpathians12 000 ₴30% of 40 000 ₴',
      'Dollar cushion$1 40046% of $3 000',
      'New laptop32 000 ₴Goal reached',
    ]);
    const mono = screen
      .getAllByTestId('jar-money-account')
      .find((row) => row.textContent.startsWith('Mono black'));
    expect(mono).toHaveTextContent('New laptop 32 000 ₴');
    expect(mono).toHaveTextContent('1 789 ₴ of jar money spent');
  });

  it('opens a jar with its pace, this month’s plan and its history, folded', async () => {
    jarsServer();
    renderApp('/jars');

    await userEvent.click(await tileOf('Car'));
    const dialog = await screen.findByRole('dialog', { name: 'Car' });
    expect(dialog).toHaveTextContent('262 000 ₴ to go');
    expect(dialog).toHaveTextContent(/Save 1\d 7\d\d ₴ a month to make it by Dec 2027/);
    expect(dialog).toHaveTextContent('plan: 0 ₴ of 15 000 ₴ set aside');
    expect(dialog).toHaveTextContent('A used Škoda Octavia, about 2019');
    const history = within(dialog).getByRole('button', { name: /^History/ });
    expect(history).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(history);
    expect(within(dialog).getByText('Taken out to Mono black')).toBeVisible();
  });

  it('puts money in from the account with the most free money, saying when it would be money already spent', async () => {
    const sent = jarsServer();
    renderApp('/jars');

    await userEvent.click(await screen.findByRole('button', { name: 'Put in Car' }, LOADED));
    const dialog = await screen.findByRole('dialog', { name: 'Put into Car' });
    // The deposit has 30 000 ₴ free, Privat 784 ₴, Mono black none
    const from = within(dialog).getByRole('button', { name: /^From:/ });
    await waitFor(() => {
      expect(from).toHaveTextContent('Deposit for the new apartment');
    });
    expect(from).toHaveTextContent('30 000 ₴ free');
    await userEvent.type(within(dialog).getByLabelText('Amount'), '35000');
    expect(dialog).toHaveTextContent(
      'Deposit for the new apartment has 30 000 ₴ free: the rest would be money already spent.',
    );
    await userEvent.click(within(dialog).getByRole('button', { name: /^Put in 35.000/ }));

    await waitFor(() => {
      expect(sent).toEqual([
        {
          url: '/api/jars/car/moves',
          body: { action: 'In', accountId: 'deposit', amount: 35_000, toJarId: null },
        },
      ]);
    });
  });

  it('closes a reached jar after asking, saying its money becomes free', async () => {
    const sent = jarsServer();
    renderApp('/jars');

    await userEvent.click(await tileOf('New laptop'));
    const dialog = await screen.findByRole('dialog', { name: 'New laptop' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close jar' }));
    const confirm = await screen.findByRole('dialog', { name: 'Close New laptop?' });
    expect(confirm).toHaveTextContent('The 32 000 ₴ in it becomes free to spend on its accounts.');
    await userEvent.click(within(confirm).getByRole('button', { name: 'Close jar' }));

    await waitFor(() => {
      expect(sent).toEqual([{ url: '/api/jars/laptop/close', body: null }]);
    });
  });
});
