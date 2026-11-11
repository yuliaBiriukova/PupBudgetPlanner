import { expect, test, type Locator, type Page } from '@playwright/test';
import dayjs from 'dayjs';
import en from '../src/shared/i18n/locales/en.json' with { type: 'json' };
import { antiforgery, newPerson, signUpThroughApi } from './auth.ts';
import { openAddForm } from './add.ts';

// Each run starts with a person of its own, so the first visit has no transactions; cleanup.teardown.ts deletes them
test.use({ storageState: { cookies: [], origins: [] } });

const form = en.transactions.form;

/** The phone's keys that are named, not labelled with what they type. */
const KEY_NAMES: Record<string, string> = {
  '.': form.key.point,
  '+': form.key.plus,
  '-': form.key.minus,
};

/**
 * Types the amount: on the app's own keys on the phone, which come up on a tap on the amount (I-028), into the display
 * on the desktop.
 */
async function typeAmount(dialog: Locator, isMobile: boolean, amount: string) {
  if (!isMobile) {
    await dialog.getByLabel(form.amount, { exact: true }).fill(amount);
    return;
  }
  await dialog.getByLabel(form.amount, { exact: true }).click();
  const keys = dialog.getByRole('group', { name: form.keys });
  for (const key of amount)
    await keys.getByRole('button', { name: KEY_NAMES[key] ?? key, exact: true }).click();
}

/** Clears the amount: Backspace on the phone's keys, the field emptied on the desktop. */
async function clearAmount(dialog: Locator, isMobile: boolean, digits: number) {
  if (!isMobile) {
    await dialog.getByLabel(form.amount, { exact: true }).fill('');
    return;
  }
  await dialog.getByLabel(form.amount, { exact: true }).click();
  for (let i = 0; i < digits; i++)
    await dialog.getByRole('button', { name: form.key.back }).click();
}

/** The number fits its display: not scrolled under the currency sign (B-006: `135 ₴`, `$414`). */
async function expectNumberFits(input: Locator) {
  await expect
    .poll(() => input.evaluate((field: HTMLInputElement) => field.scrollWidth - field.clientWidth))
    .toBeLessThanOrEqual(0);
}

/** Save: on the phone the keys' Save, or the type's own once the keys fold away for a note (I-017). */
const saveButton = (dialog: Locator, isMobile: boolean, desktopName: string) =>
  dialog.getByRole('button', {
    name: isMobile ? new RegExp(`^(${form.save}|${desktopName})$`) : desktopName,
    exact: !isMobile,
  });

async function addAccount(
  page: Page,
  name: string,
  openingBalance: number,
  source: 'Bank' | 'Cash',
  currency = 'UAH',
) {
  const added = await page.request.post('/api/accounts', {
    headers: await antiforgery(page.request),
    data: {
      name,
      currency,
      source,
      sourceName: null,
      bankName: source === 'Bank' ? 'Monobank' : null,
      openingBalance,
      openingDate: '2026-10-01',
      cardStyle: source === 'Bank' ? 'Solid' : 'Envelope',
    },
  });
  expect(added.ok()).toBe(true);
}

