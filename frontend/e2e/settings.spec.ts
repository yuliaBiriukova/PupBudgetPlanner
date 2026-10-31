import { expect, test } from '@playwright/test';
import en from '../src/shared/i18n/locales/en.json' with { type: 'json' };
import { antiforgery, newPerson, signUpThroughApi } from './auth.ts';
import { NBU_STUB, STUB_RATES } from './nbu.ts';

// Each run starts with a person of its own; cleanup.teardown.ts deletes them
test.use({ storageState: { cookies: [], origins: [] } });

const saved = (currency: string) => en.settings.currencySaved.replace('{{currency}}', currency);

test('a person picks the report currency and sees their total in it, then changes their name', async ({
  page,
}) => {
  // The page's own request context: the account it creates is signed in for the page too
  const response = await signUpThroughApi(page.request, newPerson('settings'));
  expect(response.ok()).toBe(true);
  const account = await page.request.post('/api/accounts', {
    headers: await antiforgery(page.request),
    data: {
      name: 'Wallet',
      currency: 'UAH',
      source: 'Cash',
      sourceName: null,
      bankName: null,
      openingBalance: 10000,
      openingDate: '2026-10-01',
      cardStyle: 'Envelope',
    },
  });
  expect(account.ok()).toBe(true);

  await page.goto('/settings');
  const currency = page.getByRole('radiogroup', { name: en.settings.currencyTitle });
  await expect(currency.getByRole('radio', { name: en.settings.quick.UAH })).toBeChecked();
  await expect(page.getByText(/^10\s000\s₴$/)).toBeVisible();

  // US dollars: saved the moment they are picked (the radio is hidden behind its pill), the total in them
  await currency.getByText(en.settings.quick.USD).click();
  await expect(page.getByText(saved('USD'))).toBeVisible();
  await expect(currency.getByRole('radio', { name: en.settings.quick.USD })).toBeChecked();
  if (NBU_STUB) {
    // 10 000 ÷ 41.35 (STUB_RATES)
    expect(STUB_RATES.USD).toBe(41.35);
    await expect(page.getByText(/^\$242$/)).toBeVisible();
  } else {
    await expect(page.getByText(/^\$\d{3}$/)).toBeVisible();
  }

  // Any other NBU currency from the list, which opens over the page (a dropdown, or a sheet on the phone)
  await page.getByRole('button', { name: new RegExp(en.settings.anotherCurrency) }).click();
  await page.getByLabel(en.currencyPicker.search).fill('zlo');
  await page.getByRole('button', { name: /PLN\s*Polish zloty/ }).click();
  await expect(page.getByText(saved('PLN'))).toBeVisible();
  await expect(currency.getByRole('radio', { checked: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Another currency: PLN/ })).toBeVisible();

  // The Accounts page totals in it too, with the rates in hryvnias as the NBU gives them
  await page.goto('/accounts');
  const totals = page.getByRole('group', { name: en.accounts.totalsLabel });
  await expect(totals).toContainText('In total, in PLN');
  if (NBU_STUB) {
    // 10 000 ÷ 11.3
    await expect(totals).toContainText(/885\sPLN/);
    await expect(totals).toContainText(/1\sPLN = 11\.30\s₴/);
  } else {
    await expect(totals).toContainText(/1\sPLN = \d+\.\d{2}\s₴/);
  }

  // The name: Save shows once it differs, and it stays after a reload
  await page.goto('/settings');
  const name = page.getByLabel(en.settings.name, { exact: true });
  await expect(name).toHaveValue('Olena');
  await expect(page.getByRole('button', { name: en.settings.saveName })).toHaveCount(0);
  await name.fill('Olena K.');
  await page.getByRole('button', { name: en.settings.saveName }).click();
  await expect(page.getByText(en.settings.nameSaved)).toBeVisible();
  await page.reload();
  await expect(page.getByLabel(en.settings.name, { exact: true })).toHaveValue('Olena K.');
});
