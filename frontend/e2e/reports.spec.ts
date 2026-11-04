import { expect, test, type APIRequestContext } from '@playwright/test';
import { antiforgery, newPerson, signUpThroughApi } from './auth.ts';

// Each run starts with a person of its own; cleanup.teardown.ts deletes them
test.use({ storageState: { cookies: [], origins: [] } });

// Through the API only (F-021): the Reports screen and its E2E test come with F-022
test.skip(({ isMobile }) => isMobile, 'No screen yet: once on the desktop is enough');

interface Line {
  months: (number | null)[];
  total: number | null;
  average: number | null;
}

interface Report {
  currency: string;
  months: { month: string; state: string; ratesMissing: boolean }[];
  monthsCounted: number | null;
  groups: { name: string; total: Line; categories: { name: string; amounts: Line }[] }[];
  summary: {
    income: Line;
    expenses: Line;
    net: Line;
    otherChanges: Line;
    balance: Line;
    startBalance: number | null;
  };
}

/** Kyiv's today, as the API counts it: `yyyy-MM-dd`. */
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Kyiv' }).format(new Date());
const year = today.slice(0, 4);
const month = today.slice(0, 7);
const monthIndex = Number(today.slice(5, 7)) - 1;

async function post<T>(request: APIRequestContext, url: string, data: object): Promise<T> {
  const response = await request.post(url, { headers: await antiforgery(request), data });
  expect(response.ok(), `${url}: ${String(response.status())}`).toBe(true);
  return (await response.json()) as T;
}

async function get<T>(request: APIRequestContext, url: string): Promise<T> {
  const response = await request.get(url);
  expect(response.ok(), `${url}: ${String(response.status())}`).toBe(true);
  return (await response.json()) as T;
}

async function addAccount(
  request: APIRequestContext,
  name: string,
  currency: string,
  openingBalance: number,
) {
  return post<{ id: string }>(request, '/api/accounts', {
    name,
    currency,
    source: 'Cash',
    sourceName: null,
    bankName: null,
    openingBalance,
    openingDate: `${month}-01`,
    cardStyle: 'Envelope',
  });
}

test('the yearly and monthly reports count an expense, a dollar income and an exchange', async ({
  request,
}) => {
  expect((await signUpThroughApi(request, newPerson('reports'))).ok()).toBe(true);
  const hryvnias = await addAccount(request, 'Wallet', 'UAH', 10_000);
  const dollars = await addAccount(request, 'Dollars', 'USD', 100);
  const categories = await get<{ groups: { categories: { id: string; name: string }[] }[] }>(
    request,
    '/api/categories',
  );
  const categoryId = (name: string) =>
    categories.groups
      .flatMap((group) => group.categories)
      .find((category) => category.name === name)?.id;

  const save = (data: object) =>
    post(request, '/api/transactions', { date: today, note: null, ...data });
  await save({
    type: 'Expense',
    accountId: hryvnias.id,
    categoryId: categoryId('Groceries'),
    amount: 2_500,
  });
  await save({
    type: 'Income',
    accountId: dollars.id,
    categoryId: categoryId('Salary'),
    amount: 50,
  });
  // An exchange: $20 for 800 ₴, neither income nor expense
  await save({
    type: 'Transfer',
    accountId: dollars.id,
    toAccountId: hryvnias.id,
    amount: 20,
    toAmount: 800,
  });

  // The NBU's dollar today, as the API has it (the real NBU locally, the stub in CI)
  const rates = await get<{ rates: { currency: string; rate: number }[] }>(
    request,
    `/api/rates?date=${today}`,
  );
  const dollar = rates.rates.find((rate) => rate.currency === 'USD')?.rate ?? NaN;
  const accountsTotal = await get<{ total: number }>(request, '/api/accounts/total');

  const report = await get<Report>(request, `/api/reports/year?year=${year}`);
  expect(report.currency).toBe('UAH');
  expect(report.months).toHaveLength(12);
  expect(report.months[monthIndex]?.state).toBe('Current');
  expect(report.monthsCounted).toBe(1);
  const daily = report.groups.find((group) => group.name === 'Daily living');
  expect(
    daily?.categories.find((category) => category.name === 'Groceries')?.amounts.months[monthIndex],
  ).toBe(2_500);
  expect(report.summary.expenses.months[monthIndex]).toBe(2_500);
  expect(report.summary.expenses.average).toBe(2_500);
  expect(report.summary.income.months[monthIndex]).toBeCloseTo(50 * dollar, 2);
  // This month's balance is the balance now, as on the Accounts page; nothing before the accounts were opened
  expect(report.summary.balance.months[monthIndex]).toBeCloseTo(8_300 + 130 * dollar, 2);
  expect(report.summary.balance.months[monthIndex]).toBeCloseTo(accountsTotal.total, 2);
  expect(report.summary.otherChanges.months[monthIndex]).toBeCloseTo(
    8_300 + 130 * dollar - (50 * dollar - 2_500),
    2,
  );
  if (monthIndex < 11) expect(report.summary.balance.months[11]).toBeNull();

  const monthly = await get<Report>(request, `/api/reports/month?month=${month}`);
  expect(monthly.months).toHaveLength(1);
  expect(monthly.monthsCounted).toBeNull();
  expect(monthly.summary.startBalance).toBe(0);
  expect(monthly.summary.expenses.months).toEqual([2_500]);
  expect(monthly.summary.expenses.average).toBeNull();

  const inDollars = await get<Report>(request, `/api/reports/month?month=${month}&currency=USD`);
  expect(inDollars.currency).toBe('USD');
  expect(inDollars.summary.income.months[0]).toBe(50);
  expect(inDollars.summary.expenses.months[0]).toBeCloseTo(2_500 / dollar, 4);

  const future = await request.get(`/api/reports/year?year=${String(Number(year) + 1)}`);
  expect(future.status()).toBe(400);
});