test('a person adds an expense from an account’s card, changes it, deletes it, and adds an income', async ({
  page,
  isMobile,
}) => {
  const response = await signUpThroughApi(page.request, newPerson('transactions'));
  expect(response.ok()).toBe(true);
  await addAccount(page, 'Mono black', 1000, 'Bank');
  await addAccount(page, 'Wallet', 500, 'Cash');

  // From the + on Wallet's card: that account is picked
  await page.goto('/accounts');
  await page.getByRole('button', { name: 'Add a transaction from Wallet' }).click();
  let dialog = page.getByRole('dialog', { name: 'Add expense' });
  await expect(dialog.getByRole('button', { name: /^Account:/ })).toContainText('Wallet');
  // Narrow digits in the display font fit their box, the ₴ clear of them (B-006)
  await typeAmount(dialog, isMobile, '135');
  await expectNumberFits(dialog.getByLabel(form.amount, { exact: true }));
  await clearAmount(dialog, isMobile, 3);
  await typeAmount(dialog, isMobile, '250');
  // No transactions yet: the category is found in All categories
  await dialog.getByRole('button', { name: form.allCategories }).click();
  await page.getByLabel(form.searchCategories).fill('groc');
  await page
    .getByRole('dialog', { name: form.category })
    .getByRole('button', { name: 'Groceries' })
    .click();
  await expect(dialog.getByRole('radio', { name: 'Groceries' })).toBeChecked();
  await dialog.getByLabel(form.note, { exact: true }).fill('Silpo');
  await saveButton(dialog, isMobile, form.saveExpense).click();

  await expect(page.getByText('Expense saved. Wallet:')).toBeVisible();
  await expect(page.getByRole('button', { name: /^Wallet/ })).toContainText('250 ₴');

  // An account with a transaction can only be archived (I-011)
  await page.getByRole('button', { name: /^Wallet/ }).click();
  const account = page.getByRole('dialog', { name: 'Edit Wallet' });
  await expect(
    account.getByRole('button', { name: en.accounts.form.end.deleteButton }),
  ).toBeDisabled();
  await expect(account).toContainText('It has 1 transaction, so it can only be archived.');
  await account.getByRole('button', { name: en.common.close }).click();

  // On the Transactions page: change it
  await page.goto('/transactions');
  // On the day's receipt (the desktop's Where it went has a Groceries line too)
  const row = page
    .getByRole('region', { name: /^Today, / })
    .getByRole('button', { name: /Groceries/ });
  await expect(row).toContainText('Wallet, Silpo');
  await expect(row).toContainText('−250 ₴');
  await row.click();
  dialog = page.getByRole('dialog', { name: 'Edit expense' });
  await clearAmount(dialog, isMobile, 3);
  await typeAmount(dialog, isMobile, '300');
  await saveButton(dialog, isMobile, form.saveChanges).click();
  await expect(page.getByText('Changes saved. Wallet:')).toBeVisible();
  await expect(row).toContainText('−300 ₴');

  // Delete asks first and says what the balance goes back to
  await row.click();
  await page
    .getByRole('dialog', { name: 'Edit expense' })
    .getByRole('button', { name: form.deleteLabel.Expense })
    .click();
  const ask = page.getByRole('dialog', { name: en.transactions.delete.title.Expense });
  await expect(ask).toContainText('Wallet goes back to 500 ₴.');
  await ask.getByRole('button', { name: en.transactions.delete.confirm }).click();
  await expect(page.getByText('Deleted. Wallet:')).toBeVisible();
  await expect(page.getByRole('heading', { name: en.transactions.list.emptyTitle })).toBeVisible();

  // An income from the main +: its own categories
  await page.getByRole('button', { name: en.shell.addTransaction }).first().click();
  dialog = page.getByRole('dialog', { name: 'Add expense' });
  await dialog.getByText(en.transactions.types.Income, { exact: true }).click();
  dialog = page.getByRole('dialog', { name: 'Add income' });
  await typeAmount(dialog, isMobile, '1500');
  await dialog.getByRole('radio', { name: 'Salary' }).click();
  await saveButton(dialog, isMobile, form.saveIncome).click();
  await expect(page.getByText('Income saved.')).toBeVisible();
  await expect(
    page.getByRole('region', { name: /^Today, / }).getByRole('button', { name: /Salary/ }),
  ).toContainText('+1 500 ₴');
});

