import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import en from '../src/shared/i18n/locales/en.json' with { type: 'json' };
import { openAddForm } from './add.ts';
import { antiforgery, newPerson, signUpThroughApi } from './auth.ts';

// A person of its own, so the categories are the untouched default set; cleanup.teardown.ts deletes them
test.use({ storageState: { cookies: [], origins: [] } });

const sheet = en.categories.sheet;

/** A group's tags, without its + Add. */
const tagsOf = (page: Page, group: string) =>
  page
    .getByRole('button', { name: new RegExp(`^${group}`) })
    .locator('xpath=ancestor::section[1]')
    .getByRole('listitem')
    .filter({ hasNotText: en.categories.edit.add });

/** Opens a group: its row on the phone (unless it is open), its button in the list on the desktop. */
async function openGroup(page: Page, isMobile: boolean, name: string) {
  if (isMobile) {
    const row = page.getByRole('button', { name: new RegExp(`^${name}`) });
    if ((await row.getAttribute('aria-expanded')) === 'false') await row.click();
  } else {
    await page
      .getByRole('navigation', { name: en.categories.groups })
      .getByRole('button', { name: new RegExp(`^${name}`) })
      .click();
  }
}

/** Opens a group's sheet: its pencil on the phone; on the desktop Edit group once it is picked. */
async function editGroup(page: Page, isMobile: boolean, name: string) {
  if (isMobile) {
    await page.getByRole('button', { name: `Edit the group ${name}` }).click();
  } else {
    await openGroup(page, false, name);
    await page.getByRole('button', { name: en.categories.edit.group }).click();
  }
}

/** The tags of the open group: under its row on the phone, beside the list on the desktop. */
const openTags = (page: Page, isMobile: boolean, name: string) =>
  isMobile
    ? tagsOf(page, name)
    : page
        .getByRole('region', { name })
        .getByRole('listitem')
        .filter({ hasNotText: en.categories.edit.add });

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
    const home = page.getByRole('button', { name: /^Home expenses/ });
    await expect(home).toContainText('Rent, Bills, Home supplies and 6 more');

    // Several groups open at once, and they stay open after a reload
    await home.click();
    await page.getByRole('button', { name: /^Health/ }).click();
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
    await expect(index.getByRole('button', { name: /^(?!Add)/ })).toHaveCount(7);
    await expect(openTags(page, false, 'Income')).toHaveText(['Salary', 'Gifts', 'Other']);

    await index.getByRole('button', { name: /^Health/ }).click();
    await expect(index.getByRole('button', { name: /^Health/ })).toHaveAttribute(
      'aria-current',
      'true',
    );
    const health = page.getByRole('region', { name: 'Health' });
    await expect(health).toContainText('Expenses, 4 categories');
    await expect(openTags(page, false, 'Health')).toHaveText([
      'Doctor/Dentist',
      'Medicine/Drugs/Skincare',
      'Emergency',
      'Therapy',
    ]);
  }
});

