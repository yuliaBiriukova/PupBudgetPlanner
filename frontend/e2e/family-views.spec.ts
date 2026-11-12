import {
  expect,
  request as playwrightRequest,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test';
import en from '../src/shared/i18n/locales/en.json' with { type: 'json' };
import { antiforgery, BASE_URL, newPerson, signUpThroughApi } from './auth.ts';

// These tests sign up their own people: Olena, who starts the family, and Andriy, who joins it
test.use({ storageState: { cookies: [], origins: [] } });

/** Kyiv's today, as the API counts it: `yyyy-MM-dd`. */
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Kyiv' }).format(new Date());
const month = today.slice(0, 7);

async function post<T>(request: APIRequestContext, url: string, data: object): Promise<T | null> {
  const response = await request.post(url, { headers: await antiforgery(request), data });
  expect(response.ok(), `${url}: ${String(response.status())}`).toBe(true);
  return response.status() === 204 ? null : ((await response.json()) as T);
}

async function get<T>(request: APIRequestContext, url: string): Promise<T> {
  const response = await request.get(url);
  expect(response.ok(), `${url}: ${String(response.status())}`).toBe(true);
  return (await response.json()) as T;
}

/** A cash account in hryvnias and an expense on it today, in the person's own Groceries. */
async function spendOnGroceries(request: APIRequestContext, amount: number) {
  const wallet = await post<{ id: string }>(request, '/api/accounts', {
    name: 'Wallet',
    currency: 'UAH',
    source: 'Cash',
    sourceName: null,
    bankName: null,
    openingBalance: 5_000,
    openingDate: `${month}-01`,
    cardStyle: 'Envelope',
  });
  const categories = await get<{ groups: { categories: { id: string; name: string }[] }[] }>(
    request,
    '/api/categories',
  );
  const groceries = categories.groups
    .flatMap((group) => group.categories)
    .find((category) => category.name === 'Groceries');
  return post<{ transaction: { id: string } }>(request, '/api/transactions', {
    type: 'Expense',
    date: today,
    accountId: wallet?.id,
    categoryId: groceries?.id,
    amount,
    note: null,
  });
}

interface Report {
  groups: { name: string; categories: { name: string; amounts: { total: number | null } }[] }[];
  summary: { expenses: { total: number | null } };
}

const groceriesOf = (report: Report) =>
  report.groups
    .flatMap((group) => group.categories)
    .filter((category) => category.name === 'Groceries')
    .map((category) => category.amounts.total);

/**
 * Olena (the page's person) starts a family and Andriy joins it with her link; each spends on Groceries. Returns
 * Andriy's API and his id.
 */
async function kovalenko(page: Page) {
  const olena = { ...newPerson('views-owner'), displayName: 'Olena' };
  expect((await signUpThroughApi(page.request, olena)).ok()).toBe(true);
  await post(page.request, '/api/family', { name: 'E2E Kovalenko' });
  const link = await post<{ token: string }>(page.request, '/api/family/invitations', {
    note: 'E2E Andriy',
  });

  const andriyApi = await playwrightRequest.newContext({ baseURL: BASE_URL });
  const andriy = { ...newPerson('views-member'), displayName: 'Andriy' };
  expect((await signUpThroughApi(andriyApi, andriy)).ok()).toBe(true);
  await post(andriyApi, '/api/family/join', { token: link?.token });
  const family = await get<{ members: { id: string; isYou: boolean }[] }>(andriyApi, '/api/family');
  const andriyId = family.members.find((member) => member.isYou)?.id ?? '';

  const olenas = await spendOnGroceries(page.request, 1_000);
  await spendOnGroceries(andriyApi, 600);
  return { andriyApi, andriyId, olenasTransaction: olenas?.transaction.id ?? '' };
}

/** Picks whose money in the shell's lens: the sidebar's row, or the phone's pill and its sheet. */
async function pickWhose(page: Page, name: RegExp) {
  await page.getByRole('button', { name: new RegExp(en.whose.lens) }).click();
  await page.getByRole('button', { name }).click();
}

test('a member sees another’s money and the family’s, but changes only their own', async ({
  page,
  isMobile,
}) => {
  // Through the API: once on the desktop is enough
  test.skip(isMobile, 'The API is the same on the phone');
  const { andriyApi, andriyId, olenasTransaction } = await kovalenko(page);
  try {
    const stranger = newPerson('views-stranger');
    const strangerApi = await playwrightRequest.newContext({ baseURL: BASE_URL });
    try {
      expect((await signUpThroughApi(strangerApi, stranger)).ok()).toBe(true);

      // The family's report merges their Groceries; Andriy's has only his
      const family = await get<Report>(
        page.request,
        `/api/reports/month?month=${month}&who=family`,
      );
      expect(groceriesOf(family)).toEqual([1_600]);
      expect(family.summary.expenses.total).toBe(1_600);
      const his = await get<Report>(
        page.request,
        `/api/reports/month?month=${month}&who=${andriyId}`,
      );
      expect(groceriesOf(his)).toEqual([600]);
      const list = await get<{ items: { ownerId: string; amount: number }[] }>(
        page.request,
        `/api/transactions?who=family&from=${today}&to=${today}`,
      );
      expect(list.items.map((item) => item.amount).sort()).toEqual([1_000, 600]);

      // Someone outside the family sees none of it, and Andriy can't change Olena's expense
      const outside = await strangerApi.get(`/api/accounts?who=${andriyId}`);
      expect(outside.status()).toBe(404);
      const change = await andriyApi.delete(`/api/transactions/${olenasTransaction}`, {
        headers: await antiforgery(andriyApi),
      });
      expect(change.status()).toBe(404);
    } finally {
      await strangerApi.dispose();
    }
  } finally {
    await andriyApi.dispose();
  }
});

test('a member’s expense appears in the family’s report, and their lines open nothing', async ({
  page,
  isMobile,
}) => {
  const { andriyApi } = await kovalenko(page);
  try {
    await page.goto('/reports');
    await pickWhose(page, /^.?.?Family/);
    await expect(page.getByText(en.whose.familyMoney)).toBeVisible();
    await expect(page.getByText(en.whose.merged)).toBeVisible();

    if (isMobile) {
      await expect(page.getByRole('list', { name: en.reports.phone.months })).toContainText(
        /out 1\s600\s₴/,
      );
    } else {
      const table = page.getByRole('table');
      await table.getByRole('button', { name: 'Daily living' }).click();
      await expect(table.getByRole('row', { name: /^Groceries/ })).toContainText(/1\s600/);
    }

    // Andriy's money on Transactions: his line is there, only to look at; the slip has no Add
    await page.goto('/transactions');
    await pickWhose(page, /^.?Andriy/);
    await expect(page.getByText('Andriy’s money.')).toBeVisible();
    const line = page
      .getByRole('region', { name: /^Today/ })
      .locator('li')
      .filter({ hasText: /^Groceries/ });
    await expect(line).toHaveCount(1);
    await expect(line.getByRole('button')).toHaveCount(0);
    // Only the sidebar's Add is left on the desktop (it adds Olena's own); the phone's + is a button of its own
    const add = page.getByRole('button', { name: en.shell.addTransaction, exact: true });
    await expect(add).toHaveCount(isMobile ? 0 : 1);

    // Back to mine: Olena's own line opens her form again, and the slip can add again
    await page.getByRole('button', { name: en.whose.backToMine }).click();
    await expect(page.getByText('Andriy’s money.')).toHaveCount(0);
    await expect(line.getByRole('button')).toHaveCount(1);
    await expect(add).toHaveCount(isMobile ? 1 : 2);
  } finally {
    await andriyApi.dispose();
  }
});
