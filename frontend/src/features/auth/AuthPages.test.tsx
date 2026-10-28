import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw/http';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { renderApp } from '../../test/render';
import { setScreenWidth } from '../../test/screen';
import { server, testUser } from '../../test/server';

/** A server where nobody is signed in until a sign-in or sign-up succeeds. */
function signedOutServer() {
  let user: typeof testUser | null = null;
  const sent: { url: string; token: string | null; body: unknown }[] = [];
  server.use(
    http.get('/api/auth/me', () =>
      user ? HttpResponse.json(user) : new HttpResponse(null, { status: 204 }),
    ),
    http.post('/api/auth/login', async ({ request }) => {
      const body = (await request.json()) as { email: string; password: string };
      sent.push({ url: request.url, token: request.headers.get('X-XSRF-TOKEN'), body });
      if (body.password !== 'kyiv-budget-26') {
        return HttpResponse.json(
          { title: 'That email and password don’t match.', status: 401 },
          { status: 401 },
        );
      }
      user = testUser;
      return HttpResponse.json(testUser);
    }),
    http.post('/api/auth/register', async ({ request }) => {
      const body = (await request.json()) as { email: string };
      sent.push({ url: request.url, token: request.headers.get('X-XSRF-TOKEN'), body });
      if (body.email === 'taken@example.com') {
        return HttpResponse.json(
          { title: 'We couldn’t create an account with this email.', status: 409 },
          { status: 409 },
        );
      }
      user = testUser;
      return HttpResponse.json(testUser);
    }),
  );
  return sent;
}

async function fillSignIn(email: string, password: string) {
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText('Email'), email);
  await user.type(screen.getByLabelText('Password'), password);
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
  return user;
}

describe('signing in', () => {
  beforeEach(() => {
    document.cookie = 'XSRF-TOKEN=token-from-the-api; path=/';
  });

  afterEach(() => {
    document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  });

  it('sends a signed-out person to sign in, then back to the page they wanted', async () => {
    const sent = signedOutServer();
    renderApp('/reports');

    expect(
      await screen.findByRole('heading', { name: 'Sign in to Pup Budget' }),
    ).toBeInTheDocument();
    await fillSignIn('olena@example.com', 'kyiv-budget-26');

    expect(await screen.findByRole('heading', { level: 1, name: 'Reports' })).toBeInTheDocument();
    expect(sent).toEqual([
      {
        url: expect.stringContaining('/api/auth/login') as string,
        token: 'token-from-the-api',
        body: { email: 'olena@example.com', password: 'kyiv-budget-26' },
      },
    ]);
  });

  it('says a wrong email or password in one message, without saying which', async () => {
    signedOutServer();
    renderApp('/sign-in');

    await fillSignIn('olena@example.com', 'wrong-password');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'That email and password don’t match. Check both and try again.',
    );
  });

  it('checks the fields before asking the server', async () => {
    const sent = signedOutServer();
    const user = userEvent.setup();
    renderApp('/sign-in');

    await user.click(await screen.findByRole('button', { name: 'Sign in' }));

    expect(screen.getByText('Enter your email.')).toBeInTheDocument();
    expect(screen.getByText('Enter your password.')).toBeInTheDocument();
    expect(sent).toEqual([]);
  });

  it('shows and hides the password', async () => {
    signedOutServer();
    const user = userEvent.setup();
    renderApp('/sign-in');

    const password = await screen.findByLabelText('Password');
    await user.click(screen.getByRole('button', { name: 'Show password' }));

    expect(password).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Hide password' })).toBeInTheDocument();
  });

  it('says when there were too many attempts', async () => {
    signedOutServer();
    server.use(
      http.post('/api/auth/login', () => HttpResponse.json({ status: 429 }, { status: 429 })),
    );
    renderApp('/sign-in');

    await fillSignIn('olena@example.com', 'kyiv-budget-26');

    expect(await screen.findByRole('alert')).toHaveTextContent('Too many attempts.');
  });

  it('takes a signed-in person past the sign-in page into the app', async () => {
    renderApp('/sign-in');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Transactions' }),
    ).toBeInTheDocument();
  });
});