test('a person exchanges $100 for hryvnias at the bank’s rate; both balances change, and come back on delete', async ({
  page,
  isMobile,
}) => {
  const response = await signUpThroughApi(page.request, newPerson('transfers'));
  expect(response.ok()).toBe(true);
  await addAccount(page, 'Mono black', 1000, 'Bank');
  await addAccount(page, 'Mono dollars', 500, 'Bank', 'USD');

  // From the + on the dollars card, switched to Transfer: that account is the From, the other one the To
  await page.goto('/accounts');
  await page.getByRole('button', { name: 'Add a transaction from Mono dollars' }).click();
  await page
    .getByRole('dialog', { name: 'Add expense' })
    .getByText(en.transactions.types.Transfer, { exact: true })
    .click();
  const dialog = page.getByRole('dialog', { name: 'Add transfer' });
  await expect(dialog.getByRole('button', { name: /^From/ })).toContainText('Mono dollars');
  await expect(dialog.getByRole('button', { name: /^To/ })).toContainText('Mono black');
  await expect(dialog.getByRole('radiogroup', { name: form.category })).toHaveCount(0);

  // $100 out; the bank gave 4 490 ₴ (the NBU's suggestion is replaced)
  const from = dialog.getByLabel('From Mono dollars');
  const to = dialog.getByLabel('To Mono black');
  // A sign before the number: $414 fits, its first 4 not cut under the $ (B-006)
  if (isMobile) {
    await from.click();
    const keys = dialog.getByRole('group', { name: form.keys });
    for (const key of '414') await keys.getByRole('button', { name: key, exact: true }).click();
    await expectNumberFits(from);
    for (let i = 0; i < 3; i++) await keys.getByRole('button', { name: form.key.back }).click();
  } else {
    await from.fill('414');
    await expectNumberFits(from);
    await from.fill('');
  }
  if (isMobile) {
    const keys = dialog.getByRole('group', { name: form.keys });
    for (const key of '100') await keys.getByRole('button', { name: key, exact: true }).click();
    await to.click();
    for (const key of '4490') await keys.getByRole('button', { name: key, exact: true }).click();
  } else {
    await from.fill('100');
    await to.fill('4490');
  }
  await expect(to).toHaveValue('4 490');
  await expect(dialog).toContainText('Your rate: $1 = 44.90 ₴.');
  await saveButton(dialog, isMobile, form.saveTransfer).click();

  // The notification counts both; both cards have their new balances
  await expect(page.getByText('Exchange saved.')).toBeVisible();
  await expect(page.getByRole('button', { name: /^Mono dollars/ })).toContainText('$400');
  await expect(page.getByRole('button', { name: /^Mono black/ })).toContainText('5 490 ₴');

  // Listed as an exchange; deleting it gives both balances back
  await page.goto('/transactions');
  const row = page.getByRole('button', { name: /^Exchange/ });
  await expect(row).toContainText('Mono dollars');
  await expect(row).toContainText('4 490 ₴');
  await row.click();
  await page
    .getByRole('dialog', { name: 'Edit exchange' })
    .getByRole('button', { name: form.deleteLabel.Exchange })
    .click();
  const ask = page.getByRole('dialog', { name: en.transactions.delete.title.Exchange });
  await expect(ask).toContainText('Mono dollars goes back to $500, Mono black to 1 000 ₴.');
  await ask.getByRole('button', { name: en.transactions.delete.confirm }).click();
  await expect(page.getByText('Deleted.')).toBeVisible();

  await page.goto('/accounts');
  await expect(page.getByRole('button', { name: /^Mono dollars/ })).toContainText('$500');
  await expect(page.getByRole('button', { name: /^Mono black/ })).toContainText('1 000 ₴');
});

/** Adds a transaction of today through the API, as the form would; `currency` tells same-named accounts apart. */
async function addExpense(
  page: Page,
  accountName: string,
  categoryName: string,
  amount: number,
  note: string,
  currency?: string,
) {
  const accounts = (await (await page.request.get('/api/accounts')).json()) as {
    accounts: { id: string; name: string; currency: string }[];
  };
  const categories = (await (await page.request.get('/api/categories')).json()) as {
    groups: { kind: string; categories: { id: string; name: string }[] }[];
  };
  const added = await page.request.post('/api/transactions', {
    headers: await antiforgery(page.request),
    data: {
      type: 'Expense',
      date: new Date().toLocaleDateString('sv', { timeZone: 'Europe/Kyiv' }),
      accountId: accounts.accounts.find(
        (item) => item.name === accountName && (!currency || item.currency === currency),
      )?.id,
      categoryId: categories.groups
        .filter((group) => group.kind === 'Expense')
        .flatMap((group) => group.categories)
        .find((item) => item.name === categoryName)?.id,
      amount,
      note,
    },
  });
  expect(added.ok()).toBe(true);
}

