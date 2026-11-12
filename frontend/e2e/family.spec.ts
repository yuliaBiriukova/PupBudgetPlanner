import { expect, request as playwrightRequest, test, type Page } from '@playwright/test';
import en from '../src/shared/i18n/locales/en.json' with { type: 'json' };
import { antiforgery, BASE_URL, newPerson, signUpThroughApi, type Person } from './auth.ts';

// These tests sign up their own people: the family's owner and the person they invite
test.use({ storageState: { cookies: [], origins: [] } });

async function openFamily(page: Page, isMobile: boolean) {
  if (isMobile) {
    await page.getByRole('button', { name: en.nav.more, exact: true }).click();
    await page
      .getByRole('dialog', { name: en.nav.more })
      .getByRole('link', { name: en.nav.family })
      .click();
  } else {
    await page
      .getByRole('complementary', { name: en.shell.sidebar })
      .getByRole('link', { name: en.nav.family })
      .click();
  }
  await expect(page.getByRole('heading', { level: 1, name: en.nav.family })).toBeVisible();
}

/** A member's row on the Family page, by their name (the row starts with the initials, then the name and its tags). */
const memberRow = (page: Page, name: string) =>
  page.getByRole('listitem').filter({ hasText: new RegExp(`^[A-Z]{1,2}${name}`) });

async function signUp(page: Page, person: Person) {
  await page.getByLabel(en.auth.fields.name).fill(person.displayName);
  await page.getByLabel(en.auth.fields.email).fill(person.email);
  await page.getByLabel(en.auth.fields.password, { exact: true }).fill(person.password);
  await page.getByLabel(en.auth.fields.confirmPassword).fill(person.password);
  await page.getByRole('button', { name: en.auth.createAccount, exact: true }).click();
}

test('the owner invites someone new, who joins with the link, then removes them', async ({
  page,
  browser,
  isMobile,
}) => {
  const owner = newPerson('family-owner');
  expect((await signUpThroughApi(page.request, owner)).ok()).toBe(true);

  // Olena starts a family on the Family page
  await page.goto('/transactions');
  await openFamily(page, isMobile);
  await page.getByLabel(en.family.start.nameLabel).fill('E2E Kovalenko');
  await page.getByRole('button', { name: en.family.start.button }).click();
  await expect(page.getByRole('heading', { name: en.family.members.title })).toBeVisible();
  await expect(memberRow(page, owner.displayName)).toContainText(en.family.members.owner);

  // …and makes a link for Andriy
  await page.getByRole('button', { name: en.family.invite.create }).click();
  const form = page.getByRole('dialog', { name: en.family.inviteDialog.title });
  await form.getByLabel(en.family.inviteDialog.noteLabel).fill('E2E Andriy');
  await form.getByRole('button', { name: en.family.inviteDialog.create }).click();
  const ready = page.getByRole('dialog', { name: en.family.inviteDialog.readyTitle });
  const link = await ready.getByLabel(en.family.inviteDialog.linkLabel).inputValue();
  expect(link).toMatch(/\/invite\/[A-Za-z0-9_-]{43}$/);
  await ready.getByRole('button', { name: en.family.inviteDialog.done }).click();
  await expect(page.getByText('E2E Andriy', { exact: true })).toBeVisible();

  // Andriy has no account: he opens the link in his own browser and creates one, which joins the family
  const andriy = { ...newPerson('family-new'), displayName: 'Andriy' };
  const theirs = await browser.newContext({ baseURL: new URL(link).origin });
  try {
    const theirPage = await theirs.newPage();
    await theirPage.goto(new URL(link).pathname);
    await expect(
      theirPage.getByText(`${owner.displayName} invites you to the E2E Kovalenko family`),
    ).toBeVisible();
    await signUp(theirPage, andriy);
    await expect(theirPage.getByRole('heading', { level: 1, name: en.nav.family })).toBeVisible();
    await expect(memberRow(theirPage, owner.displayName)).toContainText(en.family.members.owner);
    await expect(memberRow(theirPage, 'Andriy')).toContainText(en.family.members.you);

    // Olena sees him, and the link is used up
    await page.reload();
    await expect(page.getByRole('button', { name: 'Actions for Andriy' })).toBeVisible();
    await expect(page.getByText('E2E Andriy', { exact: true })).toHaveCount(0);

    // She removes him; his Family page has no family any more
    await page.getByRole('button', { name: 'Actions for Andriy' }).click();
    await page.getByRole('menuitem', { name: en.family.members.remove }).click();
    await page
      .getByRole('dialog', { name: 'Remove Andriy from the family?' })
      .getByRole('button', { name: en.family.remove.confirm, exact: true })
      .click();
    await expect(page.getByText('Andriy is no longer in the family.')).toBeVisible();
    await expect(page.getByRole('heading', { name: en.family.leave.deleteTitle })).toBeVisible();

    await theirPage.reload();
    await expect(theirPage.getByRole('heading', { name: en.family.start.title })).toBeVisible();
  } finally {
    await theirs.close();
  }
});

test('someone with an account joins with the family’s link, then leaves', async ({
  page,
  isMobile,
}) => {
  // The owner and the family, made through the API
  const ownerApi = await playwrightRequest.newContext({ baseURL: BASE_URL });
  try {
    const owner = newPerson('family-owner');
    expect((await signUpThroughApi(ownerApi, owner)).ok()).toBe(true);
    const started = await ownerApi.post('/api/family', {
      headers: await antiforgery(ownerApi),
      data: { name: 'E2E Melnyk' },
    });
    expect(started.status()).toBe(204);
    const made = await ownerApi.post('/api/family/invitations', {
      headers: await antiforgery(ownerApi),
      data: { note: 'E2E Iryna' },
    });
    const { token } = (await made.json()) as { token: string };

    // Iryna already has an account: signed in, she opens the link and joins
    const iryna = { ...newPerson('family-member'), displayName: 'Iryna' };
    expect((await signUpThroughApi(page.request, iryna)).ok()).toBe(true);
    await page.goto(`/invite/${token}`);
    await expect(page.getByRole('heading', { name: 'Join the E2E Melnyk family?' })).toBeVisible();
    await expect(page.getByText(`Signed in as ${iryna.email}.`)).toBeVisible();
    await page.getByRole('button', { name: en.family.joinPage.join }).click();
    await expect(page.getByText('You joined the E2E Melnyk family.')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: en.nav.family })).toBeVisible();
    await expect(memberRow(page, owner.displayName)).toContainText(en.family.members.owner);

    // The same link again: it is used up
    await page.goto(`/invite/${token}`);
    await expect(page).toHaveURL(/\/family$/);

    // She leaves; nothing of hers is gone, and the owner is alone again
    await page.reload();
    await openFamily(page, isMobile);
    await page.getByRole('button', { name: en.family.leave.button }).click();
    await page
      .getByRole('dialog', { name: 'Leave the E2E Melnyk family?' })
      .getByRole('button', { name: en.family.leave.button })
      .click();
    await expect(page.getByText('You left the E2E Melnyk family.')).toBeVisible();
    await expect(page.getByRole('heading', { name: en.family.start.title })).toBeVisible();

    const family = (await (await ownerApi.get('/api/family')).json()) as {
      members: { displayName: string }[];
    };
    expect(family.members.map((m) => m.displayName)).toEqual([owner.displayName]);
  } finally {
    await ownerApi.dispose();
  }
});
