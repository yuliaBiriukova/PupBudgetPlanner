import {
  expect,
  request as playwrightRequest,
  test,
  type APIRequestContext,
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

// I-006: deleting and cancelling invite links. These tests sign in themselves: the admin, a family's owner
test.use({ storageState: { cookies: [], origins: [] } });

/** A note no other run has: the clean-up deletes links whose note starts with `E2E`. */
const noteFor = (what: string) => `E2E ${what} ${String(Date.now()).slice(-6)}`;

async function makeLink(api: APIRequestContext, path: string, note: string) {
  const response = await api.post(path, { headers: await antiforgery(api), data: { note } });
  expect(response.ok(), `making the link ${note}`).toBe(true);
  return (await response.json()) as { id: string; token: string };
}

/** Creates the account with the link, as the invite page does. */
async function signUpWith(token: string, person: Person) {
  const theirs = await playwrightRequest.newContext({ baseURL: BASE_URL });
  try {
    const response = await theirs.post('/api/auth/register', {
      headers: await antiforgery(theirs),
      data: { ...person, inviteToken: token },
    });
    expect(response.ok(), 'signing up with the link').toBe(true);
  } finally {
    await theirs.dispose();
  }
}

test('the admin sees every link in one list with its status, deletes a used and a waiting one and cancels another', async ({
  page,
}) => {
  const admin = await signedInAdmin();
  const used = noteFor('used');
  const waiting = noteFor('waiting');
  const toCancel = noteFor('to cancel');
  const person = newPerson('i006-invited');
  const made = async () => {
    try {
      const usedLink = await makeLink(admin, '/api/admin/invitations', used);
      const waitingLink = await makeLink(admin, '/api/admin/invitations', waiting);
      await makeLink(admin, '/api/admin/invitations', toCancel);
      await signUpWith(usedLink.token, person);
      return waitingLink.token;
    } finally {
      await admin.dispose();
    }
  };
  const waitingToken = await made();

  await page.goto('/sign-in');
  await page.getByLabel(en.auth.fields.email).fill(E2E_ADMIN.email);
  await page.getByLabel(en.auth.fields.password, { exact: true }).fill(E2E_ADMIN.password);
  await page.getByRole('button', { name: en.auth.signIn, exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: en.nav.transactions })).toBeVisible();
  await page.goto('/people/links');

  // One list, no groups to open (I-032): each row says its status with a tag
  const row = (note: string) => page.getByRole('listitem').filter({ hasText: note });
  await expect(row(used)).toContainText(en.inviteLinks.status.Used);
  await expect(row(used)).toContainText(`by ${person.displayName} on`);
  await expect(row(waiting)).toContainText(en.inviteLinks.status.Waiting);
  await expect(page.getByRole('button', { name: /^Used/ })).toHaveCount(0);

  // Only this test's links are picked: the admin's list is the shared dev database's (never Select all here)
  await page.getByRole('checkbox', { name: `Pick ${used}` }).check();
  await page.getByRole('checkbox', { name: `Pick ${waiting}` }).check();
  const bar = page.getByRole('region', { name: en.inviteLinks.bulk.label });
  await expect(bar).toContainText('2 picked');
  await bar.getByRole('button', { name: en.inviteLinks.bulk.delete }).click();

  const dialog = page.getByRole('dialog', { name: 'Delete 2 links?' });
  await expect(dialog).toContainText('1 of them still works');
  await expect(dialog).toContainText('Whoever joined with one keeps their account');
  await dialog.getByRole('button', { name: 'Delete 2 links' }).click();
  await expect(page.getByText('2 links deleted')).toBeVisible();
  await expect(page.getByText(used, { exact: true })).toHaveCount(0);
  await expect(page.getByText(waiting, { exact: true })).toHaveCount(0);

  // The deleted waiting link no longer opens
  expect((await page.request.get(`/api/invitations/${waitingToken}`)).status()).toBe(404);

  // Cancel links in the bulk bar: the link stays in the list, its tag now Cancelled
  await page.getByRole('checkbox', { name: `Pick ${toCancel}` }).check();
  await bar.getByRole('button', { name: /Cancel/ }).click();
  const cancelDialog = page.getByRole('dialog', { name: `Cancel “${toCancel}”?` });
  await expect(cancelDialog).toContainText('It shows as cancelled');
  await cancelDialog.getByRole('button', { name: 'Cancel link' }).click();
  await expect(page.getByText(en.inviteLinks.confirmCancel.doneOne)).toBeVisible();
  await expect(row(toCancel)).toContainText(en.inviteLinks.status.Cancelled);
  const links = (await (await page.request.get('/api/admin/invitations')).json()) as {
    note: string | null;
    status: string;
  }[];
  expect(links.find((l) => l.note === toCancel)?.status).toBe('Cancelled');

  // The person made with the deleted link is still "Invited" with its note
  await page
    .getByRole('navigation', { name: en.people.tabsLabel })
    .getByRole('link', { name: new RegExp(`^${en.people.tabs.people}`) })
    .click();
  await page.getByLabel(en.people.search.label).fill(person.email);
  await expect(page.getByRole('listitem').filter({ hasText: person.email })).toContainText(
    `“${used}”`,
  );
});

