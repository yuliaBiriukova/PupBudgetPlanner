import { expect, test } from '@playwright/test';
import en from '../src/shared/i18n/locales/en.json' with { type: 'json' };
import { newPerson, signUpThroughApi } from './auth.ts';

// Each run starts with a person of its own, so the first visit has no accounts; cleanup.teardown.ts deletes them
test.use({ storageState: { cookies: [], origins: [] } });

test('a person adds accounts and sees their balances and totals, then archives one', async ({
  page,
}) => {
  // The page's own request context: the account it creates is signed in for the page too
  const response = await signUpThroughApi(page.request, newPerson('accounts'));
  expect(response.ok()).toBe(true);

  await page.goto('/accounts');
  await expect(page.getByRole('heading', { name: en.accounts.empty.title })).toBeVisible();

  // The first account: no banks yet, so the bank's name is typed (a suggestion is picked)
  await page.getByRole('button', { name: en.accounts.empty.button }).click();
  let form = page.getByRole('dialog', { name: en.accounts.form.newTitle });
  await form.getByLabel(en.accounts.form.name, { exact: true }).fill('Mono black');
  await form.getByLabel(en.accounts.form.bankName).fill('Mono');
  await form.getByRole('button', { name: 'Monobank' }).click();
  await form.getByLabel(en.accounts.form.opening).fill('21 500,50');
  await form.getByRole('button', { name: en.accounts.form.add }).click();
  await expect(page.getByText('Mono black added')).toBeVisible();

  const totals = page.getByRole('group', { name: en.accounts.totalsLabel });
  await expect(totals).toContainText('21 500.50 ₴');

  // Cash in dollars, the currency found by its name
  await page.getByRole('button', { name: en.accounts.add, exact: true }).click();
  form = page.getByRole('dialog', { name: en.accounts.form.newTitle });
  await form.getByLabel(en.accounts.form.name, { exact: true }).fill('Dollars at home');
  await form.getByRole('button', { name: en.accounts.form.currency }).click();
  await form.getByLabel(en.accounts.picker.search).fill('dollar');
  await form.getByRole('button', { name: /USD\s*US dollar/ }).click();
  await form.getByRole('radio', { name: en.accounts.cash }).click();
  await expect(form.getByRole('radio', { name: en.accounts.form.styles.Envelope })).toBeChecked();
  await form.getByLabel(en.accounts.form.opening).fill('500');
  await form.getByRole('button', { name: en.accounts.form.add }).click();
  await expect(page.getByText('Dollars at home added')).toBeVisible();

  await expect(totals).toContainText('$500.00');
  await expect(page.getByRole('region', { name: 'US dollar' })).toContainText('Dollars at home');

  // By source: cash and the bank (the switch's radio buttons are hidden behind their labels)
  await page
    .getByRole('radiogroup', { name: en.accounts.groupByLabel })
    .getByText(en.accounts.bySource)
    .click();
  await expect(page.getByRole('region', { name: en.accounts.cash })).toContainText('$500.00');
  await expect(page.getByRole('region', { name: 'Monobank' })).toContainText('Mono black');

  // Archived with money on it: it leaves the totals and waits under Archived
  await page.getByRole('button', { name: /Dollars at home/ }).click();
  await page
    .getByRole('dialog', { name: 'Edit Dollars at home' })
    .getByRole('button', { name: en.accounts.form.archive })
    .click();
  const ask = page.getByRole('dialog', { name: 'Archive Dollars at home?' });
  await expect(ask).toContainText('It still has $500.00.');
  await ask.getByRole('button', { name: en.accounts.archive.confirm }).click();
  await expect(page.getByText('Dollars at home archived')).toBeVisible();

  await expect(totals).not.toContainText('$500.00');
  await page.getByRole('button', { name: new RegExp(en.accounts.archived.title) }).click();
  await expect(page.getByRole('button', { name: 'Restore Dollars at home' })).toBeVisible();
});
