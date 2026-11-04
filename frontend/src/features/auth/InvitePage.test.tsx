import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw/http';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { renderApp } from '../../test/render';
import { server, testUser } from '../../test/server';

/** Nobody signed in, sign-up invite-only; a link "good-token" works, every other one doesn't. */
function inviteOnlyServer() {
  let user: typeof testUser | null = null;
  const registered: unknown[] = [];
  server.use(
    http.get('/api/auth/me', () =>
      user ? HttpResponse.json(user) : new HttpResponse(null, { status: 204 }),
    ),
    http.get('/api/invitations/:token', ({ params }) =>
      params.token === 'good-token'
        ? HttpResponse.json({ inviterName: 'Yulia', expiresAt: '2026-11-19T10:00:00Z' })
        : HttpResponse.json(
            { title: 'This invite link doesn’t work any more.', status: 404 },
            { status: 404 },
          ),
    ),
    http.post('/api/auth/register', async ({ request }) => {
      const body = (await request.json()) as { inviteToken?: string };
      registered.push(body);
      if (body.inviteToken !== 'good-token') {
        return HttpResponse.json({ status: 410 }, { status: 410 });
      }
      user = testUser;
      return HttpResponse.json(testUser);
    }),
    http.post('/api/auth/login', () => HttpResponse.json({ status: 403 }, { status: 403 })),
  );
  return registered;
}

beforeEach(() => {
  document.cookie = 'XSRF-TOKEN=token-from-the-api; path=/';
});

afterEach(() => {
  document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
});

describe('the invite page', () => {
  it('says who invited and until when, and creates the account with the link', async () => {
    const registered = inviteOnlyServer();
    const user = userEvent.setup();
    renderApp('/invite/good-token');

    expect(await screen.findByText('Yulia invited you to Pup Budget')).toBeInTheDocument();
    expect(screen.getByText(/works once, until 19 Nov 2026/)).toBeInTheDocument();
    expect(
      screen.queryByRole('navigation', { name: 'Sign in or create an account' }),
    ).not.toBeInTheDocument();

    await user.type(screen.getByLabelText('Your name'), 'Olena');
    await user.type(screen.getByLabelText('Email'), 'olena@example.com');
    await user.type(screen.getByLabelText('Password'), 'kyiv-budget-26');
    await user.type(screen.getByLabelText('Confirm password'), 'kyiv-budget-26');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('heading', { name: 'Transactions' })).toBeInTheDocument();
    expect(registered).toEqual([
      expect.objectContaining({ email: 'olena@example.com', inviteToken: 'good-token' }),
    ]);
    // Four fields typed and the app's first render: about 5 s in CI, right at the default limit
  }, 10_000);

  it('sends Continue with Google with the link’s token', async () => {
    inviteOnlyServer();
    renderApp('/invite/good-token');

    const google = await screen.findByRole('link', { name: 'Continue with Google' });
    expect(google).toHaveAttribute('href', '/api/auth/google?invite=good-token');
  });

  it('gives a link that doesn’t work one neutral page, without who made it', async () => {
    inviteOnlyServer();
    renderApp('/invite/used-token');

    expect(
      await screen.findByRole('heading', { name: 'This invite link doesn’t work any more' }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Yulia/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/sign-in');
  });
});

describe('invite-only sign-up', () => {
  it('shows how to get a link instead of the Create account form', async () => {
    inviteOnlyServer();
    renderApp('/sign-up');

    expect(
      await screen.findByRole('heading', { name: 'Pup Budget is invite-only for now' }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Your name')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to sign in' })).toHaveAttribute('href', '/sign-in');
  });

  it.each([
    ['invite-only', /new accounts need an invite link/],
    ['invite', /This invite link doesn’t work any more/],
    ['blocked', /Your access to Pup Budget is turned off/],
  ])('says why Google came back to sign in (?error=%s)', async (error, message) => {
    inviteOnlyServer();
    renderApp(`/sign-in?error=${error}`);

    expect(await screen.findByRole('alert')).toHaveTextContent(message);
  });

  it('tells a blocked person with the right password that their access is off', async () => {
    inviteOnlyServer();
    const user = userEvent.setup();
    renderApp('/sign-in');

    await user.type(await screen.findByLabelText('Email'), 'olena@example.com');
    await user.type(screen.getByLabelText('Password'), 'kyiv-budget-26');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Your access to Pup Budget is turned off',
    );
  });
});
