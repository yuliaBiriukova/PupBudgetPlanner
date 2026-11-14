import {
  expect,
  request as playwrightRequest,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test';
import en from '../src/shared/i18n/locales/en.json' with { type: 'json' };
import {
  antiforgery,
  BASE_URL,
  E2E_ADMIN,
  newPerson,
  signedInAdmin,
  signUpThroughApi,
  type Person,
} from './auth.ts';

// These tests sign up their own people and delete them; cleanup.teardown.ts removes anything left behind
test.use({ storageState: { cookies: [], origins: [] } });

const d = en.settings.delete;
const word = (text: string) => text.replace('{{word}}', 'DELETE');

async function post<T>(request: APIRequestContext, url: string, data: object): Promise<T | null> {
  const response = await request.post(url, { headers: await antiforgery(request), data });
  expect(response.ok(), `${url}: ${String(response.status())}`).toBe(true);
  return response.status() === 204 ? null : ((await response.json()) as T);
}

async function addWallet(request: APIRequestContext) {
  await post(request, '/api/accounts', {
    name: 'Wallet',
    currency: 'UAH',
    source: 'Cash',
    sourceName: null,
    bankName: null,
    openingBalance: 10000,
    openingDate: '2026-10-01',
    cardStyle: 'Envelope',
  });
}

/** Settings → Delete account → the dialog, with the person's counts loaded. */
async function openDeleteDialog(page: Page) {
  await page.goto('/settings');
  await page.getByRole('button', { name: d.button }).click();
  const dialog = page.getByRole('dialog', { name: d.dialogTitle });
  await expect(dialog.getByText(/^1 account, 0 transactions and \d+ categories/)).toBeVisible();
  return dialog;
}

async function confirmAndDelete(page: Page, person: Person) {
  const dialog = page.getByRole('dialog', { name: d.dialogTitle });
  await dialog.getByLabel(d.password).fill(person.password);
  await dialog.getByLabel(word(d.wordTitle)).fill('delete');
  await dialog.getByRole('button', { name: d.confirm }).click();
  await expect(page.getByRole('heading', { name: en.settings.deleted.title })).toBeVisible();
}

test('a person deletes their account with everything in it; signing in is gone and coming back needs an invite', async ({
  page,
}) => {
  const olena = newPerson('delete-me');
  expect((await signUpThroughApi(page.request, olena)).ok()).toBe(true);
  await addWallet(page.request);

  const dialog = await openDeleteDialog(page);
  await expect(dialog.getByText(d.moneyStays, { exact: false })).toBeVisible();

  // A wrong password is said under the field, and nothing is deleted
  await dialog.getByLabel(d.password).fill('not-my-password');
  await dialog.getByLabel(word(d.wordTitle)).fill('DELETE');
  await dialog.getByRole('button', { name: d.confirm }).click();
  await expect(dialog.getByText(d.errors.wrongPassword)).toBeVisible();

  await dialog.getByLabel(d.password).fill('');
  await confirmAndDelete(page, olena);
  await expect(page.getByText(en.settings.deleted.invite)).toBeVisible();

  // Signed out here: the app sends them to sign in
  await page.goto('/settings');
  await expect(page).toHaveURL(/\/sign-in/);

  // The password no longer signs in
  const login = await page.request.post('/api/auth/login', {
    headers: await antiforgery(page.request),
    data: { email: olena.email, password: olena.password },
  });
  expect(login.status()).toBe(401);

  // The email is free, but like anyone new it needs an invite link
  const fresh = await playwrightRequest.newContext({ baseURL: BASE_URL });
  try {
    const withoutInvite = await fresh.post('/api/auth/register', {
      headers: await antiforgery(fresh),
      data: olena,
    });
    expect(withoutInvite.status()).toBe(403);
    expect((await signUpThroughApi(fresh, olena)).ok()).toBe(true);
    // A new, empty account: none of the old accounts came back
    const accounts = (await (await fresh.get('/api/accounts')).json()) as { accounts: unknown[] };
    expect(accounts.accounts).toHaveLength(0);
  } finally {
    await fresh.dispose();
  }
});

test('the family’s owner picks who looks after the family, and the family goes on without them', async ({
  page,
  isMobile,
}) => {
  test.skip(
    isMobile,
    'The hand-over is the same on the phone; the dialog is checked there by the first test',
  );
  const olena = newPerson('delete-owner');
  expect((await signUpThroughApi(page.request, olena)).ok()).toBe(true);
  await addWallet(page.request);
  await post(page.request, '/api/family', { name: 'E2E Kovalenko' });
  const link = await post<{ token: string }>(page.request, '/api/family/invitations', {
    note: 'E2E Andriy',
  });

  const andriyApi = await playwrightRequest.newContext({ baseURL: BASE_URL });
  try {
    const andriy = { ...newPerson('delete-heir'), displayName: 'Andriy' };
    expect((await signUpThroughApi(andriyApi, andriy)).ok()).toBe(true);
    await post(andriyApi, '/api/family/join', { token: link?.token });

    const dialog = await openDeleteDialog(page);
    const heirs = dialog.getByRole('radiogroup', { name: d.heirTitle });
    await expect(heirs).toBeVisible();

    // Without a pick the dialog asks for one
    await dialog.getByLabel(d.password).fill(olena.password);
    await dialog.getByLabel(word(d.wordTitle)).fill('DELETE');
    await dialog.getByRole('button', { name: d.confirm }).click();
    await expect(dialog.getByText(d.errors.heir)).toBeVisible();

    await heirs.getByRole('radio', { name: 'Andriy' }).click();
    await dialog.getByRole('button', { name: d.confirm }).click();
    await expect(page.getByRole('heading', { name: en.settings.deleted.title })).toBeVisible();

    // Andriy looks after the family now, alone in it, and sees nothing of Olena's
    const family = (await (await andriyApi.get('/api/family')).json()) as {
      isOwner: boolean;
      members: { displayName: string }[];
    };
    expect(family.isOwner).toBe(true);
    expect(family.members.map((m) => m.displayName)).toEqual(['Andriy']);
  } finally {
    await andriyApi.dispose();
  }
});

test('the admin can’t delete their own account', async ({ isMobile }) => {
  test.skip(isMobile, 'Through the API: once on the desktop is enough');
  const admin = await signedInAdmin();
  try {
    const summary = (await (await admin.get('/api/me/deletion')).json()) as { canDelete: boolean };
    expect(summary.canDelete).toBe(false);
    const refused = await admin.post('/api/me/delete', {
      headers: await antiforgery(admin),
      data: { word: 'DELETE', password: E2E_ADMIN.password, newOwnerId: null },
    });
    expect(refused.status()).toBe(403);
  } finally {
    await admin.dispose();
  }
});
