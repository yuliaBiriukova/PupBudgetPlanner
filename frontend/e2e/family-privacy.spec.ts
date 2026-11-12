import {
  expect,
  request as playwrightRequest,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test';
import en from '../src/shared/i18n/locales/en.json' with { type: 'json' };
import { antiforgery, BASE_URL, newPerson, signUpThroughApi } from './auth.ts';

// These tests sign up their own people: Olena, who starts the family, and Andriy, who joins it (F-030)
test.use({ storageState: { cookies: [], origins: [] } });

/** Kyiv's today, as the API counts it: `yyyy-MM-dd`. */
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Kyiv' }).format(new Date());
const month = today.slice(0, 7);
const PRIVATE_ACCOUNT_ID = '00000000-0000-0000-0000-000000000000';

async function send<T>(
  request: APIRequestContext,
  method: 'post' | 'put',
  url: string,
  data: object,
): Promise<T | null> {
  const response = await request[method](url, { headers: await antiforgery(request), data });
  expect(response.ok(), `${url}: ${String(response.status())}`).toBe(true);
  return response.status() === 204 ? null : ((await response.json()) as T);
}

async function get<T>(request: APIRequestContext, url: string): Promise<T> {
  const response = await request.get(url);
  expect(response.ok(), `${url}: ${String(response.status())}`).toBe(true);
  return (await response.json()) as T;
}

/** A cash account in hryvnias with 5 000 on it on the month's first day. */
async function account(request: APIRequestContext, name: string): Promise<string> {
  const made = await send<{ id: string }>(request, 'post', '/api/accounts', {
    name,
    currency: 'UAH',
    source: 'Cash',
    sourceName: null,
    bankName: null,
    openingBalance: 5_000,
    openingDate: `${month}-01`,
    cardStyle: 'Envelope',
  });
  return made?.id ?? '';
}

/** The person's expense category of that name (Gifts is in Income too). */
async function expenseCategory(request: APIRequestContext, name: string): Promise<string> {
  const categories = await get<{
    groups: { kind: string; categories: { id: string; name: string }[] }[];
  }>(request, '/api/categories');
  return (
    categories.groups
      .filter((group) => group.kind === 'Expense')
      .flatMap((group) => group.categories)
      .find((category) => category.name === name)?.id ?? ''
  );
}

/** The person's group of that name. */
async function groupId(request: APIRequestContext, name: string): Promise<string> {
  const categories = await get<{ groups: { id: string; name: string }[] }>(
    request,
    '/api/categories',
  );
  return categories.groups.find((group) => group.name === name)?.id ?? '';
}

async function spend(
  request: APIRequestContext,
  accountId: string,
  categoryId: string,
  amount: number,
) {
  await send(request, 'post', '/api/transactions', {
    type: 'Expense',
    date: today,
    accountId,
    categoryId,
    amount,
    note: 'E2E',
  });
}

/** Olena (the page's person) starts a family and Andriy joins it with her link. */
async function kovalenko(page: Page) {
  const olena = { ...newPerson('privacy-owner'), displayName: 'Olena' };
  expect((await signUpThroughApi(page.request, olena)).ok()).toBe(true);
  await send(page.request, 'post', '/api/family', { name: 'E2E Kovalenko' });
  const link = await send<{ token: string }>(page.request, 'post', '/api/family/invitations', {
    note: 'E2E Andriy',
  });

  const andriyApi = await playwrightRequest.newContext({ baseURL: BASE_URL });
  const andriy = { ...newPerson('privacy-member'), displayName: 'Andriy' };
  expect((await signUpThroughApi(andriyApi, andriy)).ok()).toBe(true);
  await send(andriyApi, 'post', '/api/family/join', { token: link?.token });
  const family = await get<{ members: { id: string; isYou: boolean }[] }>(andriyApi, '/api/family');
  return {
    andriyApi,
    andriyId: family.members.find((member) => member.isYou)?.id ?? '',
    olenaId: family.members.find((member) => !member.isYou)?.id ?? '',
  };
}

interface Line {
  amount: number;
  accountId: string;
  toAccountId: string | null;
}

test('what a member keeps is left out of the others’ money, and they still see all of theirs', async ({
  page,
  isMobile,
}) => {
  // Through the API: once on the desktop is enough
  test.skip(isMobile, 'The API is the same on the phone');
  const { andriyApi, andriyId } = await kovalenko(page);
  try {
    // Andriy: a card shared in full, pocket cash at balance only, dollars in a box hidden; Gifts private
    const card = await account(andriyApi, 'Card');
    const pocket = await account(andriyApi, 'Pocket');
    const box = await account(andriyApi, 'Box');
    const groceries = await expenseCategory(andriyApi, 'Groceries');
    const gifts = await expenseCategory(andriyApi, 'Gifts');
    await spend(andriyApi, card, groceries, 100);
    await spend(andriyApi, pocket, groceries, 20);
    await spend(andriyApi, box, groceries, 7);
    await spend(andriyApi, card, gifts, 300);
    await send(andriyApi, 'post', '/api/transactions', {
      type: 'Transfer',
      date: today,
      accountId: card,
      categoryId: null,
      amount: 50,
      note: null,
      toAccountId: box,
      toAmount: null,
    });
    await send(andriyApi, 'put', `/api/family/privacy/accounts/${pocket}`, {
      share: 'BalanceOnly',
    });
    await send(andriyApi, 'put', `/api/family/privacy/accounts/${box}`, { share: 'Hidden' });
    await send(andriyApi, 'put', `/api/family/privacy/categories/${gifts}`, { isPrivate: true });
    // A whole private group: his rent in Home expenses goes too
    await spend(andriyApi, card, await expenseCategory(andriyApi, 'Rent'), 400);
    await send(
      andriyApi,
      'put',
      `/api/family/privacy/groups/${await groupId(andriyApi, 'Home expenses')}`,
      {
        isPrivate: true,
      },
    );

    // Olena: no box, the pocket with its balance and its share; the family says Andriy keeps some
    const accounts = await get<{ accounts: { id: string; familySees: string; balance: number }[] }>(
      page.request,
      `/api/accounts?who=${andriyId}`,
    );
    expect(accounts.accounts.map((item) => item.id).sort()).toEqual([card, pocket].sort());
    expect(accounts.accounts.find((item) => item.id === pocket)).toMatchObject({
      familySees: 'BalanceOnly',
      balance: 4_980,
    });
    const family = await get<{ members: { id: string; keepsPrivate: boolean }[] }>(
      page.request,
      '/api/family',
    );
    expect(family.members.find((member) => member.id === andriyId)?.keepsPrivate).toBe(true);

    // His lines: the card's groceries, and the transfer into "a private account"; not the pocket, box or gifts
    const range = `from=${today}&to=${today}`;
    const lines = await get<{ items: Line[] }>(
      page.request,
      `/api/transactions?who=${andriyId}&${range}`,
    );
    expect(lines.items.map((item) => item.amount).sort((a, b) => a - b)).toEqual([50, 100]);
    expect(lines.items.find((item) => item.amount === 50)?.toAccountId).toBe(PRIVATE_ACCOUNT_ID);
    const hiddenOnly = await get<{ items: Line[] }>(
      page.request,
      `/api/transactions?who=${andriyId}&accountId=${box}`,
    );
    expect(hiddenOnly.items).toEqual([]);

    // His totals: the pocket's groceries count, the box's and the gifts don't
    const summary = await get<{ spent: number; count: number }>(
      page.request,
      `/api/transactions/summary?who=${andriyId}&${range}`,
    );
    expect(summary.spent).toBe(120);
    expect(summary.count).toBe(2);

    // Only totals: no lines at all, the same totals
    await send(andriyApi, 'put', '/api/family/privacy/transactions', { share: 'Totals' });
    const none = await get<{ items: Line[] }>(
      page.request,
      `/api/transactions?who=${andriyId}&${range}`,
    );
    expect(none.items).toEqual([]);
    const totals = await get<{ spent: number; count: number }>(
      page.request,
      `/api/transactions/summary?who=${andriyId}&${range}`,
    );
    expect(totals).toMatchObject({ spent: 120, count: 0 });
    const report = await get<{
      groups: { name: string }[];
      summary: { expenses: { total: number | null } };
    }>(page.request, `/api/reports/month?month=${month}&who=${andriyId}`);
    expect(report.summary.expenses.total).toBe(120);
    expect(report.groups.map((group) => group.name)).not.toContain('Home expenses');

    // Andriy himself sees all of his own
    const his = await get<{ items: Line[] }>(andriyApi, `/api/transactions?${range}`);
    expect(his.items).toHaveLength(6);
  } finally {
    await andriyApi.dispose();
  }
});

test('hiding an account on the Family page takes it from the others at once', async ({
  page,
  isMobile,
}) => {
  const { andriyApi, olenaId } = await kovalenko(page);
  try {
    await account(page.request, 'E2E Box');
    await page.goto('/family');

    const section = page.locator('section').filter({
      has: page.getByRole('heading', { name: en.privacy.title }),
    });
    await section.getByRole('button', { name: new RegExp(en.privacy.accounts.title) }).click();
    await section.getByRole('button', { name: 'E2E Box: the family sees everything' }).click();
    await page.getByRole('menuitem', { name: new RegExp(en.privacy.shares.Hidden) }).click();
    await expect(
      section.getByRole('button', { name: 'E2E Box: the family sees hidden' }),
    ).toBeVisible();

    // Andriy no longer gets it
    await expect(async () => {
      const theirs = await get<{ accounts: { name: string }[] }>(
        andriyApi,
        `/api/accounts?who=${olenaId}`,
      );
      expect(theirs.accounts.map((item) => item.name)).not.toContain('E2E Box');
    }).toPass({ timeout: 10_000 });

    // Olena's own card says it is hidden from the family
    await page.goto('/accounts');
    await expect(page.getByText(`${en.privacy.marks.hidden}:`)).toBeAttached();
    if (!isMobile) await expect(page.getByTitle(en.privacy.marks.hidden)).toBeVisible();
  } finally {
    await andriyApi.dispose();
  }
});