test('a person finds the month’s eating out, changes one on its receipt and deletes another; the filter stays in the address', async ({
  page,
  isMobile,
}) => {
  const response = await signUpThroughApi(page.request, newPerson('list'));
  expect(response.ok()).toBe(true);
  await addAccount(page, 'Mono black', 5000, 'Bank');
  await addAccount(page, 'Wallet', 1000, 'Cash');
  await addExpense(page, 'Mono black', 'Groceries', 612, 'Silpo');
  await addExpense(page, 'Wallet', 'Eating out', 380, 'Lunch');
  await addExpense(page, 'Mono black', 'Eating out', 150, 'Coffee');

  // The month's totals on top, today's receipt with what it cost
  await page.goto('/transactions');
  const totals = page.getByRole('region', { name: en.transactions.totals.label });
  await expect(totals).toContainText('1 142 ₴');
  const receipt = page.getByRole('region', { name: /^Today, / });
  await expect(receipt).toContainText('Total−1 142 ₴');

  // Eating out picked: in Where it went on the desktop, in the Filters sheet on the phone
  if (isMobile) {
    await page.getByRole('button', { name: en.transactions.filters.button }).click();
    const sheet = page.getByRole('dialog', { name: en.transactions.filters.label });
    await sheet.getByRole('button', { name: /^Eating out/ }).click();
    await sheet.getByRole('button', { name: 'Show 2 transactions' }).click();
  } else {
    await page
      .getByRole('region', { name: en.transactions.where.spent })
      .getByRole('button', { name: /^Eating out/ })
      .click();
  }
  await expect(page).toHaveURL(/category=/);
  await expect(receipt.getByRole('button', { name: /^Groceries/ })).toHaveCount(0);
  await expect(totals).toContainText(en.transactions.totals.spentPicked);
  await expect(totals).toContainText('530 ₴');

  // A reload keeps it
  await page.reload();
  await expect(
    isMobile
      ? page.getByRole('button', { name: 'Clear category: Eating out' })
      : page.getByRole('button', { name: 'Showing Eating out only. Show all categories' }),
  ).toBeVisible();
  await expect(totals).toContainText('530 ₴');

  // Changed on its receipt: the line and the totals follow
  await receipt.getByRole('button', { name: /^Eating out.*Lunch/ }).click();
  let dialog = page.getByRole('dialog', { name: 'Edit expense' });
  await clearAmount(dialog, isMobile, 3);
  await typeAmount(dialog, isMobile, '400');
  await saveButton(dialog, isMobile, form.saveChanges).click();
  await expect(page.getByText('Changes saved. Wallet:')).toBeVisible();
  await expect(receipt.getByRole('button', { name: /^Eating out.*Lunch/ })).toContainText('−400 ₴');
  await expect(totals).toContainText('550 ₴');

  // Deleted after asking: gone from the receipt and the totals
  await receipt.getByRole('button', { name: /^Eating out.*Coffee/ }).click();
  dialog = page.getByRole('dialog', { name: 'Edit expense' });
  await dialog.getByRole('button', { name: form.deleteLabel.Expense }).click();
  const ask = page.getByRole('dialog', { name: en.transactions.delete.title.Expense });
  await expect(ask).toContainText('Mono black goes back to');
  await ask.getByRole('button', { name: en.transactions.delete.confirm }).click();
  await expect(page.getByText('Deleted. Mono black:')).toBeVisible();
  await expect(receipt.getByRole('button', { name: /^Eating out.*Coffee/ })).toHaveCount(0);
  await expect(totals).toContainText('400 ₴');
});

test('a note used before is suggested while typing the next one; two letters and a tap fill it in', async ({
  page,
  isMobile,
}) => {
  const response = await signUpThroughApi(page.request, newPerson('notes'));
  expect(response.ok()).toBe(true);
  await addAccount(page, 'Mono black', 5000, 'Bank');

  // The first time the note is typed in full
  await page.goto('/transactions');
  await page.getByRole('button', { name: en.shell.addTransaction }).first().click();
  let dialog = page.getByRole('dialog', { name: 'Add expense' });
  await typeAmount(dialog, isMobile, '612');
  await dialog.getByRole('button', { name: form.allCategories }).click();
  await page.getByLabel(form.searchCategories).fill('groc');
  await page
    .getByRole('dialog', { name: form.category })
    .getByRole('button', { name: 'Groceries' })
    .click();
  await dialog.getByLabel(form.note, { exact: true }).fill('Silpo, wine for Friday');
  await saveButton(dialog, isMobile, form.saveExpense).click();
  await expect(page.getByText('Expense saved. Mono black:')).toBeVisible();

  // The next time two letters bring it back; on the phone the app's keys fold away while the note is typed
  await page.getByRole('button', { name: en.shell.addTransaction }).first().click();
  dialog = page.getByRole('dialog', { name: 'Add expense' });
  await typeAmount(dialog, isMobile, '450');
  await dialog.getByLabel(form.note, { exact: true }).pressSequentially('si');
  if (isMobile) await expect(dialog.getByRole('group', { name: form.keys })).toBeHidden();
  await page
    .getByRole('listbox', { name: form.noteSuggestions })
    .getByRole('option', { name: 'Silpo, wine for Friday' })
    .click();
  await expect(dialog.getByLabel(form.note, { exact: true })).toHaveValue('Silpo, wine for Friday');
  await saveButton(dialog, isMobile, form.saveExpense).click();
  await expect(page.getByText('Expense saved. Mono black:')).toBeVisible();

  await expect(
    page.getByRole('region', { name: /^Today, / }).getByRole('button', { name: /−450 ₴/ }),
  ).toContainText('Mono black, Silpo, wine for Friday');
});

