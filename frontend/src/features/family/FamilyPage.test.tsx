import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw/http';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { answer } from '../../test/mockRoutes';
import { LOADED, renderApp } from '../../test/render';
import { setScreenWidth } from '../../test/screen';
import { server, testUser } from '../../test/server';
import type { Family } from './familyApi';
import { fakeFamilyRoutes } from './familyFakeApi';
import {
  ANDRIY_ID,
  IRYNA_ID,
  KOVALENKO_PREVIEW,
  KOVALENKO_TOKEN,
  membersFamily,
  otherFamily,
  ownersFamily,
} from './familyTestData';

interface Sent {
  method: string;
  path: string;
  body: unknown;
}

/** The family API with the API's rules, keeping every change; returns the changes sent to it. */
function familyServer(start: Family | null, { signedIn = true } = {}) {
  const routes = fakeFamilyRoutes(start, { links: { [KOVALENKO_TOKEN]: KOVALENKO_PREVIEW } });
  const sent: Sent[] = [];
  let user = signedIn ? testUser : null;
  const respond = async ({ request }: { request: Request }) => {
    const url = new URL(request.url);
    const text = request.method === 'GET' ? '' : await request.text();
    const body = text ? (JSON.parse(text) as unknown) : undefined;
    if (request.method !== 'GET') sent.push({ method: request.method, path: url.pathname, body });
    return answer(routes, request.method, url, body);
  };
  server.use(
    http.get('/api/auth/me', () =>
      user ? HttpResponse.json(user) : new HttpResponse(null, { status: 204 }),
    ),
    http.post('/api/auth/register', () => {
      user = testUser;
      return HttpResponse.json(testUser);
    }),
    http.post('/api/auth/logout', () => {
      user = null;
      return new HttpResponse(null, { status: 204 });
    }),
    http.all('/api/family*', respond),
    http.get('/api/invitations/:token', respond),
  );
  return sent;
}

/** A section of the page by its title. */
function section(title: string): HTMLElement {
  const found = screen.getByRole('heading', { level: 2, name: title }).closest('section');
  if (!found) throw new Error(`No section "${title}"`);
  return found;
}

beforeEach(() => {
  setScreenWidth(1440);
  document.cookie = 'XSRF-TOKEN=token-from-the-api; path=/';
  localStorage.removeItem('pup.family.links.open');
});

afterEach(() => {
  document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
});

