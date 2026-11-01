import { expect, test, type Locator, type Page } from '@playwright/test';
import en from '../src/shared/i18n/locales/en.json' with { type: 'json' };
import { newPerson, signUpThroughApi } from './auth.ts';

// Pop-ups close with a swipe down and with Back (I-015). Each test starts with a person of its own, with no accounts
// yet; cleanup.teardown.ts deletes them
test.use({ storageState: { cookies: [], origins: [] } });

async function openNewAccount(page: Page) {
  await page.getByRole('button', { name: en.accounts.empty.button }).click();
  const form = page.getByRole('dialog', { name: en.accounts.form.newTitle });
  await expect(form).toBeVisible();
  return form;
}

/** Drags `handle` down with the mouse, `pause` ms after each step (a slow drag has no speed left when let go). */
async function mouseDrag(page: Page, handle: Locator, steps: number[], pause = 0) {
  const box = await handle.boundingBox();
  if (!box) throw new Error('nothing to drag');
  const x = box.x + 40;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (const d of steps) {
    await page.mouse.move(x, y + d);
    if (pause) await page.waitForTimeout(pause);
  }
  await page.mouse.up();
}

/** A finger dragged from `from` by `dy` px: real touch events, as a phone sends them. */
async function touchDrag(page: Page, from: Locator, dy: number) {
  const box = await from.boundingBox();
  if (!box) throw new Error('nothing to drag');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let i = 1; i <= 10; i++) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x, y: y + (dy * i) / 10 }],
    });
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
}

test('a sheet follows a swipe down and closes, or slides back; Back closes it; Back after × leaves the page', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'Sheets are the phone’s pop-ups');
  expect((await signUpThroughApi(page.request, newPerson('sheets'))).ok()).toBe(true);
  // Settings first, so Back has a page to go to
  await page.goto('/settings');
  await page.goto('/accounts');

  const form = await openNewAccount(page);
  const title = form.getByRole('heading', { name: en.accounts.form.newTitle });

  // A short, slow drag: the sheet slides back
  await mouseDrag(page, title, [10, 20, 30], 150);
  await page.waitForTimeout(400);
  await expect(form).toBeVisible();
  await expect(form.getByLabel(en.accounts.form.name, { exact: true })).toBeInViewport();

  // Dragged far down by its title: it closes, and the page stays
  await mouseDrag(page, title, [100, 200, 300, 400]);
  await expect(form).toBeHidden();
  await expect(page).toHaveURL(/\/accounts$/);

  // Back closes it instead of leaving the page
  await openNewAccount(page);
  await page.goBack();
  await expect(form).toBeHidden();
  await expect(page).toHaveURL(/\/accounts$/);

  // Closed with ×: nothing is left in the history, so Back leaves the page
  await openNewAccount(page);
  await form.getByRole('button', { name: en.common.close }).click();
  await expect(form).toBeHidden();
  await page.goBack();
  await expect(page).toHaveURL(/\/settings$/);
});

test('the currency list over the form closes alone: by a swipe from its content at the top, and by Back', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'Sheets are the phone’s pop-ups');
  expect((await signUpThroughApi(page.request, newPerson('sheets'))).ok()).toBe(true);
  await page.goto('/accounts');

  const form = await openNewAccount(page);
  await form.getByRole('button', { name: en.accounts.form.currency }).click();
  const list = page.getByRole('dialog', { name: en.accounts.form.currency });
  await expect(list).toBeVisible();
  const viewport = list.locator('[data-scrollarea-viewport]');
  const row = list.getByRole('button', { name: /EUR\s*Euro/ });

  // Scrolled down, a drag down scrolls the list back and doesn't close it
  await viewport.evaluate((el) => {
    el.scrollTop = 200;
  });
  await page.waitForTimeout(200);
  await touchDrag(page, list.getByRole('button').nth(4), 120);
  await page.waitForTimeout(400);
  await expect(list).toBeVisible();

  // At the top, the same drag closes the list; the form stays
  await viewport.evaluate((el) => {
    el.scrollTop = 0;
  });
  await page.waitForTimeout(200);
  await touchDrag(page, row, 300);
  await expect(list).toBeHidden();
  await expect(form).toBeVisible();

  // Over the form again: Back closes the list, the next Back the form
  await form.getByRole('button', { name: en.accounts.form.currency }).click();
  await expect(list).toBeVisible();
  await page.goBack();
  await expect(list).toBeHidden();
  await expect(form).toBeVisible();
  await page.goBack();
  await expect(form).toBeHidden();
  await expect(page).toHaveURL(/\/accounts$/);
});

test('Back from a section opened from More goes to the page under the sheet', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'More is the phone’s menu');
  expect((await signUpThroughApi(page.request, newPerson('sheets'))).ok()).toBe(true);
  await page.goto('/accounts');

  await page.getByRole('button', { name: en.nav.more }).click();
  const more = page.getByRole('dialog', { name: en.nav.more });
  await more.getByRole('link', { name: en.nav.categories }).click();
  await expect(page).toHaveURL(/\/categories$/);
  await expect(more).toBeHidden();

  await page.goBack();
  await expect(page).toHaveURL(/\/accounts$/);
  await expect(more).toBeHidden();
});

test('Back closes the desktop dialog and stays on the page', async ({ page, isMobile }) => {
  test.skip(isMobile, 'The desktop dialog');
  expect((await signUpThroughApi(page.request, newPerson('sheets'))).ok()).toBe(true);
  await page.goto('/accounts');

  const form = await openNewAccount(page);
  await page.goBack();
  await expect(form).toBeHidden();
  await expect(page).toHaveURL(/\/accounts$/);
});
