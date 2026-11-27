import { expect, test, type APIRequestContext } from '@playwright/test';
import dayjs from 'dayjs';
import { antiforgery, newPerson, signUpThroughApi } from './auth.ts';

// Each run starts with a person of its own (jars are personal); cleanup.teardown.ts deletes them
test.use({ storageState: { cookies: [], origins: [] } });

/** Kyiv's today and its month, as the API counts them. */
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Kyiv' }).format(new Date());
const month = today.slice(0, 7);
const monthName = dayjs(`${month}-01`).format('MMMM');

/** The app writes thousands with no-break spaces: `20 000 ₴`. */
const money = (value: number) =>
  `${String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0')}\u00a0₴`;

async function send(request: APIRequestContext, method: 'post' | 'put', url: string, data: object) {
  const response = await request[method](url, { headers: await antiforgery(request), data });
  expect(response.ok(), `${method} ${url}: ${String(response.status())}`).toBe(true);
  return response.status() === 204 ? null : ((await response.json()) as { id: string });
}

/** A person with a wallet of 50 000 ₴ since the month's first day. */
async function personWithWallet(request: APIRequestContext, tag: string) {
  expect((await signUpThroughApi(request, newPerson(tag))).ok()).toBe(true);
  const wallet = await send(request, 'post', '/api/accounts', {
    name: 'Wallet',
    currency: 'UAH',
    source: 'Cash',
    sourceName: null,
    bankName: null,
    openingBalance: 50_000,
    openingDate: `${month}-01`,
    cardStyle: 'Envelope',
  });
  return wallet?.id ?? '';
}

async function newJar(request: APIRequestContext, name: string, goal: number) {
  const jar = await send(request, 'post', '/api/jars', {
    name,
    icon: 'Car',
    color: 'Blue',
    currency: 'UAH',
    goal,
    by: null,
    note: null,
  });
  return jar?.id ?? '';
}

