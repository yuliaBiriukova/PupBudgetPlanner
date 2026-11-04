import { DEFAULT_CATEGORIES } from '../categories/categoriesTestData';
import { addDays, today } from './days';
import type { Transaction, TransactionSuggestions } from './transactionsApi';

/** The default categories' ids by `Kind:Name` (`Expense:Groceries`), for tests and stories. */
const IDS = new Map(
  DEFAULT_CATEGORIES.groups.flatMap((group) =>
    group.categories.map((category) => [`${group.kind}:${category.name}`, category.id] as const),
  ),
);

export function categoryId(name: string, kind: 'Expense' | 'Income' = 'Expense'): string {
  return IDS.get(`${kind}:${name}`) ?? name;
}

const tx = (
  id: string,
  daysAgo: number,
  type: Transaction['type'],
  [accountId, accountName, currency]: [string, string, string],
  categoryName: string,
  amount: number,
  note: string | null = null,
): Transaction => ({
  id,
  type,
  date: addDays(today(), -daysAgo),
  accountId,
  accountName,
  currency,
  categoryId: categoryId(categoryName, type === 'Income' ? 'Income' : 'Expense'),
  categoryName,
  amount,
  note,
});

/** A transfer between two accounts (F-019): no category; `toAmount` is what To got (an exchange's own figure). */
const transfer = (
  id: string,
  daysAgo: number,
  [accountId, accountName, currency]: [string, string, string],
  [toAccountId, toAccountName, toCurrency]: [string, string, string],
  amount: number,
  toAmount: number,
  note: string | null = null,
): Transaction => ({
  id,
  type: 'Transfer',
  date: addDays(today(), -daysAgo),
  accountId,
  accountName,
  currency,
  categoryId: null,
  categoryName: null,
  amount,
  note,
  toAccountId,
  toAccountName,
  toCurrency,
  toAmount,
});

const MONO: [string, string, string] = ['mono', 'Mono black', 'UAH'];
const CASH: [string, string, string] = ['cash', 'Wallet', 'UAH'];
const PRIVAT: [string, string, string] = ['privat', 'Privat card', 'UAH'];

const MONO_USD: [string, string, string] = ['mono-usd', 'Mono dollars', 'USD'];

/** The final prototypes' latest transactions (F-018, F-019), days counted back from today. */
export function latestTransactions(): Transaction[] {
  return [
    tx('t1', 0, 'Expense', MONO, 'Groceries', 612, 'Silpo'),
    tx('t2', 0, 'Expense', CASH, 'Eating out', 380, 'Lunch with Vlad'),
    transfer('t3', 1, MONO_USD, MONO, 100, 4490),
    tx('t4', 1, 'Expense', MONO, 'Transportation', 45, 'Metro'),
    tx('t5', 2, 'Income', PRIVAT, 'Salary', 62000, 'October'),
    tx('t6', 2, 'Expense', MONO, 'Delivery', 120),
    transfer('t8', 2, MONO, CASH, 2000, 2000, 'Cash for the market'),
    tx('t7', 3, 'Expense', MONO_USD, 'Spotify', 11),
  ];
}

/**
 * What the form picks and offers for them: Mono black last, Groceries with it, the prototype's most used; dollars sold
 * into Mono black for a transfer.
 */
export const SUGGESTIONS: TransactionSuggestions = {
  lastAccounts: [
    { type: 'Expense', accountId: 'mono' },
    { type: 'Income', accountId: 'privat' },
    { type: 'Transfer', accountId: 'mono-usd' },
  ],
  lastTransfer: { fromAccountId: 'mono-usd', toAccountId: 'mono' },
  lastCategories: [
    { type: 'Expense', accountId: 'mono', categoryId: categoryId('Groceries') },
    { type: 'Expense', accountId: 'cash', categoryId: categoryId('Eating out') },
    { type: 'Income', accountId: 'privat', categoryId: categoryId('Salary', 'Income') },
  ],
  mostUsed: [
    {
      type: 'Expense',
      categoryIds: [
        'Groceries',
        'Eating out',
        'Transportation',
        'Delivery',
        'Home supplies',
        'Bills',
        'Medicine/Drugs/Skincare',
        'Activities',
      ].map((name) => categoryId(name)),
    },
    { type: 'Income', categoryIds: [categoryId('Salary', 'Income')] },
  ],
};
