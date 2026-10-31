import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw/http';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { renderApp } from '../../test/render';
import { setScreenWidth } from '../../test/screen';
import { server, testUser } from '../../test/server';
import type { Invitation, Person } from './peopleApi';

const admin = {
  ...testUser,
  displayName: 'Yulia Biriukova',
  email: 'yulia@example.com',
  isAdmin: true,
};

const person = (
  id: string,
  displayName: string,
  email: string,
  extra: Partial<Person> = {},
): Person => ({
  id,
  displayName,
  email,
  joinedAt: '2026-11-06T10:00:00Z',
  isAdmin: false,
  isYou: false,
  invited: true,
  invitationNote: `For ${displayName.split(' ')[0] ?? ''}`,
  blockedAt: null,
  ...extra,
});

const PEOPLE: Person[] = [
  person(admin.id, 'Yulia Biriukova', 'yulia@example.com', {
    isAdmin: true,
    isYou: true,
    invited: false,
    invitationNote: null,
  }),
  person('p-iryna', 'Iryna Melnyk', 'iryna.melnyk@example.com', {
    joinedAt: '2026-11-08T10:00:00Z',
  }),
  person('p-oksana', 'Oksana Melnychuk', 'oksana.m@example.com', {
    joinedAt: '2026-11-07T10:00:00Z',
    invitationNote: null,
  }),
  person('p-max', 'Max', 'max.trial@example.com', {
    invited: false,
    invitationNote: null,
    joinedAt: '2026-11-01T10:00:00Z',
    blockedAt: '2026-11-10T10:00:00Z',
  }),
];

const link = (
  id: string,
  note: string | null,
  status: Invitation['status'],
  extra: Partial<Invitation> = {},
): Invitation => ({
  id,
  note,
  status,
  createdAt: '2026-11-10T10:00:00Z',
  expiresAt: '2026-11-17T10:00:00Z',
  usedAt: null,
  usedByName: null,
  cancelledAt: null,
  ...extra,
});

const LINKS: Invitation[] = [
  link('l-mom', 'For Mom', 'Waiting'),
  link('l-ira', 'For Ira', 'Used', { usedAt: '2026-11-06T10:00:00Z', usedByName: 'Iryna Melnyk' }),
  link('l-taras', 'For Taras', 'Expired'),
];

function adminServer(people: Person[] = PEOPLE) {
  const actions: { url: string; body: unknown }[] = [];
  server.use(
    http.get('/api/auth/me', () => HttpResponse.json(admin)),
    http.get('/api/admin/people', () => HttpResponse.json(people)),
    http.get('/api/admin/invitations', () => HttpResponse.json(LINKS)),
    http.post('/api/admin/people/:action', async ({ request }) => {
      actions.push({ url: new URL(request.url).pathname, body: await request.json() });
      return new HttpResponse(null, { status: 204 });
    }),
    http.post('/api/admin/invitations', async ({ request }) => {
      actions.push({ url: '/api/admin/invitations', body: await request.json() });
      return HttpResponse.json({
        id: 'l-new',
        token: 'new-token',
        note: 'For Olena',
        expiresAt: '2026-11-19T10:00:00Z',
      });
    }),
  );
  return actions;
}

/** The names in the list, top to bottom. */
function rowNames() {
  return screen
    .getAllByRole('listitem')
    .map((row) => row.querySelector('p > span')?.textContent)
    .filter(Boolean);
}

beforeEach(() => {
  setScreenWidth(1440);
  document.cookie = 'XSRF-TOKEN=token-from-the-api; path=/';
  localStorage.clear();
});

afterEach(() => {
  document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
});