test('a jar is made, money goes in and out, the account says what is free, and the jar closes', async ({
  page,
}) => {
  await personWithWallet(page.request, 'jars');
  await page.goto('/jars');
  await expect(page.getByRole('heading', { level: 1, name: 'Jars' })).toBeVisible();

  // A new jar with a goal
  await page.getByRole('button', { name: 'New jar' }).first().click();
  let dialog = page.getByRole('dialog', { name: 'New jar' });
  await dialog.getByLabel('Name').fill('Car');
  await dialog.getByLabel('Goal (optional)').fill('400000');
  await dialog.getByRole('button', { name: 'Add jar' }).click();
  await expect(page.getByText('Car added')).toBeVisible();
  const tile = page.getByTestId('jar-tile').filter({ hasText: 'Car' });
  await expect(tile).toContainText(`0% of ${money(400_000)}`);

  // Put in from the wallet: its balance stays, 20 000 of it is in the jar
  await page.getByRole('button', { name: 'Put in Car' }).click();
  dialog = page.getByRole('dialog', { name: 'Put into Car' });
  await expect(dialog.getByRole('button', { name: /Wallet/ })).toContainText(
    `${money(50_000)} free`,
  );
  await dialog.getByLabel('Amount', { exact: true }).fill('20000');
  await dialog.getByRole('button', { name: `Put in ${money(20_000)}` }).click();
  await expect(page.getByText(`${money(20_000)} put into Car`)).toBeVisible();
  await expect(tile).toContainText(money(20_000));
  await expect(tile).toContainText(`5% of ${money(400_000)}`);
  await expect(page.getByTestId('jars-set-aside')).toHaveText(money(20_000));
  await expect(page.getByTestId('jars-free')).toHaveText(money(30_000));
  const where = page.getByTestId('jar-money-account').filter({ hasText: 'Wallet' });
  await expect(where).toContainText(`Car ${money(20_000)}`);
  await expect(where).toContainText(`${money(30_000)} free`);

  // Take some out from the jar's window; the history has both
  await tile.click();
  dialog = page.getByRole('dialog', { name: 'Car' });
  await expect(dialog).toContainText(`${money(380_000)} to go`);
  await dialog.getByRole('button', { name: 'Take out' }).click();
  const out = page.getByRole('dialog', { name: 'Take out of Car' });
  await out.getByLabel('Amount', { exact: true }).fill('25000');
  await out.getByRole('button', { name: /^Take out/ }).click();
  await expect(
    out
      .getByRole('paragraph')
      .filter({ hasText: `Only ${money(20_000)} of the jar lies on Wallet.` }),
  ).toBeVisible();
  await out.getByLabel('Amount', { exact: true }).fill('5000');
  await out.getByRole('button', { name: `Take out ${money(5_000)}` }).click();
  await expect(page.getByText(`${money(5_000)} taken out of Car`)).toBeVisible();
  await expect(
    dialog.getByRole('paragraph').filter({ hasText: new RegExp(`^${money(15_000)}$`) }),
  ).toBeVisible();
  await dialog.getByRole('button', { name: /^History/ }).click();
  await expect(dialog.getByText('Taken out to Wallet')).toBeVisible();
  await expect(dialog.getByText('Put in from Wallet')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();

  // The Accounts page: the card says what is free above its balance, In total the split
  await page.goto('/accounts');
  await expect(page.getByRole('button', { name: /^Wallet/ })).toContainText(
    `${money(35_000)} free`,
  );
  const totals = page.getByRole('group', { name: 'Totals' });
  await expect(totals).toContainText(`Free ${money(35_000)}`);
  await expect(totals).toContainText(`In jars ${money(15_000)}`);

  // Closing asks first; then the jar is gone and its money free again
  await page.goto('/jars');
  await tile.click();
  dialog = page.getByRole('dialog', { name: 'Car' });
  await dialog.getByRole('button', { name: 'Edit Car' }).click();
  const edit = page.getByRole('dialog', { name: 'Edit Car' });
  await expect(edit.getByText('A jar with money in it keeps its currency.')).toBeVisible();
  await edit.getByRole('button', { name: 'Close jar' }).click();
  const confirm = page.getByRole('dialog', { name: 'Close Car?' });
  await expect(confirm).toContainText(`The ${money(15_000)} in it becomes free to spend`);
  await confirm.getByRole('button', { name: 'Close jar' }).click();
  await expect(page.getByText('Car closed. Its history is kept.')).toBeVisible();
  await expect(page.getByTestId('jar-tile')).toHaveCount(0);
  await expect(page.getByTestId('jars-set-aside')).toHaveText(money(0));
  await page.goto('/accounts');
  const wallet = page.getByRole('button', { name: /^Wallet/ });
  await expect(wallet).toContainText(money(50_000));
  await expect(wallet).not.toContainText('free');
});

test('jars are planned in the month within its total, and its saved money is split across them', async ({
  page,
}) => {
  const walletId = await personWithWallet(page.request, 'jars-budget');
  await newJar(page.request, 'Car', 400_000);
  await newJar(page.request, 'Laptop', 32_000);
  // This month: 30 000 in total, Daily living 10 000, 2 000 spent on food: 8 000 left of the budgets
  const categories = (await (await page.request.get('/api/categories')).json()) as {
    groups: { id: string; name: string; categories: { id: string; name: string }[] }[];
  };
  const daily = categories.groups.find((g) => g.name === 'Daily living');
  await send(page.request, 'put', '/api/budget/total', { month, amount: 30_000 });
  await send(page.request, 'put', `/api/budget/groups/${daily?.id ?? ''}`, {
    month,
    amount: 10_000,
  });
  await send(page.request, 'post', '/api/transactions', {
    type: 'Expense',
    date: today,
    note: null,
    accountId: walletId,
    categoryId: daily?.categories.find((c) => c.name === 'Food')?.id,
    amount: 2_000,
  });

  await page.goto('/budget');
  await expect(page.getByTestId('month-left')).toHaveText(money(28_000));
  const jars = page.getByRole('region', { name: 'Jars', exact: true });

  // Plan two jars
  for (const [name, amount] of [
    ['Car', '5000'],
    ['Laptop', '4000'],
  ] as const) {
    await jars.getByRole('button', { name: `Plan a jar for ${monthName}` }).click();
    const dialog = page.getByRole('dialog', { name: `Plan a jar for ${monthName}` });
    await dialog.getByRole('radio', { name }).click();
    await dialog.getByLabel(`To set aside in ${monthName}`).fill(amount);
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).toBeHidden();
  }
  const car = jars.getByTestId('budget-jar-row').filter({ hasText: 'Car' });
  const laptop = jars.getByTestId('budget-jar-row').filter({ hasText: 'Laptop' });
  await expect(car).toContainText(`${money(5_000)} to go`);
  await expect(laptop).toContainText(`${money(4_000)} to go`);
  // The jars' plan is a part of the total beside the groups, not spending
  await expect(page.getByText(`${money(11_000)} of the total isn’t in any group.`)).toBeVisible();
  const split = page.getByRole('region', { name: /^Where the .* goes$/ });
  await expect(split.getByRole('button', { name: /^Jars/ })).toContainText(money(9_000));

  // More than the month's total: refused with what goes over
  await car.click();
  let dialog = page.getByRole('dialog', { name: `Car in ${monthName}’s plan` });
  await dialog.getByLabel(`To set aside in ${monthName}`).fill('25000');
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(
    dialog.getByText(`${money(9_000)} over ${monthName}’s total of ${money(30_000)}`),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();

  // The saved money: filled by the plan, then one amount changed by hand; the rest stays free
  await expect(jars).toContainText(`${money(8_000)}left of the budgets`);
  await jars.getByRole('button', { name: 'Put into jars' }).click();
  dialog = page.getByRole('dialog', { name: `${monthName}’s saved money into jars` });
  await dialog.getByRole('button', { name: `Fill by ${monthName}’s plan` }).click();
  await expect(dialog.getByLabel('Into Car')).toHaveValue('5000');
  await expect(dialog.getByLabel('Into Laptop')).toHaveValue('3000');
  await dialog.getByLabel('Into Laptop').fill('2000');
  await expect(dialog).toContainText(`Stays free ${money(1_000)}`);
  // Each jar's account once an amount is typed: the wallet, with what of it is free
  await expect(dialog.getByRole('button', { name: /^From: Wallet/ })).toHaveCount(2);
  await expect(dialog.getByRole('button', { name: /^From: Wallet/ }).first()).toContainText(
    `${money(48_000)} free`,
  );
  await dialog.getByRole('button', { name: `Put ${money(7_000)} into jars` }).click();
  await expect(
    page.getByText(`${money(7_000)} put into jars, ${money(1_000)} stays free`),
  ).toBeVisible();
  await expect(car).toContainText('Set aside');
  await expect(laptop).toContainText(`${money(2_000)} to go`);
  await expect(jars).toContainText(`${money(7_000)} of it is in jars already.`);
  // Not an expense: the month's left doesn't change
  await expect(page.getByTestId('month-left')).toHaveText(money(28_000));

  // The jar's window names the month's saved money
  await page.goto('/jars');
  await page.getByTestId('jar-tile').filter({ hasText: 'Car' }).click();
  dialog = page.getByRole('dialog', { name: 'Car' });
  await expect(dialog).toContainText(
    `${monthName}’s plan: ${money(5_000)} of ${money(5_000)} set aside`,
  );
  await dialog.getByRole('button', { name: /^History/ }).click();
  await expect(dialog.getByText(`${monthName}’s saved money`)).toBeVisible();
});
