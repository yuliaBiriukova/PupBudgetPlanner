import { expect, test, type APIRequestContext, type Locator } from '@playwright/test';
import dayjs from 'dayjs';
import en from '../src/shared/i18n/locales/en.json' with { type: 'json' };
import { openAddForm } from './add.ts';
import { antiforgery, newPerson, signUpThroughApi } from './auth.ts';

// Each run starts with a person of its own (budgets are personal); cleanup.teardown.ts deletes them
test.use({ storageState: { cookies: [], origins: [] } });

const form = en.transactions.form;

/** Kyiv's today and its month, as the API counts them; last month, which this one starts from. */
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Kyiv' }).format(new Date());
const month = today.slice(0, 7);
const lastMonth = dayjs(`${month}-01`).subtract(1, 'month').format('YYYY-MM');
const monthName = dayjs(`${month}-01`).format('MMMM');
const lastName = dayjs(`${lastMonth}-01`).format('MMMM');

/** The app writes thousands with no-break spaces: `20 000 ₴`. */
const money = (value: number) =>
  `${String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0')}\u00a0₴`;

async function send(request: APIRequestContext, method: 'post' | 'put', url: string, data: object) {
  return request[method](url, { headers: await antiforgery(request), data });
}

/** A person with a wallet, and last month planned: 20 000 in total, Daily living 10 000, Eating out 3 000. */
async function plannedLastMonth(request: APIRequestContext, tag: string) {
  expect((await signUpThroughApi(request, newPerson(tag))).ok()).toBe(true);
  const wallet = await send(request, 'post', '/api/accounts', {
    name: 'Wallet',
    currency: 'UAH',
    source: 'Cash',
    sourceName: null,
    bankName: null,
    openingBalance: 50_000,
    openingDate: `${lastMonth}-01`,
    cardStyle: 'Envelope',
  });
  expect(wallet.ok()).toBe(true);
  const categories = (await (await request.get('/api/categories')).json()) as {
    groups: { id: string; name: string; categories: { id: string; name: string }[] }[];
  };
  const group = (name: string) => categories.groups.find((g) => g.name === name)?.id ?? '';
  const category = (groupName: string, name: string) =>
    categories.groups.find((g) => g.name === groupName)?.categories.find((c) => c.name === name)
      ?.id ?? '';
  const ids = {
    wallet: ((await wallet.json()) as { id: string }).id,
    dailyLiving: group('Daily living'),
    eatingOut: category('Daily living', 'Eating out'),
    food: category('Daily living', 'Food'),
    phone: category('Subscriptions', 'Phone'),
  };
  for (const [url, amount] of [
    ['/api/budget/total', 20_000],
    [`/api/budget/groups/${ids.dailyLiving}`, 10_000],
    [`/api/budget/categories/${ids.eatingOut}`, 3_000],
  ] as const)
    expect((await send(request, 'put', url, { month: lastMonth, amount })).status()).toBe(204);
  return ids;
}

/** Types the amount: on the app's own keys on the phone, into the display on the desktop. */
async function typeAmount(dialog: Locator, isMobile: boolean, amount: string) {
  if (!isMobile) {
    await dialog.getByLabel(form.amount, { exact: true }).fill(amount);
    return;
  }
  await dialog.getByLabel(form.amount, { exact: true }).click();
  const keys = dialog.getByRole('group', { name: form.keys });
  for (const key of amount) await keys.getByRole('button', { name: key, exact: true }).click();
}

