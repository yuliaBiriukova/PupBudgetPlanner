import { expect, test, type Locator, type Page } from '@playwright/test';
import en from '../src/shared/i18n/locales/en.json' with { type: 'json' };
import { E2E_ADMIN, newPerson, signedInAdmin, signUpThroughApi, type Person } from './auth.ts';

// These tests sign in themselves: the admin, then the person they invite
test.use({ storageState: { cookies: [], origins: [] } });

async function signIn(page: Page, person: Pick<Person, 'email' | 'password'>) {
  await page.goto('/sign-in');
  await page.getByLabel(en.auth.fields.email).fill(person.email);
  await page.getByLabel(en.auth.fields.password, { exact: true }).fill(person.password);
  await page.getByRole('button', { name: en.auth.signIn, exact: true }).click();
}

async function openPeople(page: Page, isMobile: boolean) {
  if (isMobile) {
    await page.getByRole('button', { name: en.nav.more, exact: true }).click();
    await page
      .getByRole('dialog', { name: en.nav.more })
      .getByRole('link', { name: en.nav.people })
      .click();
  } else {
    await page
      .getByRole('complementary', { name: en.shell.sidebar })
      .getByRole('link', { name: en.nav.people })
      .click();
  }
  await expect(page.getByRole('heading', { level: 1, name: en.nav.people })).toBeVisible();
}

test('the admin invites a person, then blocks and unblocks them', async ({
  page,
  browser,
  isMobile,
}) => {
  // The admin's account exists before the page signs in with it
  await (await signedInAdmin()).dispose();
  const person = newPerson('invited');

  // The admin makes a link on the People page
  await signIn(page, E2E_ADMIN);
  await openPeople(page, isMobile);
  await page.getByRole('button', { name: en.people.newLink.button }).click();
  const form = page.getByRole('dialog', { name: en.people.newLink.title });
  await form.getByLabel(en.people.newLink.noteLabel).fill('E2E for Olena');
  await form.getByRole('button', { name: en.people.newLink.create }).click();
  const ready = page.getByRole('dialog', { name: en.people.newLink.readyTitle });
  const link = await ready.getByLabel(en.people.newLink.linkLabel).inputValue();
  expect(link).toMatch(/\/invite\/[A-Za-z0-9_-]{43}$/);
  await ready.getByRole('button', { name: en.people.newLink.done }).click();
  await expect(page).toHaveURL(/\/people\/links$/);
  await expect(page.getByText('E2E for Olena').first()).toBeVisible();

  // The person opens it in their own browser and creates the account
  const theirs = await browser.newContext({ baseURL: new URL(link).origin });
  const theirPage = await theirs.newPage();
  await theirPage.goto(new URL(link).pathname);
  await theirPage.getByLabel(en.auth.fields.name).fill(person.displayName);
  await theirPage.getByLabel(en.auth.fields.email).fill(person.email);
  await theirPage.getByLabel(en.auth.fields.password, { exact: true }).fill(person.password);
  await theirPage.getByLabel(en.auth.fields.confirmPassword).fill(person.password);
  await theirPage.getByRole('button', { name: en.auth.createAccount, exact: true }).click();
  await expect(
    theirPage.getByRole('heading', { level: 1, name: en.nav.transactions }),
  ).toBeVisible();

  // The admin finds them and blocks them from the row's menu
  await page
    .getByRole('navigation', { name: en.people.tabsLabel })
    .getByRole('link', { name: new RegExp(`^${en.people.tabs.people}`) })
    .click();
  await page.getByLabel(en.people.search.label).fill(person.email);
  await page.getByRole('button', { name: `Actions for ${person.displayName}` }).click();
  await page.getByRole('menuitem', { name: en.people.block.action }).click();
  const block = page.getByRole('dialog', { name: `Block ${person.displayName}?` });
  await block.getByRole('button', { name: en.people.block.confirm, exact: true }).click();
  await expect(page.getByText(en.people.blocked, { exact: true })).toBeVisible();

  // Blocked: the right password only gets the message
  await theirs.clearCookies();
  await signIn(theirPage, person);
  await expect(theirPage.getByRole('alert')).toHaveText(en.auth.errors.blocked);

  // Unblocked: they can sign in again
  await page.getByRole('button', { name: `Actions for ${person.displayName}` }).click();
  await page.getByRole('menuitem', { name: en.people.unblock.action }).click();
  await expect(page.getByText(en.people.blocked, { exact: true })).toHaveCount(0);
  await signIn(theirPage, person);
  await expect(
    theirPage.getByRole('heading', { level: 1, name: en.nav.transactions }),
  ).toBeVisible();

  await theirs.close();
});

test('a person who isn’t the admin has no People page', async ({ page }) => {
  expect((await signUpThroughApi(page.request, newPerson('not-admin'))).ok()).toBe(true);

  await page.goto('/people');
  await expect(page.getByRole('heading', { name: en.notFound.title })).toBeVisible();
});

/** Where an element sits once it stops moving (the dialog slides in when it opens). */
async function settledTop(locator: Locator): Promise<number> {
  let last = Number.NaN;
  await expect
    .poll(
      async () => {
        const top = (await locator.boundingBox())?.y ?? Number.NaN;
        const still = top === last;
        last = top;
        return still;
      },
      { intervals: [100] },
    )
    .toBe(true);
  return last;
}

// I-004: in a low window the new-link dialog is taller than the screen. Only its content scrolls: the title and the
// buttons stay, and the page behind keeps its place.
test('a dialog taller than the window scrolls inside itself', async ({ page, isMobile }) => {
  await (await signedInAdmin()).dispose();
  const width = page.viewportSize()?.width ?? 375;
  await page.setViewportSize({ width, height: 280 });
  await signIn(page, E2E_ADMIN);
  await openPeople(page, isMobile);

  const main = page.getByRole('main');
  await main.evaluate((el) => {
    el.scrollTop = 40;
  });

  await page.getByRole('button', { name: en.people.newLink.button }).click();
  const dialog = page.getByRole('dialog', { name: en.people.newLink.title });
  const title = dialog.getByRole('heading', { name: en.people.newLink.title });
  const create = dialog.getByRole('button', { name: en.people.newLink.create });
  const body = dialog.locator('[data-scrollarea-viewport]');
  await expect(create).toBeInViewport();
  expect(await body.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
  const titleTop = await settledTop(title);
  // Taken now, not before opening: the list and its counts may still arrive and move the page by themselves
  const pageScroll = await main.evaluate((el) => el.scrollTop);

  // Past the end of the content too: the scroll stays in the dialog
  await body.hover();
  await page.mouse.wheel(0, 400);
  await page.mouse.wheel(0, 400);
  await expect.poll(() => body.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  expect(await settledTop(title)).toBe(titleTop);
  await expect(create).toBeInViewport();
  expect(await main.evaluate((el) => el.scrollTop)).toBe(pageScroll);
});