describe('creating an account', () => {
  async function fillSignUp(values: {
    name: string;
    email: string;
    password: string;
    confirm: string;
  }) {
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText('Your name'), values.name);
    await user.type(screen.getByLabelText('Email'), values.email);
    await user.type(screen.getByLabelText('Password'), values.password);
    await user.type(screen.getByLabelText('Confirm password'), values.confirm);
    await user.click(screen.getByRole('button', { name: 'Create account' }));
  }

  it('creates the account and opens the app with the new name', async () => {
    setScreenWidth(1280);
    const sent = signedOutServer();
    renderApp('/sign-up');

    await fillSignUp({
      name: ' Olena ',
      email: 'olena@example.com',
      password: 'kyiv-budget-26',
      confirm: 'kyiv-budget-26',
    });

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Transactions' }),
    ).toBeInTheDocument();
    const sidebar = screen.getByRole('complementary', { name: 'Sidebar' });
    expect(within(sidebar).getByText('Olena')).toBeInTheDocument();
    expect(sent[0]?.body).toEqual({
      displayName: 'Olena',
      email: 'olena@example.com',
      password: 'kyiv-budget-26',
    });
  });

  it('asks for the same password twice', async () => {
    const sent = signedOutServer();
    renderApp('/sign-up');

    await fillSignUp({
      name: 'Olena',
      email: 'olena@example.com',
      password: 'kyiv-budget-26',
      confirm: 'kyiv-budget-27',
    });

    expect(await screen.findByText('The passwords don’t match.')).toBeInTheDocument();
    expect(sent).toEqual([]);
  });

  it('answers a taken email without saying that an account exists', async () => {
    signedOutServer();
    renderApp('/sign-up');

    await fillSignUp({
      name: 'Olena',
      email: 'taken@example.com',
      password: 'kyiv-budget-26',
      confirm: 'kyiv-budget-26',
    });

    const banner = await screen.findByRole('alert');
    expect(banner).toHaveTextContent('We couldn’t create an account with this email.');
    expect(banner).not.toHaveTextContent(/already|exists/i);
    await userEvent
      .setup()
      .click(within(banner).getByRole('link', { name: 'Sign in with this email' }));
    expect(
      await screen.findByRole('heading', { name: 'Sign in to Pup Budget' }),
    ).toBeInTheDocument();
  });

  it('switches between signing in and creating an account', async () => {
    signedOutServer();
    const user = userEvent.setup();
    renderApp('/sign-in');

    const nav = await screen.findByRole('navigation', { name: 'Sign in or create an account' });
    expect(within(nav).getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await user.click(within(nav).getByRole('link', { name: 'Create account' }));

    expect(
      await screen.findByRole('heading', { name: 'Create your Pup Budget account' }),
    ).toBeInTheDocument();
  });
});

describe('signing out', () => {
  it('signs out from More on the phone and shows the sign-in page', async () => {
    let signedIn = true;
    server.use(
      http.get('/api/auth/me', () =>
        signedIn ? HttpResponse.json(testUser) : new HttpResponse(null, { status: 204 }),
      ),
      http.post('/api/auth/logout', () => {
        signedIn = false;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();
    renderApp('/transactions');

    await user.click(await screen.findByRole('button', { name: 'More' }));
    await user.click(
      within(await screen.findByRole('dialog', { name: 'More' })).getByRole('button', {
        name: 'Sign out',
      }),
    );

    expect(
      await screen.findByRole('heading', { name: 'Sign in to Pup Budget' }),
    ).toBeInTheDocument();
  });

  it('signs out from the sidebar on the desktop', async () => {
    setScreenWidth(1280);
    let signedIn = true;
    server.use(
      http.get('/api/auth/me', () =>
        signedIn ? HttpResponse.json(testUser) : new HttpResponse(null, { status: 204 }),
      ),
      http.post('/api/auth/logout', () => {
        signedIn = false;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();
    renderApp('/transactions');

    const sidebar = await screen.findByRole('complementary', { name: 'Sidebar' });
    await user.click(within(sidebar).getByRole('button', { name: 'Sign out' }));

    expect(
      await screen.findByRole('heading', { name: 'Sign in to Pup Budget' }),
    ).toBeInTheDocument();
  });
});
