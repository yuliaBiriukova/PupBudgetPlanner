import { expect, test, type Locator, type Page } from '@playwright/test';
import en from '../src/shared/i18n/locales/en.json' with { type: 'json' };
import { openAddForm } from './add.ts';
import { antiforgery, newPerson, signUpThroughApi } from './auth.ts';

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

/** The gap a sheet leaves above itself however tall it is: it never touches the top of the screen (I-029). */
const TOP_GAP = 16;

/**
 * The phone's keyboard, emulated: the visual viewport says the bottom `taken` px of the screen are covered, as a
 * phone's does while a field is typed (the sheets read it, I-017); 0 puts the keyboard away.
 */
async function keyboard(page: Page, taken: number) {
  await page.evaluate((covered) => {
    const real = window.visualViewport;
    if (!real) throw new Error('no visual viewport');
    // Its own values over the browser's; taking them off gives the browser's back
    for (const [name, value] of [
      ['height', window.innerHeight - covered],
      ['offsetTop', 0],
    ] as const) {
      if (covered) Object.defineProperty(real, name, { configurable: true, value });
      else Reflect.deleteProperty(real, name);
    }
    real.dispatchEvent(new Event('resize'));
  }, taken);
}

test('on the phone a form opens from its top without the keyboard; with it up the sheet sits on it, the field and the buttons in sight (I-029)', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'Sheets are the phone’s pop-ups; the desktop dialog is unchanged');
  expect((await signUpThroughApi(page.request, newPerson('sheet-keys'))).ok()).toBe(true);
  await page.goto('/accounts');
  const screen = page.viewportSize()?.height ?? 0;
  const KEYS = 300;

  const form = await openNewAccount(page);
  const name = form.getByLabel(en.accounts.form.name, { exact: true });
  const add = form.getByRole('button', { name: en.accounts.form.add });
  /** The sheet's top and bottom on the screen, in whole pixels. */
  const edges = async () => {
    const box = await form.boundingBox();
    if (!box) throw new Error('no sheet');
    return [Math.round(box.y), Math.round(box.y + box.height)];
  };

  // Longer than the screen: up to the gap under its top, the corners round as on any sheet
  await expect.poll(edges).toEqual([TOP_GAP, screen]);
  await expect(form).toHaveCSS('border-top-left-radius', '24px');
  // It just opens: the cursor isn't in Name (which would bring the keyboard up) and nothing is scrolled
  await expect(form.getByRole('button', { name: en.common.close })).toBeFocused();
  await expect(name).not.toBeFocused();
  await expect(form.getByText(en.accounts.form.style, { exact: true })).toBeInViewport({
    ratio: 1,
  });

  // A tap on Name brings the keyboard: the sheet sits on it, Name and the buttons above the keys
  await name.click();
  await keyboard(page, KEYS);
  await expect.poll(edges).toEqual([TOP_GAP, screen - KEYS]);
  for (const part of [name, add]) {
    await expect
      .poll(async () => {
        const box = await part.boundingBox();
        return box ? Math.round(box.y + box.height) : screen;
      })
      .toBeLessThanOrEqual(screen - KEYS);
    await expect(part).toBeInViewport({ ratio: 1 });
  }

  // The keyboard goes: the sheet is back at the bottom of the screen
  await keyboard(page, 0);
  await expect.poll(edges).toEqual([TOP_GAP, screen]);
});

test('on the phone the quick-add form is as tall as its fields, and grows to the gap under the top when its keys come up (I-029)', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'Sheets are the phone’s pop-ups; the desktop dialog is unchanged');
  expect((await signUpThroughApi(page.request, newPerson('sheet-form'))).ok()).toBe(true);
  const added = await page.request.post('/api/accounts', {
    headers: await antiforgery(page.request),
    data: {
      name: 'Mono black',
      currency: 'UAH',
      source: 'Bank',
      sourceName: null,
      bankName: 'Monobank',
      openingBalance: 5000,
      openingDate: '2026-10-01',
      cardStyle: 'Solid',
    },
  });
  expect(added.ok()).toBe(true);
  await page.goto('/transactions');
  const screen = page.viewportSize()?.height ?? 0;

  const form = await openAddForm(page, isMobile);
  await expect(form.getByRole('button', { name: en.transactions.form.saveExpense })).toBeVisible();
  /** The sheet's top and bottom on the screen, in whole pixels. */
  const edges = async () => {
    const box = await form.boundingBox();
    if (!box) throw new Error('no sheet');
    return [Math.round(box.y), Math.round(box.y + box.height)];
  };

  // Its keys folded: shorter than the screen, at the bottom, with round corners; no empty room under Save
  await expect.poll(async () => (await edges())[1]).toBe(screen);
  const [top] = await edges();
  expect(top).toBeGreaterThan(0);
  expect(top).toBeLessThan(screen / 2);
  await expect(form).toHaveCSS('border-top-left-radius', '24px');

  // A tap on the amount brings the keys up: the form grows to the gap under the top, its corners still round
  await form.getByLabel(en.transactions.form.amount, { exact: true }).click();
  await expect.poll(edges).toEqual([TOP_GAP, screen]);
  await expect(form).toHaveCSS('border-top-left-radius', '24px');
  await form.getByRole('button', { name: en.common.close }).click();
  await expect(form).toBeHidden();

  // The next time the app starts, the form's data comes late: the sheet opens as tall as the form was and stays
  // so when the form is there, with nothing jumping
  await page.route('**/api/transactions/suggestions', async (route) => {
    await new Promise((done) => setTimeout(done, 1500));
    await route.continue();
  });
  await page.reload();
  await openAddForm(page, isMobile);
  await expect(form.getByRole('status', { name: en.transactions.form.loading })).toBeVisible();
  expect(await edges()).toEqual([top, screen]);
  await expect(form.getByRole('button', { name: en.transactions.form.saveExpense })).toBeVisible();
  expect(await edges()).toEqual([top, screen]);
  await expect(form).toHaveCSS('border-top-left-radius', '24px');
});
