import { DEFAULT_CATEGORIES } from '../categories/categoriesTestData';
import { addDays, today } from './days';
import { PAGE_SIZE, type Transaction } from './transactionsApi';
import { categoryId } from './transactionsTestData';

/**
 * The Transactions page's API as tests and stories fake it (F-020): the list and the summary worked out from a set of
 * transactions and the request's filters, as the backend does (`TransactionSummary.Of`). Amounts in dollars and euros
 * count at one set of NBU rates.
 */

export const RATES_TO_UAH: Record<string, number> = { UAH: 1, USD: 45.53, EUR: 48.6 };

const CATEGORY_NAMES = new Map(
  DEFAULT_CATEGORIES.groups.flatMap((group) =>
    group.categories.map((category) => [category.id, category.name] as const),
  ),
);

function matching(items: Transaction[], query: URLSearchParams, withCategory = true) {
  const from = query.get('from');
  const to = query.get('to');
  const account = query.get('accountId');
  const category = query.get('categoryId');
  const type = query.get('type');
  return items.filter(
    (item) =>
      (!from || item.date >= from) &&
      (!to || item.date <= to) &&
      (!account || item.accountId === account || item.toAccountId === account) &&
      (!withCategory || !category || item.categoryId === category) &&
      (!type || item.type === type),
  );
}

/** `GET /api/transactions`: the page from `offset`, newest first as the items come. */
export function fakePage(items: Transaction[], query: URLSearchParams) {
  const offset = Number(query.get('offset') ?? 0);
  const limit = Number(query.get('limit') ?? PAGE_SIZE);
  const found = matching(items, query);
  return {
    items: found.slice(offset, offset + limit),
    next: offset + limit < found.length ? offset + limit : null,
  };
}

/** `GET /api/transactions/summary`: in hryvnias, or in the one picked account's currency. */
export function fakeSummary(items: Transaction[], query: URLSearchParams) {
  const account = query.get('accountId');
  const currency = (account && items.find((item) => item.accountId === account)?.currency) ?? 'UAH';
  const inCurrency = (item: Transaction) =>
    item.currency === currency
      ? item.amount
      : (item.amount * (RATES_TO_UAH[item.currency] ?? 1)) / (RATES_TO_UAH[currency] ?? 1);

  const found = matching(items, query);
  const days = new Map<string, { date: string; spent: number; received: number; count: number }>();
  for (const item of found) {
    const day = days.get(item.date) ?? { date: item.date, spent: 0, received: 0, count: 0 };
    day.count++;
    if (item.type === 'Expense') day.spent += inCurrency(item);
    if (item.type === 'Income') day.received += inCurrency(item);
    days.set(item.date, day);
  }

  const type = query.get('type');
  const kind = type === 'Income' ? 'Income' : 'Expense';
  const categories = new Map<string, number>();
  if (type !== 'Transfer') {
    for (const item of matching(items, query, false)) {
      if (item.type !== kind || !item.categoryId) continue;
      categories.set(item.categoryId, (categories.get(item.categoryId) ?? 0) + inCurrency(item));
    }
  }

  const list = [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
  return {
    currency,
    spent: list.reduce((sum, day) => sum + day.spent, 0),
    received: list.reduce((sum, day) => sum + day.received, 0),
    count: found.length,
    days: list,
    categories: [...categories]
      .map(([id, amount]) => ({
        categoryId: id,
        name: CATEGORY_NAMES.get(id) ?? '',
        amount,
      }))
      .sort((a, b) => b.amount - a.amount),
    ratesMissing: false,
  };
}

const MONO: [string, string, string] = ['mono', 'Mono black', 'UAH'];
const PRIVAT: [string, string, string] = ['privat', 'Privat card', 'UAH'];
const CASH: [string, string, string] = ['cash', 'Wallet', 'UAH'];
const MONO_USD: [string, string, string] = ['mono-usd', 'Mono dollars', 'USD'];

/**
 * About two months of a Kyiv couple's spending up to today, the same every time (a seeded random), as the prototype's:
 * rent on the 1st, a salary on the 27th, groceries, eating out and the metro most days, a transfer now and then.
 */
export function twoMonths(now: string = today()): Transaction[] {
  let seed = 20261029;
  const rnd = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const pick = <T>(list: readonly T[]): T =>
    list[Math.floor(rnd() * list.length)] ?? (list[0] as T);
  const amount = (low: number, high: number) => Math.round(low + rnd() * (high - low));
  const out: Transaction[] = [];
  let id = 0;
  const add = (
    date: string,
    type: Transaction['type'],
    [accountId, accountName, currency]: [string, string, string],
    category: string | null,
    value: number,
    note: string | null = null,
    to?: [string, string, string],
    toAmount?: number,
  ) => {
    out.push({
      id: `t${String(++id)}`,
      type,
      date,
      accountId,
      accountName,
      currency,
      categoryId: category ? categoryId(category, type === 'Income' ? 'Income' : 'Expense') : null,
      categoryName: category,
      amount: value,
      note,
      ...(to && {
        toAccountId: to[0],
        toAccountName: to[1],
        toCurrency: to[2],
        toAmount: toAmount ?? value,
      }),
    });
  };

  for (let back = 60; back >= 0; back--) {
    const date = addDays(now, -back);
    const dom = Number(date.slice(8));
    if (dom === 1) add(date, 'Expense', PRIVAT, 'Rent', 18000, 'Flat on Lukianivska');
    if (dom === 3) add(date, 'Expense', MONO_USD, 'Subscriptions', 10, 'iCloud');
    if (dom === 10) add(date, 'Expense', MONO, 'Bills', amount(2900, 3500), 'Utilities');
    if (dom === 15) add(date, 'Transfer', MONO_USD, null, 100, null, MONO, 4490);
    if (dom === 27) add(date, 'Income', PRIVAT, 'Salary', 62000);
    if (dom === 28) add(date, 'Transfer', PRIVAT, null, 20000, 'For the month', MONO);
    if (rnd() < 0.62)
      add(
        date,
        'Expense',
        pick([MONO, MONO, CASH, PRIVAT]),
        'Groceries',
        amount(120, 1450),
        pick(['Silpo', 'ATB', 'Novus', null]),
      );
    if (rnd() < 0.36)
      add(
        date,
        'Expense',
        pick([CASH, MONO]),
        'Eating out',
        amount(90, 950),
        pick(['Coffee', 'Pizza', null]),
      );
    if (rnd() < 0.42)
      add(
        date,
        'Expense',
        MONO,
        'Transportation',
        pick([8, 8, 16, amount(120, 420)]),
        pick(['Metro', 'Uklon', 'Bolt']),
      );
    if (rnd() < 0.12) add(date, 'Expense', MONO, 'Delivery', amount(60, 180), 'Nova Poshta');
    if (rnd() < 0.06)
      add(
        date,
        'Expense',
        pick([MONO, CASH]),
        'Activities',
        amount(200, 1200),
        pick(['Cinema', 'Concert']),
      );
    if (rnd() < 0.04) add(date, 'Income', CASH, 'Other', amount(500, 2500), 'Cashback');
  }
  // Newest first; within a day the last added first
  return out.reverse();
}