describe('the Family page', () => {
  it('starts a family with a name', async () => {
    const sent = familyServer(null);
    const user = userEvent.setup();
    renderApp('/family');

    await user.click(await screen.findByRole('button', { name: 'Start a family' }, LOADED));
    expect(screen.getByText('Give the family a name')).toBeInTheDocument();
    expect(sent).toEqual([]);

    await user.type(screen.getByLabelText(/Family name/), '  Kovalenko ');
    await user.click(screen.getByRole('button', { name: 'Start a family' }));

    expect(await screen.findByText('The Kovalenko family is started.')).toBeInTheDocument();
    expect(sent).toEqual([{ method: 'POST', path: '/api/family', body: { name: 'Kovalenko' } }]);
    expect(await screen.findByRole('heading', { name: 'Members' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Delete the family' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Join a family' })).not.toBeInTheDocument();
  });

  it('shows the owner everyone, the waiting link and what they may do', async () => {
    familyServer(ownersFamily());
    renderApp('/family');

    expect(await screen.findByRole('heading', { name: 'Members' }, LOADED)).toBeInTheDocument();
    const rows = within(section('Members')).getAllByRole('listitem');
    expect(rows.map((row) => row.querySelector('p')?.textContent)).toEqual([
      'OlenaYouOwner',
      'Andriy',
      'Iryna',
    ]);
    const [olena, andriy] = rows;
    expect(olena).toHaveTextContent(/Started the family/);
    expect(andriy).toHaveTextContent(/Joined/);
    expect(screen.queryByRole('button', { name: 'Actions for Olena' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Actions for Andriy' })).toBeInTheDocument();
    expect(await screen.findByText('Mom')).toBeInTheDocument();
    expect(screen.getByText('6 days left')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Family name' })).toHaveValue('Kovalenko');
  });

  it('renames the family', async () => {
    const sent = familyServer(ownersFamily());
    const user = userEvent.setup();
    renderApp('/family');

    const name = await screen.findByRole('textbox', { name: 'Family name' }, LOADED);
    expect(screen.queryByRole('button', { name: 'Save name' })).not.toBeInTheDocument();
    await user.clear(name);
    expect(screen.getByText('Give the family a name')).toBeInTheDocument();
    await user.type(name, 'Kovalenko-Melnyk');
    await user.click(screen.getByRole('button', { name: 'Save name' }));

    expect(await screen.findByText('Family name saved.')).toBeInTheDocument();
    expect(sent).toEqual([
      { method: 'PUT', path: '/api/family/name', body: { name: 'Kovalenko-Melnyk' } },
    ]);
  });

  it('makes a link for one person and shows it once', async () => {
    const sent = familyServer(ownersFamily());
    const user = userEvent.setup();
    renderApp('/family');

    await user.click(await screen.findByRole('button', { name: 'Create invite link' }, LOADED));
    const dialog = await screen.findByRole('dialog', { name: 'Invite to the family' });
    await user.type(within(dialog).getByLabelText(/Who is it for/), 'Dad');
    await user.click(within(dialog).getByRole('button', { name: 'Create link' }));

    const ready = await screen.findByRole('dialog', { name: 'The link is ready' });
    expect(within(ready).getByRole('textbox', { name: 'Invite link' })).toHaveValue(
      `${window.location.origin}/invite/k71x9f2qa`,
    );
    expect(within(ready).getByText('For Dad')).toBeInTheDocument();
    expect(sent).toEqual([
      { method: 'POST', path: '/api/family/invitations', body: { note: 'Dad' } },
    ]);

    await user.click(within(ready).getByRole('button', { name: 'Done' }));
    expect(await screen.findByText('Dad')).toBeInTheDocument();
  });

  it('cancels a waiting link', async () => {
    const sent = familyServer(ownersFamily());
    const user = userEvent.setup();
    renderApp('/family');

    await user.click(await screen.findByRole('button', { name: 'Cancel the link Mom' }, LOADED));

    expect(await screen.findByText('Link cancelled')).toBeInTheDocument();
    // It moves to Expired and cancelled, folded at first
    await waitFor(() => {
      expect(screen.queryByText('Mom')).not.toBeInTheDocument();
    });
    expect(sent).toEqual([
      { method: 'POST', path: '/api/family/invitations/inv-mom/cancel', body: undefined },
    ]);
  });

  it('lets the owner delete the family’s old links in one go (I-006)', async () => {
    const sent = familyServer(ownersFamily());
    const user = userEvent.setup();
    renderApp('/family');

    await user.click(
      await screen.findByRole('checkbox', { name: 'Select all used links' }, LOADED),
    );
    await user.click(
      screen.getByRole('checkbox', { name: 'Select all expired and cancelled links' }),
    );
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    const dialog = await screen.findByRole('dialog', { name: 'Delete 2 links?' });
    expect(
      within(dialog).getByText(/keeps their account and stays in the family/),
    ).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Delete 2 links' }));

    expect(await screen.findByText('2 links deleted')).toBeInTheDocument();
    expect(sent).toEqual([
      {
        method: 'POST',
        path: '/api/family/invitations/delete',
        body: { ids: ['inv-iryna', 'inv-grandpa'] },
      },
    ]);
    // An empty group isn't shown at all (I-032): no title, no count, no Select all
    expect(screen.queryByRole('region', { name: 'Used' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Expired and cancelled' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('checkbox', { name: 'Select all used links' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Waiting' })).toBeInTheDocument();

    // With no links at all only Create invite link is left
    await user.click(screen.getByRole('checkbox', { name: 'Select all waiting links' }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await user.click(
      within(await screen.findByRole('dialog', { name: 'Delete “Mom”?' })).getByRole('button', {
        name: 'Delete link',
      }),
    );
    await waitFor(() => {
      expect(screen.queryByRole('region', { name: 'Waiting' })).not.toBeInTheDocument();
    });
    expect(screen.queryByText(/No links/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create invite link' })).toBeInTheDocument();
  });

  it('shows a member who isn’t the owner no links to delete', async () => {
    familyServer(membersFamily());
    renderApp('/family');

    expect(await screen.findByRole('heading', { name: 'Members' }, LOADED)).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: /Select all/ })).not.toBeInTheDocument();
  });

  it('removes someone after asking', async () => {
    const sent = familyServer(ownersFamily());
    const user = userEvent.setup();
    renderApp('/family');

    await user.click(await screen.findByRole('button', { name: 'Actions for Iryna' }, LOADED));
    await user.click(await screen.findByRole('menuitem', { name: 'Remove from family' }));
    const dialog = await screen.findByRole('dialog', { name: 'Remove Iryna from the family?' });
    expect(within(dialog).getByText(/Nothing is deleted/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Remove' }));

    expect(await screen.findByText('Iryna is no longer in the family.')).toBeInTheDocument();
    expect(sent).toEqual([
      { method: 'POST', path: `/api/family/members/${IRYNA_ID}/remove`, body: undefined },
    ]);
  });

  it('asks an owner leaving others who looks after the family next', async () => {
    const sent = familyServer(ownersFamily());
    const user = userEvent.setup();
    renderApp('/family');

    await user.click(await screen.findByRole('button', { name: 'Leave family' }, LOADED));
    const dialog = await screen.findByRole('dialog', { name: 'Leave the Kovalenko family?' });
    expect(
      within(dialog).getByText(/You stop seeing Andriy and Iryna’s money/),
    ).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Leave family' }));
    expect(within(dialog).getByRole('alert')).toHaveTextContent('Pick who looks after the family');
    expect(sent).toEqual([]);

    await user.click(within(dialog).getByRole('radio', { name: 'Andriy' }));
    await user.click(within(dialog).getByRole('button', { name: 'Leave family' }));

    expect(await screen.findByText('You left the Kovalenko family.')).toBeInTheDocument();
    expect(sent).toEqual([
      { method: 'POST', path: '/api/family/leave', body: { newOwnerId: ANDRIY_ID } },
    ]);
    expect(await screen.findByRole('heading', { name: 'Start a family' })).toBeInTheDocument();
  });

  it('lets a member see everyone and leave, but not rename, invite or remove', async () => {
    const sent = familyServer(membersFamily());
    const user = userEvent.setup();
    renderApp('/family');

    expect(await screen.findByText('The family’s owner can change it.', {}, LOADED)).toBeVisible();
    expect(screen.queryByRole('textbox', { name: 'Family name' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Invite someone' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Actions for/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Leave family' }));
    const dialog = await screen.findByRole('dialog', { name: 'Leave the Kovalenko family?' });
    expect(within(dialog).queryByRole('radiogroup')).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Leave family' }));

    expect(await screen.findByText('You left the Kovalenko family.')).toBeInTheDocument();
    expect(sent).toEqual([
      { method: 'POST', path: '/api/family/leave', body: { newOwnerId: null } },
    ]);
  });

  it('says when the family can’t be loaded and tries again', async () => {
    let fail = true;
    server.use(
      http.get('/api/family', () =>
        fail ? new HttpResponse(null, { status: 503 }) : HttpResponse.json(membersFamily()),
      ),
    );
    const user = userEvent.setup();
    renderApp('/family');

    expect(await screen.findByText('Couldn’t load your family.', {}, LOADED)).toBeInTheDocument();
    fail = false;
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { name: 'Members' })).toBeInTheDocument();
  });
});

describe('a family’s invite link', () => {
  it('asks someone signed in to join, and joins', async () => {
    const sent = familyServer(null);
    const user = userEvent.setup();
    renderApp(`/invite/${KOVALENKO_TOKEN}`);

    expect(
      await screen.findByRole('heading', { name: 'Join the Kovalenko family?' }, LOADED),
    ).toBeInTheDocument();
    expect(screen.getByText('Andriy invites you to the Kovalenko family')).toBeInTheDocument();
    expect(
      within(screen.getByRole('list', { name: 'In the family' }))
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['AAndriyowner', 'IIryna']);
    expect(screen.getByText('Signed in as olena@example.com.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Join family' }));

    expect(await screen.findByText('You joined the Kovalenko family.')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 1, name: 'Family' })).toBeInTheDocument();
    expect(sent).toEqual([
      { method: 'POST', path: '/api/family/join', body: { token: KOVALENKO_TOKEN } },
    ]);
  });

  it('tells someone in another family to leave it first', async () => {
    const sent = familyServer(otherFamily());
    renderApp(`/invite/${KOVALENKO_TOKEN}`);

    expect(
      await screen.findByRole('heading', { name: 'You’re already in a family' }, LOADED),
    ).toBeInTheDocument();
    expect(screen.getByText(/You’re in the Melnyk family/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to Family' })).toHaveAttribute('href', '/family');
    expect(screen.queryByRole('button', { name: 'Join family' })).not.toBeInTheDocument();
    expect(sent).toEqual([]);
  });

  it('names the family to someone new, and their account joins it', async () => {
    familyServer(null, { signedIn: false });
    const user = userEvent.setup();
    renderApp(`/invite/${KOVALENKO_TOKEN}`);

    expect(
      await screen.findByText('Andriy invites you to the Kovalenko family', {}, LOADED),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/you’ll see Andriy and Iryna’s money, and they’ll see yours/),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Continue with Google' })).toHaveAttribute(
      'href',
      `/api/auth/google?returnUrl=%2Finvite%2F${KOVALENKO_TOKEN}&invite=${KOVALENKO_TOKEN}`,
    );

    await user.type(screen.getByLabelText('Your name'), 'Olena');
    await user.type(screen.getByLabelText('Email'), 'olena@example.com');
    await user.type(screen.getByLabelText('Password'), 'kyiv-budget-26');
    await user.type(screen.getByLabelText('Confirm password'), 'kyiv-budget-26');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('You joined the Kovalenko family.')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 1, name: 'Family' })).toBeInTheDocument();
  }, 10_000);

  it('sends someone signed in with the admin’s link on into the app, as before', async () => {
    familyServer(null);
    server.use(
      http.get('/api/invitations/:token', () =>
        HttpResponse.json({ inviterName: 'Yulia', expiresAt: '2026-11-19T10:00:00Z' }),
      ),
      http.get('/api/transactions*', () => new HttpResponse(null, { status: 503 })),
      http.get('/api/accounts*', () => new HttpResponse(null, { status: 503 })),
      http.get('/api/categories', () => new HttpResponse(null, { status: 503 })),
    );
    const { router } = renderApp('/invite/admin-link');

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/transactions');
    }, LOADED);
  });
});
