import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw/http';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { answer, type MockAnswer } from '../../test/mockRoutes';
import { LOADED, renderApp } from '../../test/render';
import { setScreenWidth } from '../../test/screen';
import { server, testUser } from '../../test/server';
import type { Family } from './familyApi';
import { fakeFamilyRoutes } from './familyFakeApi';
import { ANDRIY_ID, ownersFamily } from './familyTestData';
import { familyOf } from './familyViewsFakeApi';
import { isKept, listOf } from './privacy';
import {
  ANDRIY_KEEPS,
  familyPrivacyRoutes,
  fakePrivacyRoutes,
  NOTHING_KEPT,
  OLENA_KEEPS,
  type Kept,
} from './privacyFakeApi';
import { WHO_KEY } from './WhoseProvider';

interface Sent {
  method: string;
  path: string;
  body: unknown;
}

/** The Family page's API: the family, Olena's accounts and categories and what she keeps; returns what was sent. */
function privacyServer(family: Family, kept: Kept = NOTHING_KEPT, { fail = false } = {}) {
  const familyRoutes = fakeFamilyRoutes(family);
  const privacy = fakePrivacyRoutes(kept, { fail });
  const routes = {
    ...familyRoutes,
    ...privacy.routes,
    '/api/family': (): MockAnswer => {
      const found = (familyRoutes['/api/family'] as () => MockAnswer)();
      return typeof found === 'object' && 'json' in found
        ? { json: privacy.withMine(found.json as Family) }
        : found;
    },
  };
  const sent: Sent[] = [];
  const respond = async ({ request }: { request: Request }) => {
    const url = new URL(request.url);
    const text = request.method === 'GET' ? '' : await request.text();
    const body = text ? (JSON.parse(text) as unknown) : undefined;
    if (request.method !== 'GET') sent.push({ method: request.method, path: url.pathname, body });
    return answer(routes, request.method, url, body);
  };
  server.use(
    http.get('/api/auth/me', () => HttpResponse.json(testUser)),
    http.all('/api/family*', respond),
    http.get('/api/accounts', respond),
    http.get('/api/categories', respond),
  );
  return sent;
}

/** The whole app's API as in the stories: both Olena's and Andriy's settings applied. */
function viewsServer(andriy: Kept = ANDRIY_KEEPS, olena: Kept = OLENA_KEEPS) {
  const family = familyOf('Couple');
  if (!family) throw new Error('A family is needed');
  const routes = familyPrivacyRoutes(family, olena, andriy);
  server.use(
    http.get('/api/*', ({ request }) => answer(routes, 'GET', new URL(request.url), undefined)),
  );
}

function section(title: string): HTMLElement {
  const found = screen.getByRole('heading', { level: 2, name: title }).closest('section');
  if (!found) throw new Error(`No section "${title}"`);
  return found;
}

beforeEach(() => {
  setScreenWidth(1440);
  localStorage.removeItem(WHO_KEY);
  document.cookie = 'XSRF-TOKEN=token-from-the-api; path=/';
});

afterEach(() => {
  document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
});

describe('who sees which of your lines (F-030)', () => {
  const shares: Record<string, 'Everything' | 'BalanceOnly' | 'Hidden'> = {
    box: 'Hidden',
    privat: 'BalanceOnly',
  };
  const shareOf = (id: string) => shares[id] ?? 'Everything';
  const gifts = new Set(['gifts']);

  it('keeps a line on an account not shared in full or in a private category', () => {
    expect(isKept({ accountId: 'mono', categoryId: 'food' }, shareOf, gifts)).toBe(false);
    expect(isKept({ accountId: 'box', categoryId: 'food' }, shareOf, gifts)).toBe(true);
    expect(isKept({ accountId: 'privat', categoryId: 'food' }, shareOf, gifts)).toBe(true);
    expect(isKept({ accountId: 'mono', categoryId: 'gifts' }, shareOf, gifts)).toBe(true);
    expect(isKept({ accountId: 'mono', toAccountId: 'box' }, shareOf, gifts)).toBe(true);
  });

  it('names the people as a list', () => {
    expect(listOf(['Andriy'], 'en')).toBe('Andriy');
    expect(listOf(['Andriy', 'Iryna'], 'en')).toBe('Andriy and Iryna');
  });
});