test('a month starts from the last, and what an expense leaves shows in the form, on Budget and on Transactions', async ({
  page,
  isMobile,
}) => {
  await plannedLastMonth(page.request, 'budget');

  // This month isn't planned: the banner over Transactions starts it from last month's plan
  await page.goto('/transactions');
  const banner = page.getByRole('status').filter({ hasText: `${monthName} has no budget yet.` });
  await expect(banner).toBeVisible();
  await banner.getByRole('button', { name: `Start from ${lastName}` }).click();
  await expect(page).toHaveURL(/\/budget$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(monthName);
  await expect(page.getByTestId('month-left')).toHaveText(money(20_000));
  const daily = page.getByRole('region', { name: 'Daily living' });
  await expect(daily.getByRole('button', { name: /^Daily living/ })).toContainText(
    `${money(10_000)} left`,
  );
  const eatingOut = daily.getByTestId('budget-row').filter({ hasText: 'Eating out' });
  await expect(eatingOut).toContainText(`${money(3_000)} left`);

  // The quick-add form: a category without its own budget shows its group's left under the amount
  let dialog = await openAddForm(page, isMobile);
  await typeAmount(dialog, isMobile, '500');
  const pick = async (search: string, name: string) => {
    await dialog.getByRole('button', { name: form.allCategories }).click();
    await page.getByLabel(form.searchCategories).fill(search);
    await page.getByRole('dialog', { name: form.category }).getByRole('button', { name }).click();
    await expect(dialog.getByRole('radio', { name })).toBeChecked();
  };
  await pick('clothing', 'Clothing');
  const line = dialog.getByTestId('amount-left');
  await expect(line).toHaveText(
    `In Daily living: ${money(10_000)} left, ${money(9_500)} left after this`,
  );
  // Its own budget's, and what it leaves after this one
  await pick('eating', 'Eating out');
  await expect(line).toHaveText(
    `Eating out: ${money(3_000)} left, ${money(2_500)} left after this`,
  );
  await dialog
    .getByRole('button', {
      name: isMobile ? new RegExp(`^(${form.save}|${form.saveExpense})$`) : form.saveExpense,
      exact: !isMobile,
    })
    .click();
  await expect(page.getByText('Expense saved. Wallet:')).toBeVisible();

  // Left is lower on the Budget page
  await expect(eatingOut).toContainText(`${money(2_500)} left`);
  await expect(eatingOut).toContainText(`${money(500)} of ${money(3_000)}`);
  await expect(page.getByTestId('month-left')).toHaveText(money(19_500));

  // A budget that doesn't fit its group: Save is blocked with what goes over
  await eatingOut.click();
  dialog = page.getByRole('dialog', { name: 'Eating out' });
  const field = dialog.getByLabel(`Budget for ${monthName}`);
  await expect(field).toHaveValue('3 000');
  await field.fill('12000');
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(dialog.getByRole('alert')).toHaveText(
    `Its categories add up to ${money(12_000)}, ${money(2_000)} more than Daily living’s ${money(10_000)}.`,
  );
  await field.fill('4000');
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(dialog).toBeHidden();
  await expect(eatingOut).toContainText(`${money(3_500)} left`);

  // On Transactions: the month's left and the categories closest to running out, linking to Budget
  await page.goto('/transactions');
  const summary = page.getByTestId('budget-summary');
  await expect(summary).toContainText(`${money(19_500)} left`);
  await expect(summary).toContainText('Eating out');
  // Planned now: no banner
  await expect(page.getByText(`${monthName} has no budget yet.`)).toHaveCount(0);
  await summary.click();
  await expect(page).toHaveURL(/\/budget$/);
  await expect(page.getByTestId('month-left')).toHaveText(money(19_500));
});

test('a budget can be removed, a new one added in a group, and a past month opened', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'The same page on the phone; the flow above runs on both');
  await plannedLastMonth(page.request, 'budget-edit');
  await page.goto('/budget');

  // Never planned this month: start it empty
  await expect(page.getByRole('heading', { name: `${monthName} has no budget yet` })).toBeVisible();
  await page.getByRole('button', { name: 'Start empty' }).click();
  await expect(page.getByRole('button', { name: 'Set a total' })).toBeVisible();

  // A total, then a budget for a category of Daily living
  await page.getByRole('button', { name: 'Set a total' }).click();
  let dialog = page.getByRole('dialog', { name: `${monthName} in total` });
  await dialog.getByLabel(`Budget for ${monthName}`).fill('15000');
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByTestId('month-left')).toHaveText(money(15_000));

  // Every group is open, also with nothing planned or spent in it (no accordions)
  await page.getByRole('button', { name: 'Budget for a category in Daily living' }).click();
  dialog = page.getByRole('dialog', { name: 'New budget in Daily living' });
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(dialog.getByText('Pick a category.')).toBeVisible();
  await dialog.getByRole('radio', { name: 'Food' }).click();
  // More than the month's total: refused
  await dialog.getByLabel(`Budget for ${monthName}`).fill('16000');
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(dialog.getByRole('alert')).toContainText(
    `The groups add up to ${money(16_000)}, ${money(1_000)} more than the month’s ${money(15_000)}.`,
  );
  await dialog.getByLabel(`Budget for ${monthName}`).fill('8000');
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(dialog).toBeHidden();
  const food = page
    .getByRole('region', { name: 'Daily living' })
    .getByTestId('budget-row')
    .filter({ hasText: 'Food' });
  await expect(food).toContainText(`${money(8_000)} left`);
  // Under the month: Daily living takes 8 000 of the 15 000 (its categories' sum), the rest is in no group
  const split = page.getByRole('region', { name: /^Where the .* goes$/ });
  await expect(split.getByRole('button', { name: /^Daily living/ })).toHaveText(
    new RegExp(`^Daily living${money(8_000)}53.%$`),
  );
  await expect(split).toContainText(`Not in any group${money(7_000)}47`);

  // Removed: Daily living has nothing planned or spent again
  await food.click();
  dialog = page.getByRole('dialog', { name: 'Food' });
  await dialog.getByRole('button', { name: 'Remove budget' }).click();
  await expect(dialog).toBeHidden();
  await expect(
    page
      .getByRole('region', { name: 'Daily living' })
      .getByRole('button', { name: /^Daily living/ }),
  ).toContainText('Nothing spent');
  await expect(food).toHaveCount(0);

  // Last month, planned through the API: what's left doesn't carry over
  await page.getByRole('button', { name: `${lastName} ${lastMonth.slice(0, 4)}` }).click();
  await expect(page).toHaveURL(new RegExp(`month=${lastMonth}`));
  await expect(page.getByText(`Not spent of ${money(20_000)}`)).toBeVisible();
  await expect(page.getByText('What’s left doesn’t carry over to the next month.')).toBeVisible();

  // Its plan deleted (owner's review of PR #115): the month is not planned, and can be started again
  await page.getByRole('button', { name: `Delete ${lastName}’s plan` }).click();
  dialog = page.getByRole('dialog', { name: `Delete ${lastName}’s plan?` });
  await dialog.getByRole('button', { name: 'Delete plan' }).click();
  await expect(page.getByText(`${lastName}’s plan is deleted.`)).toBeVisible();
  await expect(page.getByRole('heading', { name: `${lastName} has no budget yet` })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start empty' })).toBeVisible();
});

