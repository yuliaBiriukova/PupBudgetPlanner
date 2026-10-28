import { expect, test, type Page } from '@playwright/test';
import en from '../src/shared/i18n/locales/en.json' with { type: 'json' };
import { newPerson, signUpThroughApi, type Person } from './auth.ts';

// These tests start signed out
test.use({ storageState: { cookies: [], origins: [] } });

async function signIn(page: Page, person: Pick<Person, 'email' | 'password'>) {
  await page.getByLabel(en.auth.fields.email).fill(person.email);
  await page.getByLabel(en.auth.fields.password, { exact: true }).fill(person.password);
  await page.getByRole('button', { name: en.auth.signIn, exact: true }).click();
}

async function signOut(page: Page, isMobile: boolean) {
  if (isMobile) {
    await page.getByRole('button', { name: en.nav.more }).click();
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

test('creates an account, signs out and signs in again', async ({ page, isMobile }) => {
  const person = newPerson('signup');
  await page.goto('/sign-up');

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
  await page.goto('/sign-up');

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
