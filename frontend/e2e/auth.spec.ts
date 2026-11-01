import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import en from '../src/shared/i18n/locales/en.json' with { type: 'json' };
import { newInviteToken, newPerson, signUpThroughApi, type Person } from './auth.ts';

// These tests start signed out
test.use({ storageState: { cookies: [], origins: [] } });

async function xsrf(request: APIRequestContext) {
  await request.get('/api/auth/me');
  return (await request.storageState()).cookies.find((c) => c.name === 'XSRF-TOKEN')?.value ?? '';
}

async function signIn(page: Page, person: Pick<Person, 'email' | 'password'>) {
  await page.getByLabel(en.auth.fields.email).fill(person.email);
  await page.getByLabel(en.auth.fields.password, { exact: true }).fill(person.password);
  await page.getByRole('button', { name: en.auth.signIn, exact: true }).click();
}

async function signOut(page: Page, isMobile: boolean) {
  if (isMobile) {
    await page.getByRole('button', { name: en.nav.more, exact: true }).click();
    await page
      .getByRole('dialog', { name: en.nav.more })
      .getByRole('button', { name: en.shell.signOut })
      .click();
  } else {
    await page
      .getByRole('complementary', { name: en.shell.sidebar })
      .getByRole('button', { name: en.shell.signOut })
      .click();
  }
}

test('creates an account with an invite link, signs out and signs in again', async ({
  page,
  isMobile,
}) => {
  const person = newPerson('signup');
  await page.goto(`/invite/${await newInviteToken()}`);
  await expect(page.getByText(/invited you to Pup Budget/)).toBeVisible();

  await page.getByLabel(en.auth.fields.name).fill(person.displayName);
  await page.getByLabel(en.auth.fields.email).fill(person.email);
  await page.getByLabel(en.auth.fields.password, { exact: true }).fill(person.password);
  await page.getByLabel(en.auth.fields.confirmPassword).fill(person.password);
  await page.getByRole('button', { name: en.auth.createAccount, exact: true }).click();

  await expect(page).toHaveURL(/\/transactions$/);
  await expect(page.getByRole('heading', { level: 1, name: en.nav.transactions })).toBeVisible();
  if (!isMobile) {
    await expect(page.getByRole('complementary', { name: en.shell.sidebar })).toContainText(
      person.displayName,
    );
  }

  await signOut(page, isMobile);
  await expect(page).toHaveURL(/\/sign-in$/);

  await signIn(page, person);
  await expect(page.getByRole('heading', { level: 1, name: en.nav.transactions })).toBeVisible();

  // The cookie keeps the person signed in across a reload
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: en.nav.transactions })).toBeVisible();
});

test('a page of the app asks to sign in first, then opens', async ({ page, request }) => {
  const person = newPerson('redirect');
  expect((await signUpThroughApi(request, person)).ok()).toBe(true);

  await page.goto('/reports');
  await expect(page).toHaveURL(/\/sign-in$/);

  await signIn(page, person);
  await expect(page).toHaveURL(/\/reports$/);
  await expect(page.getByRole('heading', { level: 1, name: en.nav.reports })).toBeVisible();
});

test('a wrong password or an unknown email get the same message', async ({ page, request }) => {
  const person = newPerson('wrong');
  expect((await signUpThroughApi(request, person)).ok()).toBe(true);
  await page.goto('/sign-in');

  await signIn(page, { email: person.email, password: 'not-the-password' });
  const wrongPassword = await page.getByRole('alert').textContent();

  await signIn(page, { email: `nobody-${person.email}`, password: 'not-the-password' });
  await expect(page.getByRole('alert')).toHaveText(wrongPassword ?? '');
  expect(wrongPassword).toContain(en.auth.errors.credentials);
});

test('a taken email gets a neutral message with a way to sign in', async ({ page, request }) => {
  const person = newPerson('taken');
  expect((await signUpThroughApi(request, person)).ok()).toBe(true);
  await page.goto(`/invite/${await newInviteToken()}`);

  await page.getByLabel(en.auth.fields.name).fill('Someone else');
  await page.getByLabel(en.auth.fields.email).fill(person.email);
  await page.getByLabel(en.auth.fields.password, { exact: true }).fill('another-password');
  await page.getByLabel(en.auth.fields.confirmPassword).fill('another-password');
  await page.getByRole('button', { name: en.auth.createAccount, exact: true }).click();

  const banner = page.getByRole('alert');
  await expect(banner).toContainText(en.auth.errors.emailUnavailable);
  await banner.getByRole('link', { name: en.auth.errors.signInWithEmail }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
});

test('Create account without a link says sign-up is invite-only', async ({ page }) => {
  await page.goto('/sign-up');

  await expect(page.getByRole('heading', { name: en.auth.inviteOnly.title })).toBeVisible();
  await expect(page.getByLabel(en.auth.fields.name)).toHaveCount(0);
  await page.getByRole('link', { name: en.auth.inviteOnly.goToSignIn }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
});

test('an invite link works once; the second time it gets the neutral page', async ({
  page,
  request,
}) => {
  const token = await newInviteToken();
  const first = await request.post('/api/auth/register', {
    headers: { 'X-XSRF-TOKEN': await xsrf(request) },
    data: { ...newPerson('once'), inviteToken: token },
  });
  expect(first.ok()).toBe(true);

  await page.goto(`/invite/${token}`);
  await expect(page.getByRole('heading', { name: en.auth.invite.goneTitle })).toBeVisible();
  await expect(page.getByLabel(en.auth.fields.name)).toHaveCount(0);
});

// Google blocks automated sign-ins, so the test stops at Google's door; the whole flow is checked by hand (F-012)
test('Continue with Google sends the person to Google with our callback', async ({
  page,
  baseURL,
}) => {
  // The API answers with a redirect to Google; the test reads it and stops there (Playwright doesn't intercept
  // the request a redirect leads to)
  let google: URL | undefined;
  let returnUrl: string | null = null;
  await page.route('**/api/auth/google?*', async (route) => {
    returnUrl = new URL(route.request().url()).searchParams.get('returnUrl');
    const response = await route.fetch({ maxRedirects: 0 });
    google = new URL(response.headers().location);
    await route.fulfill({ contentType: 'text/html', body: '<title>Google</title>' });
  });
  await page.goto('/reports');

  await page.getByRole('link', { name: en.auth.continueWithGoogle }).click();

  await expect(page).toHaveTitle('Google');
  expect(returnUrl).toBe('/reports');
  expect(google?.origin).toBe('https://accounts.google.com');
  expect(google?.searchParams.get('redirect_uri')).toBe(
    `${baseURL ?? ''}/api/auth/google/callback`,
  );
  expect(google?.searchParams.get('response_type')).toBe('code');
  expect(google?.searchParams.get('scope')?.split(' ')).toEqual(
    expect.arrayContaining(['openid', 'profile', 'email']),
  );
  expect(google?.searchParams.get('state')).toBeTruthy();
});

test('a Google sign-in that fails comes back to sign in with a message', async ({ page }) => {
  // What arrives when the sign-in at Google was started somewhere else, or has expired
  await page.goto('/api/auth/google/callback?code=from-somewhere-else&state=not-ours');

  await expect(page).toHaveURL(/\/sign-in\?error=google$/);
  await expect(page.getByRole('alert')).toHaveText(en.auth.errors.google);
  await expect(page.getByRole('link', { name: en.auth.continueWithGoogle })).toBeVisible();
});