test('on the phone a new note leaves no empty gap above Save; an earlier one’s list shows under it, above Save', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'The desktop’s list opens over the page: the form makes it no room');
  const response = await signUpThroughApi(page.request, newPerson('note-gap'));
  expect(response.ok()).toBe(true);
  await addAccount(page, 'Mono black', 5000, 'Bank');
  await addExpense(page, 'Mono black', 'Groceries', 612, 'Silpo, wine for Friday');

  // The room the phone's keyboard leaves (B-009)
  await page.setViewportSize({ width: 375, height: 520 });
  await page.goto('/transactions');
  await page.getByRole('button', { name: en.shell.addTransaction }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Add expense' });
  const note = dialog.getByLabel(form.note, { exact: true });
  const save = dialog.getByRole('button', { name: form.saveExpense });
  /** Pixels from the bottom of `above` to the top of Save. */
  const gapAbove = async (above: Locator) => {
    const [top, bottom] = [await save.boundingBox(), await above.boundingBox()];
    if (!top || !bottom) throw new Error('not on screen');
    return top.y - (bottom.y + bottom.height);
  };

  // A note never used before: no list, Save right under the Note
  await note.pressSequentially('кфс');
  await page.waitForTimeout(600);
  await expect(page.getByRole('listbox', { name: form.noteSuggestions })).toBeHidden();
  await expect(note).toBeInViewport({ ratio: 1 });
  expect(await gapAbove(note)).toBeLessThanOrEqual(32);

  // The start of an earlier note: the Note goes up as far as the list under it needs, Save right after it (B-014)
  await note.fill('');
  await note.pressSequentially('si');
  const list = page.getByRole('listbox', { name: form.noteSuggestions });
  await expect(list.getByRole('option', { name: 'Silpo, wine for Friday' })).toBeVisible();
  await expect.poll(() => gapAbove(list)).toBeLessThanOrEqual(32);
  await expect(note).toBeInViewport({ ratio: 1 });
  expect(await gapAbove(list)).toBeGreaterThanOrEqual(0);
});

test('on the phone Save comes right after the Note’s list, short or long, with no empty gap', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'The desktop’s list opens over the page: the form makes it no room');
  const response = await signUpThroughApi(page.request, newPerson('list-gap'));
  expect(response.ok()).toBe(true);
  await addAccount(page, 'Mono black', 5000, 'Bank');
  for (const note of ['Silpo', 'Silpo, wine for Friday', 'Simcard top-up', 'Sushi', 'Salon'])
    await addExpense(page, 'Mono black', 'Groceries', 100, note);

  // The room the phone's keyboard leaves (B-014)
  await page.setViewportSize({ width: 375, height: 520 });
  await page.goto('/transactions');
  await page.getByRole('button', { name: en.shell.addTransaction }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Add expense' });
  const note = dialog.getByLabel(form.note, { exact: true });
  const save = dialog.getByRole('button', { name: form.saveExpense });
  const list = page.getByRole('listbox', { name: form.noteSuggestions });
  /** Pixels from the list's last row to the top of Save. */
  const gapUnderList = async () => {
    const [top, bottom] = [await save.boundingBox(), await list.boundingBox()];
    if (!top || !bottom) throw new Error('not on screen');
    return top.y - (bottom.y + bottom.height);
  };
  /** The whole list above Save, at most 32 px from it: no empty gap. */
  const rightAboveSave = async (rows: number) => {
    await expect(list.getByRole('option')).toHaveCount(rows);
    await expect.poll(gapUnderList).toBeLessThanOrEqual(32);
    expect(await gapUnderList()).toBeGreaterThanOrEqual(0);
    await expect(note).toBeInViewport({ ratio: 1 });
  };

  // One note: the Note goes up only as far as its one row needs
  await note.pressSequentially('sus');
  await rightAboveSave(1);
  // The most notes, then fewer as the note is typed on: the room grows and shrinks with the list
  await note.fill('');
  await note.pressSequentially('s');
  await rightAboveSave(5);
  await note.pressSequentially('i');
  await rightAboveSave(3);
});

