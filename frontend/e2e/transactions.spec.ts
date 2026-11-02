import { expect, test, type Locator, type Page } from '@playwright/test';
import en from '../src/shared/i18n/locales/en.json' with { type: 'json' };
import { antiforgery, newPerson, signUpThroughApi } from './auth.ts';

// Each run starts with a person of its own, so the first visit has no transactions; cleanup.teardown.ts deletes them
test.use({ storageState: { cookies: [], origins: [] } });

const form = en.transactions.form;

/** Types the amount: on the app's own keys on the phone, into the display on the desktop. */
async function typeAmount(dialog: Locator, isMobile: boolean, amount: string) {
  if (!isMobile) {
    await dialog.getByLabel(form.amount, { exact: true }).fill(amount);
    return;
  }
  const keys = dialog.getByRole('group', { name: form.keys });
  for (const key of amount) await keys.getByRole('button', { name: key, exact: true }).click();
}

/** Clears the amount: Backspace on the phone's keys, the field emptied on the desktop. */
async function clearAmount(dialog: Locator, isMobile: boolean, digits: number) {
  if (!isMobile) {
    await dialog.getByLabel(form.amount, { exact: true }).fill('');
    return;
  }
  for (let i = 0; i < digits; i++)
    await dialog.getByRole('button', { name: form.key.back }).click();
}

const saveButton = (dialog: Locator, isMobile: boolean, desktopName: string) =>
  dialog.getByRole('button', { name: isMobile ? form.save : desktopName, exact: true });

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
  await typeAmount(dialog, isMobile, '250');
  // No transactions yet: the category is found in All categories
  await dialog.getByRole('button', { name: form.allCategories }).click();
  await page.getByLabel(form.searchCategories).fill('groc');
  await page
    .getByRole('dialog', { name: form.category })
    .getByRole('button', { name: 'Groceries' })
    .click();
  await expect(dialog.getByRole('radio', { name: 'Groceries' })).toBeChecked();
  await dialog.getByLabel(form.note).fill('Silpo');
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
  const row = page.getByRole('button', { name: /Groceries/ });
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
  await expect(page.getByRole('button', { name: /Salary/ })).toContainText('+1 500 ₴');
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