test('a person adds, renames, reorders, moves and deletes a category and a group (F-029)', async ({
  page,
  isMobile,
}) => {
  expect((await signUpThroughApi(page.request, newPerson('categories-edit'))).ok()).toBe(true);
  await page.goto('/categories');
  await expect(page.getByText('33 categories in 7 groups')).toBeVisible();

  // A new category at the end of Education
  await openGroup(page, isMobile, 'Education');
  await page.getByRole('button', { name: 'Add a category to Education' }).click();
  let dialog = page.getByRole('dialog', { name: sheet.newCategory });
  await dialog.getByRole('textbox', { name: sheet.name }).fill('Swimming');
  await dialog.getByRole('button', { name: sheet.add }).click();
  await expect(page.getByText('“Swimming” added')).toBeVisible();
  await expect(openTags(page, isMobile, 'Education')).toHaveText([
    'English lessons',
    'Piano lessons',
    'Driving',
    'Swimming',
  ]);

  // Renamed and moved first, by the keyboard
  await page.getByRole('button', { name: 'Swimming', exact: true }).click();
  dialog = page.getByRole('dialog', { name: sheet.editCategory });
  await dialog.getByRole('textbox', { name: sheet.name }).fill('Pool');
  const up = dialog.getByRole('button', { name: 'Move “Pool” up' });
  for (let step = 0; step < 3; step++) {
    await up.focus();
    await page.keyboard.press('Enter');
  }
  await expect(up).toBeDisabled();
  await dialog.getByRole('button', { name: sheet.save }).click();
  await expect(page.getByText('“Pool” saved')).toBeVisible();
  await expect(openTags(page, isMobile, 'Education')).toHaveText([
    'Pool',
    'English lessons',
    'Piano lessons',
    'Driving',
  ]);

  // Moved to another group of its kind, at its end
  await page.getByRole('button', { name: 'Pool', exact: true }).click();
  dialog = page.getByRole('dialog', { name: sheet.editCategory });
  await dialog.getByRole('radio', { name: 'Health' }).click();
  await dialog.getByRole('button', { name: sheet.save }).click();
  await expect(page.getByText('“Pool” moved to Health')).toBeVisible();
  await openGroup(page, isMobile, 'Health');
  await expect(openTags(page, isMobile, 'Health')).toHaveText([
    'Doctor/Dentist',
    'Medicine/Drugs/Skincare',
    'Emergency',
    'Therapy',
    'Pool',
  ]);

  // Never used, so it's deleted for good
  await page.getByRole('button', { name: 'Pool', exact: true }).click();
  dialog = page.getByRole('dialog', { name: sheet.editCategory });
  await expect(dialog).toContainText(sheet.deleteWhy);
  await dialog.getByRole('button', { name: sheet.delete }).click();
  await page
    .getByRole('dialog', { name: 'Delete “Pool”?' })
    .getByRole('button', { name: sheet.delete })
    .click();
  await expect(page.getByText('“Pool” deleted')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pool', exact: true })).toHaveCount(0);

  // A new expense group, renamed and moved first among the expense groups, then deleted while empty
  await page.getByRole('button', { name: en.categories.edit.addGroup.Expense }).click();
  dialog = page.getByRole('dialog', { name: sheet.newGroup });
  await dialog.getByRole('textbox', { name: sheet.name }).fill('Car');
  await dialog.getByRole('button', { name: sheet.add }).click();
  await expect(page.getByText('Group “Car” added')).toBeVisible();

  await editGroup(page, isMobile, 'Car');
  dialog = page.getByRole('dialog', { name: sheet.editGroup });
  await dialog.getByRole('textbox', { name: sheet.name }).fill('Auto');
  for (let step = 0; step < 6; step++)
    await dialog.getByRole('button', { name: 'Move “Auto” up' }).click();
  await dialog.getByRole('button', { name: sheet.save }).click();
  await expect(page.getByText('Group “Auto” saved')).toBeVisible();
  const order = isMobile
    ? page.getByRole('heading', { level: 2 })
    : page
        .getByRole('navigation', { name: en.categories.groups })
        .getByRole('button', { name: /^(?!Add)/ });
  await expect(order.nth(1)).toHaveText(/^Auto/);

  await editGroup(page, isMobile, 'Auto');
  dialog = page.getByRole('dialog', { name: sheet.editGroup });
  await expect(dialog).toContainText(sheet.groupDelete);
  await dialog.getByRole('button', { name: sheet.delete }).click();
  await page
    .getByRole('dialog', { name: 'Delete the group “Auto”?' })
    .getByRole('button', { name: sheet.delete })
    .click();
  await expect(page.getByText('Group “Auto” deleted')).toBeVisible();
  await expect(page.getByText('33 categories in 7 groups')).toBeVisible();
});

async function post<T>(request: APIRequestContext, url: string, data: object): Promise<T> {
  const response = await request.post(url, { headers: await antiforgery(request), data });
  expect(response.ok(), `${url}: ${String(response.status())}`).toBe(true);
  return (await response.json()) as T;
}

test('a hidden category leaves the quick-add form, stays in the report and comes back (F-029)', async ({
  page,
  isMobile,
}) => {
  expect((await signUpThroughApi(page.request, newPerson('categories-hide'))).ok()).toBe(true);
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Kyiv' }).format(new Date());
  const wallet = await post<{ id: string }>(page.request, '/api/accounts', {
    name: 'Wallet',
    currency: 'UAH',
    source: 'Cash',
    sourceName: null,
    bankName: null,
    openingBalance: 5_000,
    openingDate: `${today.slice(0, 7)}-01`,
    cardStyle: 'Envelope',
  });
  const categories = (await (await page.request.get('/api/categories')).json()) as {
    groups: { categories: { id: string; name: string }[] }[];
  };
  const groceries = categories.groups
    .flatMap((group) => group.categories)
    .find((category) => category.name === 'Groceries');
  await post(page.request, '/api/transactions', {
    type: 'Expense',
    date: today,
    note: null,
    accountId: wallet.id,
    categoryId: groceries?.id,
    amount: 640,
  });

  // Hidden, not deleted: it has a transaction
  await page.goto('/categories');
  await openGroup(page, isMobile, 'Daily living');
  await page.getByRole('button', { name: 'Groceries', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: sheet.editCategory });
  await expect(dialog).toContainText('It has 1 transaction, so it’s hidden, not deleted.');
  await dialog.getByRole('button', { name: sheet.hide }).click();
  await page
    .getByRole('dialog', { name: 'Hide “Groceries”?' })
    .getByRole('button', { name: sheet.hide })
    .click();
  await expect(page.getByText('“Groceries” hidden. Its transactions keep it')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Groceries, hidden' })).toBeVisible();

  // The quick-add form doesn't offer it
  await openAddForm(page, isMobile);
  const form = en.transactions.form;
  const add = page.getByRole('dialog', { name: 'Add expense' });
  await add.getByRole('button', { name: form.allCategories }).click();
  await page.getByLabel(form.searchCategories).fill('groc');
  await expect(page.getByText('No category matches “groc”.')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');

  // The month's report still shows it with its amount
  await page.goto(`/reports?month=${today.slice(0, 7)}`);
  await expect(page.getByRole('region', { name: 'Daily living' })).toContainText(/Groceries/);
  await expect(page.getByRole('region', { name: 'Daily living' })).toContainText(/640/);

  // Shown again, at the end of its group
  await page.goto('/categories');
  await openGroup(page, isMobile, 'Daily living');
  await page.getByRole('button', { name: 'Groceries, hidden' }).click();
  await page
    .getByRole('dialog', { name: '“Groceries” is hidden' })
    .getByRole('button', { name: sheet.showAgain })
    .click();
  await expect(page.getByText('“Groceries” is back in Daily living')).toBeVisible();
  await expect(openTags(page, isMobile, 'Daily living').last()).toHaveText('Groceries');
});