test('a day picked in the calendar: Add transaction starts on it, and the saved one is on its receipt', async ({
  page,
  isMobile,
}) => {
  const response = await signUpThroughApi(page.request, newPerson('picked-day'));
  expect(response.ok()).toBe(true);
  await addAccount(page, 'Mono black', 1000, 'Bank');
  // The 15th of last month: always in the past, and on another week than today
  const day = dayjs().subtract(1, 'month').date(15);

  await page.goto(`/transactions?month=${day.format('YYYY-MM')}`);
  const calendar = page.getByRole('region', { name: en.transactions.calendar.title });
  await expect(calendar).toBeVisible();
  // Folded on the phone: the whole month first
  const unfold = calendar.getByRole('button', { name: /show the whole month$/ });
  if (await unfold.isVisible()) await unfold.click();
  await calendar
    .getByRole('button', { name: new RegExp(`^${day.format('dddd D MMMM')}:`) })
    .click();
  await expect(page.getByText(`Only ${day.format('dddd, D MMM')}`)).toBeVisible();

  // The shell's button: the sidebar's on the desktop, the floating + and its − on the phone (I-030)
  const dialog = await openAddForm(page, isMobile);
  await expect(dialog.getByRole('radio', { name: day.format('dddd, D MMM YYYY') })).toBeChecked();
  await typeAmount(dialog, isMobile, '120');
  await dialog.getByRole('button', { name: form.allCategories }).click();
  await page.getByLabel(form.searchCategories).fill('groc');
  await page
    .getByRole('dialog', { name: form.category })
    .getByRole('button', { name: 'Groceries' })
    .click();
  await saveButton(dialog, isMobile, form.saveExpense).click();

  await expect(page.getByText('Expense saved. Mono black:')).toBeVisible();
  await expect(
    page
      .getByRole('region', { name: new RegExp(`, ${day.format('D MMM')}$`) })
      .getByRole('button', { name: /Groceries/ }),
  ).toContainText('−120 ₴');
});

test('on the desktop, a month with many categories: Where it went scrolls in its column and the last one can be picked', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Where it went is in the Filters sheet on the phone');
  // A short window, so the list has to scroll (B-007)
  await page.setViewportSize({ width: 1440, height: 720 });
  const response = await signUpThroughApi(page.request, newPerson('where'));
  expect(response.ok()).toBe(true);
  await addAccount(page, 'Mono black', 50000, 'Bank');
  const categories = (await (await page.request.get('/api/categories')).json()) as {
    groups: { kind: string; categories: { name: string }[] }[];
  };
  const names = categories.groups
    .filter((group) => group.kind === 'Expense')
    .flatMap((group) => group.categories)
    .slice(0, 14)
    .map((category) => category.name);
  expect(names).toHaveLength(14);
  // Largest first, so the last one added is the list's last
  for (const [index, name] of names.entries()) {
    await addExpense(page, 'Mono black', name, 1000 - index * 50, `Test ${String(index)}`);
  }

  await page.goto('/transactions');
  const where = page.getByRole('region', { name: en.transactions.where.spent });
  const last = where.getByRole('listitem').last().getByRole('button');
  await expect(last).toContainText(names.at(-1) ?? '');
  // Down the page, over the receipts: the column sticks and ends inside the window
  const receipt = page.getByRole('region', { name: /^Today, / });
  await receipt.hover();
  await page.mouse.wheel(0, 600);
  await expect(receipt).not.toBeInViewport({ ratio: 1 });
  await expect(last).not.toBeInViewport();
  const bottom = async () => {
    const box = await where.boundingBox();
    return (box?.y ?? 0) + (box?.height ?? 0);
  };
  await expect.poll(bottom).toBeLessThanOrEqual(720);

  // The wheel over the list scrolls it, not the page, and the last category comes into view
  const listBox = await where.getByRole('list').boundingBox();
  await page.mouse.move((listBox?.x ?? 0) + (listBox?.width ?? 0) / 2, (await bottom()) - 40);
  await page.mouse.wheel(0, 2000);
  // Not 1: the row's last fraction of a pixel can round under the fade's edge
  await expect(last).toBeInViewport({ ratio: 0.9 });

  // At the page's end the column ends with the receipts, so the calendar's top isn't pushed under the window's (B-008)
  await receipt.hover();
  await page.mouse.wheel(0, 3000);
  await expect(
    page.getByText(en.transactions.list.endOfMonth.replace('{{period}}.', '')),
  ).toBeInViewport();
  const calendar = page.getByRole('region', { name: en.transactions.calendar.title });
  await expect.poll(async () => (await calendar.boundingBox())?.y ?? -1).toBeGreaterThanOrEqual(16);

  await last.click();
  await expect(page).toHaveURL(/category=/);
  await expect(last).toHaveAttribute('aria-pressed', 'true');
});

