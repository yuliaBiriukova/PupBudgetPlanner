import { expect, test } from '@playwright/test';
import en from '../src/shared/i18n/locales/en.json' with { type: 'json' };
import { newPerson, signUpThroughApi } from './auth.ts';

// A person of its own, so the categories are the untouched default set; cleanup.teardown.ts deletes them
test.use({ storageState: { cookies: [], origins: [] } });

test('a new person sees the default categories in the report order', async ({ page, isMobile }) => {
  const response = await signUpThroughApi(page.request, newPerson('categories'));
  expect(response.ok()).toBe(true);

  await page.goto('/transactions');
  if (isMobile) {
    await page.getByRole('button', { name: en.nav.more, exact: true }).click();
    await page
      .getByRole('dialog', { name: en.nav.more })
      .getByRole('link', { name: en.nav.categories })
      .click();
  } else {
    await page
      .getByRole('navigation', { name: en.nav.main })
      .getByRole('link', { name: en.nav.categories })
      .click();
  }
  await expect(page.getByRole('heading', { level: 1, name: en.nav.categories })).toBeVisible();
  await expect(page.getByText('33 categories in 7 groups')).toBeVisible();

  if (isMobile) {
    // The groups in the report's order, all folded but Income
    const groups = page.getByRole('heading', { level: 2 });
    await expect(groups).toHaveText([
      /Income/,
      /Home expenses/,
      /Daily living/,
      /Health/,
      /Education/,
      /Entertainment/,
      /Subscriptions/,
    ]);
    await expect(page.getByRole('button', { expanded: true })).toHaveCount(1);
    const home = page.getByRole('button', { name: /Home expenses/ });
    await expect(home).toContainText('Rent, Bills, Home supplies and 6 more');

    // Several groups open at once, and they stay open after a reload
    await home.click();
    await page.getByRole('button', { name: /Health/ }).click();
    await expect(
      page.getByRole('listitem').filter({ hasText: 'Medicine/Drugs/Skincare' }),
    ).toBeVisible();
    await page.reload();
    await expect(page.getByRole('button', { expanded: true })).toHaveText([
      /Income/,
      /Home expenses/,
      /Health/,
    ]);
    await page.getByRole('button', { name: en.categories.collapseAll }).click();
    await expect(page.getByRole('button', { name: en.categories.expandAll })).toBeVisible();
  } else {
    // The list of groups, Income picked first; another group's categories beside it
    const index = page.getByRole('navigation', { name: en.categories.groups });
    await expect(index.getByRole('button')).toHaveCount(7);
    await expect(page.getByRole('region', { name: 'Income' }).getByRole('listitem')).toHaveText([
      'Salary',
      'Gifts',
      'Other',
    ]);

    await index.getByRole('button', { name: /Health/ }).click();
    await expect(index.getByRole('button', { name: /Health/ })).toHaveAttribute(
      'aria-current',
      'true',
    );
    const health = page.getByRole('region', { name: 'Health' });
    await expect(health).toContainText('Expenses, 4 categories');
    await expect(health.getByRole('listitem')).toHaveText([
      'Doctor/Dentist',
      'Medicine/Drugs/Skincare',
      'Emergency',
      'Therapy',
    ]);
  }
});
