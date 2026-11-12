import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw/http';
import { beforeEach, describe, expect, it } from 'vitest';
import { answer } from '../../test/mockRoutes';
import { LOADED, renderApp } from '../../test/render';
import { setScreenWidth } from '../../test/screen';
import { server } from '../../test/server';
import type { Family } from './familyApi';
import { ANDRIY_ID, IRYNA_ID } from './familyTestData';
import { familyOf, familyViewsRoutes } from './familyViewsFakeApi';
import { WHO_KEY } from './WhoseProvider';

/** The stories' API: each person's money, answering for whose is asked; returns every address asked for. */
function viewsServer(family: Family | null) {
  const routes = familyViewsRoutes(family);
  const asked: URL[] = [];
  server.use(
    http.get('/api/*', ({ request }) => {
      const url = new URL(request.url);
      asked.push(url);
      return answer(routes, 'GET', url, undefined);
    }),
  );
  return asked;
}

/** Whose money the requests to `path` asked for: `me` for none. */
const whoOf = (asked: URL[], path: string) =>
  asked.filter((url) => url.pathname === path).map((url) => url.searchParams.get('who') ?? 'me');

async function pick(name: string) {
  await userEvent.click(await screen.findByRole('button', { name: /whose money/i }, LOADED));
  await userEvent.click(await screen.findByRole('button', { name: new RegExp(`^.?${name}`) }));
}

describe('family views (F-024)', () => {
  beforeEach(() => {
    setScreenWidth(1440);
    localStorage.removeItem(WHO_KEY);
  });

  it('has no lens without a family, and the pages ask for your own money', async () => {
    const asked = viewsServer(null);
    renderApp('/transactions');

    expect(await screen.findAllByText('Groceries', {}, LOADED)).not.toHaveLength(0);
    expect(screen.queryByRole('button', { name: /whose money/i })).not.toBeInTheDocument();
    expect(new Set(whoOf(asked, '/api/transactions'))).toEqual(new Set(['me']));
  });

  it('shows a member’s money only to look at, on every page, and keeps the choice', async () => {
    const asked = viewsServer(familyOf('Couple'));
    renderApp('/transactions');
    await pick('Andriy');

    expect(await screen.findByText('Andriy’s money.')).toBeVisible();
    expect(screen.getByText(/Only Andriy changes it/)).toBeVisible();
    await waitFor(() => {
      expect(whoOf(asked, '/api/transactions/summary')).toContain(ANDRIY_ID);
    });
    // His lines open nothing; the slip has no Add (the sidebar's still adds your own)
    const lines = await screen.findAllByText((text) => text.startsWith('Mono white'));
    expect(lines.length).toBeGreaterThan(0);
    for (const line of lines) expect(line.closest('button')).toBeNull();
    expect(screen.getAllByRole('button', { name: /add transaction/i })).toHaveLength(1);
    expect(localStorage.getItem(WHO_KEY)).toBe(ANDRIY_ID);

    await userEvent.click(screen.getByRole('link', { name: 'Accounts' }));
    expect(await screen.findByText('Mono white')).toBeVisible();
    expect(screen.queryByRole('button', { name: /add account/i })).not.toBeInTheDocument();
    expect(screen.getByText('Mono white').closest('button')).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Back to mine' }));
    expect(await screen.findByRole('button', { name: /add account/i })).toBeVisible();
    expect(screen.queryByText('Andriy’s money.')).not.toBeInTheDocument();
    expect(localStorage.getItem(WHO_KEY)).toBeNull();
  });

  it('shows the family’s money with whose each card is, yours still yours', async () => {
    viewsServer(familyOf('Couple'));
    renderApp('/accounts');
    await pick('Family');

    expect(await screen.findByText('The family’s money.')).toBeVisible();
    expect(screen.getByText(/You change only your own/)).toBeVisible();
    expect(await screen.findByText('Andriy’s, Monobank')).toBeVisible();
    expect(screen.getByText('Mono white').closest('button')).toBeNull();
    // Your own card still opens the form, and the page can still add yours
    expect(screen.getByText('Mono black').closest('button')).not.toBeNull();
    expect(screen.getByRole('button', { name: /add account/i })).toBeVisible();
  });

  it('says on the family’s report that categories of one group and name are one', async () => {
    const asked = viewsServer(familyOf('Three people'));
    renderApp('/reports');
    await pick('Family');

    expect(await screen.findByText(/count as one/)).toBeVisible();
    await waitFor(() => {
      expect(whoOf(asked, '/api/reports/year')).toContain('family');
    });
  });

  it('forgets a kept choice of someone who isn’t in the family any more', async () => {
    localStorage.setItem(WHO_KEY, IRYNA_ID);
    const asked = viewsServer(familyOf('Couple'));
    renderApp('/transactions');

    const lens = await screen.findByRole('button', { name: /whose money/i }, LOADED);
    expect(within(lens).getByText('Mine')).toBeVisible();
    expect(screen.queryByText(/’s money\./)).not.toBeInTheDocument();
    await waitFor(() => {
      expect(localStorage.getItem(WHO_KEY)).toBeNull();
    });
    expect(whoOf(asked, '/api/transactions').at(-1)).toBe('me');
  });
});
