import { expect, test } from '@playwright/test';
import en from '../src/shared/i18n/locales/en.json' with { type: 'json' };
import { antiforgery, newPerson, signUpThroughApi } from './auth.ts';

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
  await expect(totals).toContainText('21 501 ₴');

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

  await expect(totals).toContainText('$500');
  await expect(page.getByRole('region', { name: 'US dollar' })).toContainText('Dollars at home');

  // By source: cash and the bank (the switch's radio buttons are hidden behind their labels)
  await page
    .getByRole('radiogroup', { name: en.accounts.groupByLabel })
    .getByText(en.accounts.bySource)
    .click();
  await expect(page.getByRole('region', { name: en.accounts.cash })).toContainText('$500');
  await expect(page.getByRole('region', { name: 'Monobank' })).toContainText('Mono black');

  // Archived with money on it: it leaves the totals and waits under Archived
  await page.getByRole('button', { name: /Dollars at home/ }).click();
  await page
    .getByRole('dialog', { name: 'Edit Dollars at home' })
    .getByRole('button', { name: en.accounts.form.end.archive })
    .click();
  const ask = page.getByRole('dialog', { name: 'Archive Dollars at home?' });
  await expect(ask).toContainText('It still has $500.');
  await ask.getByRole('button', { name: en.accounts.archive.confirm }).click();
  await expect(page.getByText('Dollars at home archived')).toBeVisible();

  await expect(totals).not.toContainText('$500');
  await page.getByRole('button', { name: new RegExp(en.accounts.archived.title) }).click();
  await expect(page.getByRole('button', { name: 'Restore Dollars at home' })).toBeVisible();
});

test('a person deletes accounts for good, from the edit form and from Archived', async ({
  page,
}) => {
  const response = await signUpThroughApi(page.request, newPerson('accounts-delete'));
  expect(response.ok()).toBe(true);

  // Three accounts through the API: one to delete from the form, one to archive and then delete, one that stays
  const add = async (name: string, currency: string, openingBalance: number) => {
    const added = await page.request.post('/api/accounts', {
      headers: await antiforgery(page.request),
      data: {
        name,
        currency,
        source: 'Bank',
        sourceName: null,
        bankName: 'Monobank',
        openingBalance,
        openingDate: '2026-10-01',
        cardStyle: 'Solid',
      },
    });
    expect(added.ok()).toBe(true);
  };
  await add('Mono black', 'UAH', 1000);
  await add('Tried it', 'UAH', 250);
  await add('Old dollars', 'USD', 0);

  await page.goto('/accounts');
  const totals = page.getByRole('group', { name: en.accounts.totalsLabel });
  await expect(totals).toContainText('1 250 ₴');

  // From the edit form: Delete asks for the name; the button works only once it is typed (any case)
  await page.getByRole('button', { name: /Tried it/ }).click();
  await page
    .getByRole('dialog', { name: 'Edit Tried it' })
    .getByRole('button', { name: en.accounts.form.end.deleteButton })
    .click();
  const ask = page.getByRole('dialog', { name: 'Delete Tried it?' });
  await expect(ask).toContainText('It still has 250 ₴.');
  const confirm = ask.getByRole('button', { name: en.accounts.delete.confirm });
  await expect(confirm).toBeDisabled();
  await ask.getByRole('textbox').fill('tried IT');
  await confirm.click();
  await expect(page.getByText('Tried it deleted')).toBeVisible();

  await expect(page.getByRole('button', { name: /Tried it/ })).toHaveCount(0);
  await expect(totals).toContainText('1 000 ₴');

  // From Archived: archive it first, then delete it there
  await page.getByRole('button', { name: /Old dollars/ }).click();
  await page
    .getByRole('dialog', { name: 'Edit Old dollars' })
    .getByRole('button', { name: en.accounts.form.end.archive })
    .click();
  await page
    .getByRole('dialog', { name: 'Archive Old dollars?' })
    .getByRole('button', { name: en.accounts.archive.confirm })
    .click();
  await page.getByRole('button', { name: new RegExp(en.accounts.archived.title) }).click();
  await page.getByRole('button', { name: 'Delete Old dollars' }).click();
  const askArchived = page.getByRole('dialog', { name: 'Delete Old dollars?' });
  await askArchived.getByRole('textbox').fill('Old dollars');
  await askArchived.getByRole('button', { name: en.accounts.delete.confirm }).click();
  await expect(page.getByText('Old dollars deleted')).toBeVisible();
  await expect(
    page.getByRole('button', { name: new RegExp(en.accounts.archived.title) }),
  ).toHaveCount(0);

  // After a reload only Mono black is left, and its bank is still offered in the form
  await page.reload();
  await expect(page.getByRole('button', { name: /Mono black/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Tried it|Old dollars/ })).toHaveCount(0);
  await page.getByRole('button', { name: en.accounts.add, exact: true }).click();
  await expect(
    page
      .getByRole('dialog', { name: en.accounts.form.newTitle })
      .getByRole('radio', { name: 'Monobank' }),
  ).toBeVisible();
});