test('a family owner sees the family’s links in one list with their status, and deletes the old ones', async ({
  page,
}) => {
  const owner = newPerson('i006-owner');
  expect((await signUpThroughApi(page.request, owner)).ok()).toBe(true);
  const started = await page.request.post('/api/family', {
    headers: await antiforgery(page.request),
    data: { name: 'E2E Links' },
  });
  expect(started.status()).toBe(204);
  const mom = noteFor('Mom');
  const iryna = noteFor('Iryna');
  const grandpa = noteFor('Grandpa');
  await makeLink(page.request, '/api/family/invitations', mom);
  const irynasLink = await makeLink(page.request, '/api/family/invitations', iryna);
  const grandpasLink = await makeLink(page.request, '/api/family/invitations', grandpa);
  const cancelled = await page.request.post(`/api/family/invitations/${grandpasLink.id}/cancel`, {
    headers: await antiforgery(page.request),
  });
  expect(cancelled.status()).toBe(204);
  await signUpWith(irynasLink.token, { ...newPerson('i006-member'), displayName: 'Iryna' });

  await page.goto('/family');
  await expect(page.getByText(mom, { exact: true })).toBeVisible();
  // One list, as on the People page (owner's review of I-032): waiting first, then newest first, each with its tag
  const rows = page.getByRole('listitem').filter({ hasText: /E2E/ });
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(0)).toContainText(mom);
  await expect(rows.nth(0)).toContainText(en.inviteLinks.status.Waiting);
  await expect(rows.nth(1)).toContainText(grandpa);
  await expect(rows.nth(1)).toContainText(en.inviteLinks.status.Cancelled);
  await expect(rows.nth(2)).toContainText(iryna);
  await expect(rows.nth(2)).toContainText(`${en.inviteLinks.status.Used}by Iryna on`);
  await expect(page.getByRole('button', { name: /^(Waiting|Used)/ })).toHaveCount(0);
  await expect(page.getByText('3 links', { exact: true })).toBeVisible();

  await page.getByRole('checkbox', { name: `Pick ${iryna}` }).check();
  await page.getByRole('checkbox', { name: `Pick ${grandpa}` }).check();
  await page
    .getByRole('region', { name: en.inviteLinks.bulk.label })
    .getByRole('button', { name: en.inviteLinks.bulk.delete })
    .click();
  const dialog = page.getByRole('dialog', { name: 'Delete 2 links?' });
  await expect(dialog).toContainText('keeps their account and stays in the family');
  await dialog.getByRole('button', { name: 'Delete 2 links' }).click();

  await expect(page.getByText('2 links deleted')).toBeVisible();
  await expect(rows).toHaveCount(1);
  await expect(page.getByText('1 link', { exact: true })).toBeVisible();
  // The waiting link stays, and Iryna stays in the family
  await expect(page.getByText(mom, { exact: true })).toBeVisible();
  const family = (await (await page.request.get('/api/family')).json()) as {
    members: { displayName: string }[];
  };
  expect(family.members.map((m) => m.displayName)).toEqual([owner.displayName, 'Iryna']);
});