test('on the desktop, a long account list scrolls with its bar beside the rows, not over the balances', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'The list is a sheet on the phone, its rows clear of the bar');
  const response = await signUpThroughApi(page.request, newPerson('account-bar'));
  expect(response.ok()).toBe(true);
  // More accounts than fit in the list, so it scrolls (B-005)
  for (let index = 0; index < 10; index += 1) {
    await addAccount(page, `Account ${String(index)}`, 48211 + index, 'Bank');
  }

  await page.goto('/transactions');
  await page.getByRole('button', { name: en.shell.addTransaction }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Add expense' });
  await dialog.getByRole('button', { name: new RegExp(`^${form.account}:`) }).click();
  const list = page.getByRole('dialog', { name: form.account });
  const rows = list.getByRole('button');
  await expect(rows).toHaveCount(10);
  // Under the pointer the bar shows, widest
  await rows.nth(1).hover();
  await page.mouse.wheel(0, 100);
  const bar = list.locator('.mantine-ScrollArea-scrollbar');
  await expect(bar).toBeVisible();
  const barLeft = (await bar.boundingBox())?.x ?? 0;
  expect(barLeft).toBeGreaterThan(0);
  for (const row of await rows.all()) {
    const box = await row.boundingBox();
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(barLeft);
  }
});

test('the account list shows each account’s bank and currency, the one used last first; the dollar “Mono” picked by its row', async ({
  page,
  isMobile,
}) => {
  const response = await signUpThroughApi(page.request, newPerson('account-list'));
  expect(response.ok()).toBe(true);
  // An account per currency in one bank, with the same name (I-024)
  await addAccount(page, 'Mono', 1000, 'Bank');
  await addAccount(page, 'Mono', 500, 'Bank', 'USD');
  await addAccount(page, 'Wallet', 300, 'Cash');
  // The dollar Mono used, then the Wallet: the Wallet is used last, the hryvnia Mono never
  await addExpense(page, 'Mono', 'Groceries', 20, 'Silpo', 'USD');
  await addExpense(page, 'Wallet', 'Eating out', 80, 'Lunch');

  await page.goto('/transactions');
  await page.getByRole('button', { name: en.shell.addTransaction }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Add expense' });
  const field = dialog.getByRole('button', { name: new RegExp(`^${form.account}:`) });
  await expect(field).toContainText('Wallet');
  await field.click();
  const list = page.getByRole('list', { name: form.accounts });
  const rows = list.getByRole('button');
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(0)).toContainText(/Wallet\s*Cash\s*220\s₴\s*UAH/);
  await expect(rows.nth(1)).toContainText(/Mono\s*Monobank\s*\$480\s*USD/);
  await expect(rows.nth(2)).toContainText(/Mono\s*Monobank\s*1\s000\s₴\s*UAH/);
  await expect(rows.nth(0)).toHaveAttribute('aria-pressed', 'true');

  // The dollar Mono, told apart by its code: the amount is in dollars
  await rows.nth(1).click();
  await expect(field).toContainText('$480');
  const amount = dialog.getByLabel(form.amount, { exact: true });
  await expect(amount.locator('xpath=ancestor::div[1]')).toContainText('$');
  await typeAmount(dialog, isMobile, '15');
  await expect(amount.locator('xpath=ancestor::div[1]')).not.toContainText('₴');
});

test('a receipt’s cents added up on the amount: the sum is saved rounded, on the phone’s keys in a phone’s order', async ({
  page,
  isMobile,
}) => {
  const response = await signUpThroughApi(page.request, newPerson('cents'));
  expect(response.ok()).toBe(true);
  await addAccount(page, 'Mono black', 1000, 'Bank');

  await page.goto('/transactions');
  const dialog = await openAddForm(page, isMobile);
  if (isMobile) {
    // 1 2 3 on top, ⌫ right above Save (I-027); the keys come up on a tap on the amount (I-028)
    await dialog.getByLabel(form.amount, { exact: true }).click();
    const keys = dialog.getByRole('group', { name: form.keys });
    await expect(keys).toBeInViewport({ ratio: 1 });
    const box = async (name: string) => {
      const found = await keys.getByRole('button', { name, exact: true }).boundingBox();
      if (!found) throw new Error(`No ${name} key`);
      return found;
    };
    expect((await box('1')).y).toBeLessThan((await box('7')).y);
    const back = await box(form.key.back);
    const save = await box(form.save);
    expect(back.x).toBe(save.x);
    expect(back.y).toBeLessThan(save.y);
  }
  await typeAmount(dialog, isMobile, '12.30+45.80');
  await expect(dialog).toContainText('= 58 ₴');
  await dialog.getByRole('button', { name: form.allCategories }).click();
  await page.getByLabel(form.searchCategories).fill('groc');
  await page
    .getByRole('dialog', { name: form.category })
    .getByRole('button', { name: 'Groceries' })
    .click();
  await saveButton(dialog, isMobile, form.saveExpense).click();

  await expect(page.getByText('Expense saved. Mono black:')).toBeVisible();
  await expect(
    page.getByRole('region', { name: /^Today, / }).getByRole('button', { name: /Groceries/ }),
  ).toContainText('−58 ₴');
});

