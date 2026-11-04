import { expect, test } from '@playwright/test';
import en from '../src/shared/i18n/locales/en.json' with { type: 'json' };
import { antiforgery, newPerson, signUpThroughApi } from './auth.ts';
import { NBU_STUB, STUB_RATES } from './nbu.ts';

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
  // The list opens over the form (a dropdown on the desktop, a sheet on the phone, F-016), not inside it
  await page.getByLabel(en.currencyPicker.search).fill('dollar');
  await page.getByRole('button', { name: /USD\s*US dollar/ }).click();
  await form.getByRole('radio', { name: en.accounts.cash }).click();
  await expect(form.getByRole('radio', { name: en.accounts.form.styles.Envelope })).toBeChecked();
  await form.getByLabel(en.accounts.form.opening).fill('500');
  await form.getByRole('button', { name: en.accounts.form.add }).click();
  await expect(page.getByText('Dollars at home added')).toBeVisible();

  await expect(totals).toContainText('$500');
  await expect(page.getByRole('region', { name: 'US dollar' })).toContainText('Dollars at home');

  // In total, in UAH at today's NBU rates (F-017): the stub's in CI, the real NBU's locally
  await expect(totals).toContainText('In total, in UAH');
  if (NBU_STUB) {
    // 21 501 + 500 × 41.35 (STUB_RATES)
    expect(STUB_RATES.USD).toBe(41.35);
    await expect(totals).toContainText(/42\s176\s₴/);
    await expect(totals).toContainText(/At NBU rates of \d{1,2} \w{3} \d{4}: \$1 = 41\.35\s₴/);
  } else {
    await expect(totals).toContainText(/At NBU rates of \d{1,2} \w{3} \d{4}: \$1 = \d+\.\d{2}\s₴/);
  }

  // By source: cash and the bank (the switch's radio buttons are hidden behind their labels)
  await page
    .getByRole('radiogroup', { name: en.accounts.groupByLabel })
    .getByText(en.accounts.bySource)
    .click();
  await expect(page.getByRole('region', { name: en.accounts.cash })).toContainText('$500');
  await expect(page.getByRole('region', { name: 'Monobank' })).toContainText('Mono black');

  // Archived with money on it: it leaves the totals and waits under Archived
  await page.getByRole('button', { name: /^Dollars at home/ }).click();
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

test('a person can’t have two accounts in use exactly alike (I-020)', async ({ page }) => {
  const response = await signUpThroughApi(page.request, newPerson('accounts-copy'));
  expect(response.ok()).toBe(true);
  const copyText = en.accounts.validation.copy;

  // Mono black at Monobank in hryvnias, through the API
  const monoBlack = {
    name: 'Mono black',
    currency: 'UAH',
    source: 'Bank',
    sourceName: null,
    bankName: 'Monobank',
    openingBalance: 1000,
    openingDate: '2026-10-01',
    cardStyle: 'Solid',
  };
  const added = await page.request.post('/api/accounts', {
    headers: await antiforgery(page.request),
    data: monoBlack,
  });
  expect(added.ok()).toBe(true);

  // The API refuses a copy itself, whatever the case and spaces: a mistake in the name
  const copy = await page.request.post('/api/accounts', {
    headers: await antiforgery(page.request),
    data: { ...monoBlack, name: ' MONO black ', bankName: 'monobank' },
  });
  expect(copy.status()).toBe(400);
  expect(await copy.json()).toMatchObject({ errors: { name: [copyText] } });

  // The form says so under the name and adds nothing
  await page.goto('/accounts');
  await page.getByRole('button', { name: en.accounts.add, exact: true }).click();
  let form = page.getByRole('dialog', { name: en.accounts.form.newTitle });
  await form.getByLabel(en.accounts.form.name, { exact: true }).fill('mono black');
  await form.getByRole('button', { name: en.accounts.form.add }).click();
  await expect(form.getByText(copyText)).toBeVisible();

  // In dollars it is another account
  await form.getByRole('button', { name: en.accounts.form.currency }).click();
  await page.getByLabel(en.currencyPicker.search).fill('dollar');
  await page.getByRole('button', { name: /USD\s*US dollar/ }).click();
  await form.getByRole('button', { name: en.accounts.form.add }).click();
  await expect(page.getByText('mono black added')).toBeVisible();

  // A closed card doesn't count: archived, the same account can be added again
  await page.getByRole('button', { name: /^Mono black/ }).click();
  await page
    .getByRole('dialog', { name: 'Edit Mono black' })
    .getByRole('button', { name: en.accounts.form.end.archive })
    .click();
  await page
    .getByRole('dialog', { name: 'Archive Mono black?' })
    .getByRole('button', { name: en.accounts.archive.confirm })
    .click();
  await expect(page.getByText('Mono black archived')).toBeVisible();
  await page.getByRole('button', { name: en.accounts.add, exact: true }).click();
  form = page.getByRole('dialog', { name: en.accounts.form.newTitle });
  await form.getByLabel(en.accounts.form.name, { exact: true }).fill('Mono black');
  await form.getByRole('button', { name: en.accounts.form.add }).click();
  await expect(page.getByText('Mono black added')).toBeVisible();

  // …but the archived one can't come back while the new one is in use
  await page.getByRole('button', { name: new RegExp(en.accounts.archived.title) }).click();
  await page.getByRole('button', { name: 'Restore Mono black' }).click();
  await expect(
    page.getByText('You already have “Mono black” in use. Rename it first, then restore this one.'),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Restore Mono black' })).toBeVisible();
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
  await page.getByRole('button', { name: /^Tried it/ }).click();
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

  await expect(page.getByRole('button', { name: /^Tried it/ })).toHaveCount(0);
  await expect(totals).toContainText('1 000 ₴');

  // From Archived: archive it first, then delete it there
  await page.getByRole('button', { name: /^Old dollars/ }).click();
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
  await expect(page.getByRole('button', { name: /^Mono black/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^(Tried it|Old dollars)/ })).toHaveCount(0);
  await page.getByRole('button', { name: en.accounts.add, exact: true }).click();
  await expect(
    page
      .getByRole('dialog', { name: en.accounts.form.newTitle })
      .getByRole('radio', { name: 'Monobank' }),
  ).toBeVisible();
});