describe('what the family sees, on the Family page (F-030)', () => {
  it('shows the section to someone alone in the family, for whoever joins', async () => {
    const alone = ownersFamily();
    privacyServer({ ...alone, members: alone.members.slice(0, 1) });
    renderApp('/family');

    expect(
      await screen.findByRole('heading', { name: 'What the family sees' }, LOADED),
    ).toBeInTheDocument();
    expect(
      within(section('What the family sees')).getByText(
        /Whoever joins the family sees your money as you set it here/,
      ),
    ).toBeInTheDocument();
  });

  it('says what is set in three folded rows', async () => {
    privacyServer(ownersFamily(), OLENA_KEEPS);
    renderApp('/family');

    const privacy = await screen.findByRole('heading', { name: 'What the family sees' }, LOADED);
    const part = within(section('What the family sees'));
    expect(privacy).toBeInTheDocument();
    expect(part.getByText(/Andriy and Iryna see your money/)).toBeInTheDocument();
    expect(
      part.getByRole('button', { name: /Your transactions.*Every transaction/ }),
    ).toHaveAttribute('aria-expanded', 'false');
    expect(
      await part.findByRole('button', { name: /Your accounts.*1 balance only, 1 hidden/ }),
    ).toBeInTheDocument();
    expect(part.getByRole('button', { name: /Private categories.*Gifts/ })).toBeInTheDocument();
  });

  it('hides an account from the family', async () => {
    const sent = privacyServer(ownersFamily());
    const user = userEvent.setup();
    renderApp('/family');

    const part = within(await waitFor(() => section('What the family sees'), LOADED));
    await user.click(await part.findByRole('button', { name: /Your accounts.*All \d+ shared/ }));
    await user.click(part.getByRole('button', { name: 'Mono black: the family sees everything' }));
    await user.click(await screen.findByRole('menuitem', { name: /Hidden/ }));

    expect(
      await part.findByRole('button', { name: 'Mono black: the family sees hidden' }),
    ).toBeInTheDocument();
    expect(part.getByRole('button', { name: /Your accounts.*1 hidden/ })).toBeInTheDocument();
    expect(sent).toContainEqual({
      method: 'PUT',
      path: '/api/family/privacy/accounts/mono',
      body: { share: 'Hidden' },
    });
  });

  it('shares only the totals of your transactions', async () => {
    const sent = privacyServer(ownersFamily());
    const user = userEvent.setup();
    renderApp('/family');

    const part = within(await waitFor(() => section('What the family sees'), LOADED));
    await user.click(part.getByRole('button', { name: /Your transactions/ }));
    await user.click(part.getByRole('radio', { name: /Only totals by category/ }));

    expect(part.getByRole('radio', { name: /Only totals by category/ })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await waitFor(() => {
      expect(sent).toContainEqual({
        method: 'PUT',
        path: '/api/family/privacy/transactions',
        body: { share: 'Totals' },
      });
    });
  });

  it('keeps a category private and shares it again', async () => {
    const sent = privacyServer(ownersFamily());
    const user = userEvent.setup();
    renderApp('/family');

    const part = within(await waitFor(() => section('What the family sees'), LOADED));
    await user.click(part.getByRole('button', { name: /Private categories.*None/ }));
    await user.click(part.getByRole('button', { name: 'Choose categories' }));
    const dialog = await screen.findByRole('dialog', { name: 'Private categories' });
    await user.click(within(dialog).getByRole('button', { name: 'Groceries' }));
    expect(within(dialog).getByRole('button', { name: 'Groceries' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Done' }));

    const shareAgain = await part.findByRole('button', { name: /Share Groceries .* again/ });
    await user.click(shareAgain);

    await waitFor(() => {
      expect(sent.map((item) => item.body)).toEqual([{ isPrivate: true }, { isPrivate: false }]);
    });
  });

  it('keeps a whole group private, its categories with it, and shares it again', async () => {
    const sent = privacyServer(ownersFamily());
    const user = userEvent.setup();
    renderApp('/family');

    const part = within(await waitFor(() => section('What the family sees'), LOADED));
    await user.click(part.getByRole('button', { name: /Private categories.*None/ }));
    await user.click(part.getByRole('button', { name: 'Choose categories' }));
    const dialog = await screen.findByRole('dialog', { name: 'Private categories' });
    await user.click(
      within(dialog).getByRole('checkbox', { name: 'Keep all of Home expenses private' }),
    );

    expect(
      within(dialog).getByRole('checkbox', { name: 'Keep all of Home expenses private' }),
    ).toBeChecked();
    const rent = within(dialog).getByRole('button', { name: 'Rent' });
    expect(rent).toHaveAttribute('aria-pressed', 'true');
    expect(rent).toBeDisabled();
    await user.click(within(dialog).getByRole('button', { name: 'Done' }));

    expect(
      await part.findByRole('button', { name: /Private categories.*Home expenses/ }),
    ).toBeInTheDocument();
    await user.click(
      part.getByRole('button', { name: 'Share the whole Home expenses group again' }),
    );

    await waitFor(() => {
      expect(sent).toEqual([
        {
          method: 'PUT',
          path: expect.stringMatching(/^\/api\/family\/privacy\/groups\//) as string,
          body: { isPrivate: true },
        },
        {
          method: 'PUT',
          path: expect.stringMatching(/^\/api\/family\/privacy\/groups\//) as string,
          body: { isPrivate: false },
        },
      ]);
    });
  });

  it('says so when a change doesn’t go through', async () => {
    privacyServer(ownersFamily(), NOTHING_KEPT, { fail: true });
    const user = userEvent.setup();
    renderApp('/family');

    const part = within(await waitFor(() => section('What the family sees'), LOADED));
    await user.click(part.getByRole('button', { name: /Your transactions/ }));
    await user.click(part.getByRole('radio', { name: /Only totals by category/ }));

    expect(await screen.findByText('That didn’t go through. Try again.')).toBeInTheDocument();
    await waitFor(() => {
      expect(part.getByRole('radio', { name: /Every transaction/ })).toHaveAttribute(
        'aria-checked',
        'true',
      );
    });
  });
});

describe('the money you see and show (F-030)', () => {
  it('marks your own cards the family doesn’t see all of', async () => {
    viewsServer();
    renderApp('/accounts');

    expect(await screen.findByText('Hidden from the family:', {}, LOADED)).toBeInTheDocument();
    expect(screen.getByText('The family sees the balance only:')).toBeInTheDocument();
  });

  it('shows Andriy’s money without what he keeps, and says so', async () => {
    localStorage.setItem(WHO_KEY, ANDRIY_ID);
    viewsServer();
    renderApp('/accounts');

    expect(await screen.findByText('Pocket', {}, LOADED)).toBeInTheDocument();
    expect(screen.queryByText('Dollars in the box')).not.toBeInTheDocument();
    expect(screen.getByText('Andriy shares only its balance:')).toBeInTheDocument();
    expect(screen.getByText(/Andriy keeps some of it private/)).toBeInTheDocument();
  });

  it('shows only the totals of someone who shares only those', async () => {
    localStorage.setItem(WHO_KEY, ANDRIY_ID);
    viewsServer({ ...ANDRIY_KEEPS, transactions: 'Totals' });
    renderApp('/transactions');

    expect(
      await screen.findByRole('heading', { name: 'Only totals by category' }, LOADED),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Andriy shares only totals by category, not the transactions/),
    ).toBeInTheDocument();
  });
});