test('the phone keys come up on a tap on the amount and fold away with Back or a swipe down, not the form', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'The desktop has no keys: the amount is typed');
  const response = await signUpThroughApi(page.request, newPerson('fold-keys'));
  expect(response.ok()).toBe(true);
  await addAccount(page, 'Mono black', 1000, 'Bank');

  await page.goto('/transactions');
  await page.getByRole('button', { name: en.shell.addTransaction }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Add expense' });
  const keys = dialog.getByRole('group', { name: form.keys });
  const amount = dialog.getByLabel(form.amount, { exact: true });

  // Folded until the amount is tapped: Save alone
  await expect(dialog.getByRole('button', { name: form.saveExpense })).toBeVisible();
  await expect(keys).toBeHidden();
  await typeAmount(dialog, isMobile, '45');
  await expect(keys).toBeVisible();

  // Back folds the keys and keeps the amount; the next Back closes the form, on the same page
  await page.goBack();
  await expect(keys).toBeHidden();
  await expect(dialog).toBeVisible();
  await expect(amount).toHaveValue('45');
  await page.goBack();
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/\/transactions$/);

  // A swipe down on the keys folds them; the form stays with its amount. Measured once they have slid in
  await page.getByRole('button', { name: en.shell.addTransaction }).first().click();
  await typeAmount(dialog, isMobile, '7');
  await expect(keys).toBeInViewport({ ratio: 1 });
  const box = await keys.boundingBox();
  if (!box) throw new Error('no keys');
  const x = box.x + box.width / 2;
  const y = box.y + 80;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 1; i <= 15; i++) await page.mouse.move(x, y + i * 10);
  await page.mouse.up();
  await expect(keys).toBeHidden();
  await expect(dialog).toBeVisible();
  await expect(amount).toHaveValue('7');

  // Closed with the keys up, the form leaves no step: Back goes to the page before
  await amount.click();
  await expect(keys).toBeVisible();
  await dialog.getByRole('button', { name: en.common.close }).click();
  await expect(dialog).toBeHidden();
  await expect
    .poll(() => page.evaluate(() => JSON.stringify(window.history.state)))
    .not.toContain('pupPopups');
});

test('the amount low on a short phone screen comes up whole above the keys when tapped, with every digit typed (B-012)', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'The desktop has no keys: the amount is typed');
  // A short phone screen, as the browser's bars leave it: the keys cover the lower part of the form
  await page.setViewportSize({ width: 412, height: 640 });
  const response = await signUpThroughApi(page.request, newPerson('amount-sight'));
  expect(response.ok()).toBe(true);
  await addAccount(page, 'Mono black', 1000, 'Bank');

  await page.goto('/transactions');
  const dialog = await openAddForm(page, isMobile);
  const keys = dialog.getByRole('group', { name: form.keys });
  const amount = dialog.getByLabel(form.amount, { exact: true });
  const display = amount.locator('xpath=ancestor::div[@data-type][1]');
  await expect(amount).toBeVisible();

  /** The form's scroll area and the amount's place on the screen. */
  const places = () =>
    display.evaluate((element) => {
      let scroller = element.parentElement;
      while (scroller && !/(auto|scroll)/.test(getComputedStyle(scroller).overflowY))
        scroller = scroller.parentElement;
      if (!scroller) throw new Error('no scroll area');
      const room = scroller.getBoundingClientRect();
      const { top, bottom } = element.getBoundingClientRect();
      return { roomTop: room.top, roomBottom: room.bottom, top, bottom };
    });

  // In sight while the keys are folded, low enough that they would cover it
  const folded = await places();
  expect(folded.bottom).toBeLessThanOrEqual(folded.roomBottom);

  // Tapped: the keys come up and the form scrolls so the whole amount is right above them
  await amount.click();
  await expect(keys).toBeInViewport({ ratio: 1 });
  const keysTop = (await keys.boundingBox())?.y ?? 0;
  expect(folded.bottom).toBeGreaterThan(keysTop);
  const fitsAboveKeys = async () => {
    const [shown, under] = await Promise.all([places(), keys.boundingBox()]);
    if (!under) return false;
    return shown.top >= shown.roomTop - 1 && shown.bottom <= under.y + 1;
  };
  await expect.poll(fitsAboveKeys).toBe(true);

  for (const key of '125') await keys.getByRole('button', { name: key, exact: true }).click();
  await expect(amount).toHaveValue('125');
  await expect.poll(fitsAboveKeys).toBe(true);
});