describe('the People page', () => {
  it('is in the admin’s sidebar and lists everyone without how they sign in', async () => {
    adminServer();
    renderApp('/people');

    const sidebar = await screen.findByRole('complementary', { name: 'Sidebar' });
    expect(within(sidebar).getByRole('link', { name: 'People' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(await screen.findByText('Iryna Melnyk')).toBeInTheDocument();
    expect(screen.getByText('You, admin')).toBeInTheDocument();
    expect(screen.getByText('“For Iryna”')).toBeInTheDocument();
    expect(screen.queryByText(/Google|Password/)).not.toBeInTheDocument();
  });

  it('is not there for anyone but the admin', async () => {
    renderApp('/people');

    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    const sidebar = screen.getByRole('complementary', { name: 'Sidebar' });
    expect(within(sidebar).queryByRole('link', { name: 'People' })).not.toBeInTheDocument();
  });

  it('finds people by name or email and says when nobody matches', async () => {
    adminServer();
    const user = userEvent.setup();
    renderApp('/people');

    await screen.findByText('Iryna Melnyk');
    await user.type(screen.getByLabelText('Search people'), 'MELNY');
    expect(screen.getByText('2 of 4')).toBeInTheDocument();
    expect(screen.queryByText('Max')).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText('Search people'));
    await user.type(screen.getByLabelText('Search people'), 'zoryana');
    expect(screen.getByRole('heading', { name: 'No one matches “zoryana”' })).toBeInTheDocument();
    // The field's X and the button under the message both clear it; the button is the one the message offers
    const [, clearButton] = screen.getAllByRole('button', { name: 'Clear search' });
    if (!clearButton) throw new Error('Clear search button missing');
    await user.click(clearButton);
    expect(screen.getByText('Max')).toBeInTheDocument();
  });

  it('sorts by a column header and turns the order around on a second click', async () => {
    adminServer();
    const user = userEvent.setup();
    renderApp('/people');

    await screen.findByText('Iryna Melnyk');
    expect(rowNames()).toEqual(['Iryna Melnyk', 'Max', 'Oksana Melnychuk', 'Yulia Biriukova']);

    await user.click(screen.getByRole('button', { name: 'Joined' }));
    expect(rowNames()).toEqual(['Iryna Melnyk', 'Oksana Melnychuk', 'Yulia Biriukova', 'Max']);
    expect(
      screen.getByRole('button', { name: 'Joined, sorted: Newest first' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^Joined/ }));
    expect(rowNames()).toEqual(['Max', 'Yulia Biriukova', 'Oksana Melnychuk', 'Iryna Melnyk']);

    // The admin, links by their note, a link without one, then accounts from before invites
    await user.click(screen.getByRole('button', { name: 'Invited with' }));
    expect(rowNames()).toEqual(['Yulia Biriukova', 'Iryna Melnyk', 'Oksana Melnychuk', 'Max']);
  });

  it('sorts from a menu on the phone', async () => {
    setScreenWidth(375);
    adminServer();
    const user = userEvent.setup();
    renderApp('/people');

    await screen.findByText('Iryna Melnyk');
    await user.click(screen.getByRole('button', { name: 'Sort: Name, A to Z' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Name, Z to A' }));
    expect(rowNames()).toEqual(['Yulia Biriukova', 'Oksana Melnychuk', 'Max', 'Iryna Melnyk']);
    expect(screen.getByRole('button', { name: 'Sort: Name, Z to A' })).toBeInTheDocument();
  });

  it('blocks everyone picked after asking', async () => {
    const actions = adminServer();
    const user = userEvent.setup();
    renderApp('/people');

    await user.click(await screen.findByRole('checkbox', { name: 'Pick Iryna Melnyk' }));
    await user.click(screen.getByRole('checkbox', { name: 'Pick Oksana Melnychuk' }));
    const bar = screen.getByRole('region', { name: 'Picked people' });
    expect(bar).toHaveTextContent('2 picked');

    await user.click(within(bar).getByRole('button', { name: 'Block' }));
    const dialog = await screen.findByRole('dialog', { name: 'Block 2 people?' });
    await user.click(within(dialog).getByRole('button', { name: 'Block 2' }));

    expect(await screen.findByText('2 people are blocked')).toBeInTheDocument();
    expect(actions).toEqual([
      { url: '/api/admin/people/block', body: { userIds: ['p-iryna', 'p-oksana'] } },
    ]);
  });

  it('picks at most 200 people at a time, the most one action takes', async () => {
    const many = Array.from({ length: 205 }, (_, i) => {
      const n = String(i + 1).padStart(3, '0');
      return person(`p-${n}`, `Test ${n}`, `test-${n}@example.com`);
    });
    const actions = adminServer([...PEOPLE, ...many]);
    const user = userEvent.setup();
    renderApp('/people');

    // By label, not by role: a role query works out every element's role and name, which takes seconds over 209
    // rows and timed out on a busy laptop (I-014)
    await user.click(await screen.findByLabelText('Pick all shown'));
    const bar = screen.getByLabelText('Picked people');
    expect(bar).toHaveTextContent('200 picked');
    expect(bar).toHaveTextContent('That’s the most at once');
    // The list goes by name: the last tests are past the 200 and can't be added
    expect(screen.getByLabelText('Pick Test 197')).toBeChecked();
    expect(screen.getByLabelText('Pick Test 198')).toBeDisabled();
    expect(screen.getByLabelText('Pick all shown')).toBeChecked();

    await user.click(within(bar).getByRole('button', { name: 'Delete' }));
    const dialog = await screen.findByRole('dialog', { name: 'Delete 200 accounts?' });
    await user.type(within(dialog).getByLabelText('Type delete to confirm'), 'delete');
    await user.click(within(dialog).getByRole('button', { name: 'Delete 200 accounts' }));

    expect(await screen.findByText('200 accounts are deleted')).toBeInTheDocument();
    const [deleted] = actions;
    expect(deleted?.url).toBe('/api/admin/people/delete');
    expect((deleted?.body as { userIds: string[] }).userIds).toHaveLength(200);
    // About 3 s on its own (209 rows render twice when all are picked): a busy machine needs more than the default
    // 5 s (I-014)
  }, 15_000);

  it('says why when the API refuses the request itself', async () => {
    adminServer();
    server.use(
      http.post('/api/admin/people/block', () =>
        HttpResponse.json(
          { status: 400, errors: { userIds: ['Pick at most 200 people at a time.'] } },
          { status: 400 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderApp('/people');

    await user.click(await screen.findByRole('checkbox', { name: 'Pick Iryna Melnyk' }));
    await user.click(screen.getByRole('checkbox', { name: 'Pick Oksana Melnychuk' }));
    await user.click(
      within(screen.getByRole('region', { name: 'Picked people' })).getByRole('button', {
        name: 'Block',
      }),
    );
    const dialog = await screen.findByRole('dialog', { name: 'Block 2 people?' });
    await user.click(within(dialog).getByRole('button', { name: 'Block 2' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Pick at most 200 people at a time.',
    );
  });

  it('has no check box or menu for the admin’s own row', async () => {
    adminServer();
    renderApp('/people');

    await screen.findByText('Iryna Melnyk');
    expect(
      screen.queryByRole('checkbox', { name: 'Pick Yulia Biriukova' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Actions for Yulia Biriukova' }),
    ).not.toBeInTheDocument();
  });

  it('deletes one person from the row’s menu only after their email is typed in', async () => {
    const actions = adminServer();
    const user = userEvent.setup();
    renderApp('/people');

    await user.click(await screen.findByRole('button', { name: 'Actions for Max' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Delete account' }));
    const dialog = await screen.findByRole('dialog', { name: 'Delete Max’s account?' });
    const confirm = within(dialog).getByRole('button', { name: 'Delete account' });
    expect(confirm).toBeDisabled();

    await user.type(
      within(dialog).getByLabelText('Type max.trial@example.com to confirm'),
      'MAX.trial@example.com',
    );
    expect(confirm).toBeEnabled();
    await user.click(confirm);

    expect(await screen.findByText('Max’s account is deleted')).toBeInTheDocument();
    expect(actions).toEqual([{ url: '/api/admin/people/delete', body: { userIds: ['p-max'] } }]);
  });

  it('unblocks a blocked person from the row’s menu', async () => {
    const actions = adminServer();
    const user = userEvent.setup();
    renderApp('/people');

    await user.click(await screen.findByRole('button', { name: 'Actions for Max' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Unblock' }));

    expect(await screen.findByText('Max can sign in again')).toBeInTheDocument();
    expect(actions).toEqual([{ url: '/api/admin/people/unblock', body: { userIds: ['p-max'] } }]);
  });
});

describe('invite links', () => {
  it('shows waiting links and keeps used and old ones folded until opened, remembering it', async () => {
    adminServer();
    const user = userEvent.setup();
    const { unmount } = renderApp('/people/links');

    expect(await screen.findByText('For Mom')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel link: For Mom' })).toBeInTheDocument();
    expect(screen.queryByText('For Ira')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Used/ }));
    expect(screen.getByText('For Ira')).toBeInTheDocument();
    expect(screen.queryByText('For Taras')).not.toBeInTheDocument();
    unmount();

    renderApp('/people/links');
    expect(await screen.findByText('For Ira')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Used/ })).toHaveAttribute('aria-expanded', 'true');
  });

  it('makes a new link with a note and shows it once with Copy link', async () => {
    const actions = adminServer();
    const user = userEvent.setup();
    renderApp('/people');

    await user.click(await screen.findByRole('button', { name: 'New invite link' }));
    const form = await screen.findByRole('dialog', { name: 'New invite link' });
    await user.type(
      within(form).getByLabelText('Who is it for? (optional, only you see it)'),
      'For Olena',
    );
    await user.click(within(form).getByRole('button', { name: 'Create link' }));

    const ready = await screen.findByRole('dialog', { name: 'Your invite link is ready' });
    expect(within(ready).getByLabelText('Invite link')).toHaveValue(
      `${window.location.origin}/invite/new-token`,
    );
    expect(within(ready).getByText(/works once, until 19 Nov 2026/)).toBeInTheDocument();
    expect(within(ready).getByRole('button', { name: 'Copy link' })).toBeInTheDocument();
    expect(actions).toEqual([{ url: '/api/admin/invitations', body: { note: 'For Olena' } }]);
  });
});