test('the API keeps each level within the one above it', async ({ request, isMobile }) => {
  test.skip(isMobile, 'The API is the same on the phone');
  const ids = await plannedLastMonth(request, 'budget-api');

  // Starting from the last planned month copies all three levels; a second start is a conflict
  expect(
    (await send(request, 'post', '/api/budget/start', { month, copyLast: true })).status(),
  ).toBe(204);
  expect(
    (await send(request, 'post', '/api/budget/start', { month, copyLast: false })).status(),
  ).toBe(409);
  const planned = (await (await request.get(`/api/budget?month=${month}`)).json()) as {
    planned: boolean;
    total: number;
    groups: {
      id: string;
      budget: number | null;
      categories: { id: string; budget: number | null }[];
    }[];
  };
  expect(planned.planned).toBe(true);
  expect(planned.total).toBe(20_000);
  expect(planned.groups.find((g) => g.id === ids.dailyLiving)?.budget).toBe(10_000);

  // Categories over their group, the group below its categories, the groups over the total: refused with what goes over
  const food = await send(request, 'put', `/api/budget/categories/${ids.food}`, {
    month,
    amount: 8_000,
  });
  expect(food.status()).toBe(400);
  expect(((await food.json()) as { errors: { amount: string[] } }).errors.amount[0]).toBe(
    "Its categories add up to 11,000, 1,000 more than the group's 10,000.",
  );
  expect(
    (
      await send(request, 'put', `/api/budget/groups/${ids.dailyLiving}`, { month, amount: 2_000 })
    ).status(),
  ).toBe(400);
  expect(
    (
      await send(request, 'put', `/api/budget/categories/${ids.phone}`, { month, amount: 10_001 })
    ).status(),
  ).toBe(400);
  expect((await send(request, 'put', '/api/budget/total', { month, amount: 9_000 })).status()).toBe(
    400,
  );

  // What fits is saved; no amount removes it
  expect(
    (
      await send(request, 'put', `/api/budget/categories/${ids.phone}`, { month, amount: 300 })
    ).status(),
  ).toBe(204);
  expect(
    (
      await send(request, 'put', `/api/budget/categories/${ids.eatingOut}`, { month, amount: null })
    ).status(),
  ).toBe(204);
  const after = (await (await request.get(`/api/budget?month=${month}`)).json()) as typeof planned;
  const budgets = after.groups.flatMap((g) => g.categories).filter((c) => c.budget != null);
  expect(budgets.map((c) => [c.id, c.budget])).toEqual([[ids.phone, 300]]);

  // Two months ahead is too far
  const far = dayjs(`${month}-01`).add(2, 'month').format('YYYY-MM');
  expect((await request.get(`/api/budget?month=${far}`)).status()).toBe(400);
});
