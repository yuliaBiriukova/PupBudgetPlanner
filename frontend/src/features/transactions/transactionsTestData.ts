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
  categoryId: categoryId(categoryName, type),
  categoryName,
  amount,
  note,
});

const MONO: [string, string, string] = ['mono', 'Mono black', 'UAH'];
const CASH: [string, string, string] = ['cash', 'Wallet', 'UAH'];
const PRIVAT: [string, string, string] = ['privat', 'Privat card', 'UAH'];

/** The final prototype's latest transactions (F-018), days counted back from today. */
export function latestTransactions(): Transaction[] {
  return [
    tx('t1', 0, 'Expense', MONO, 'Groceries', 612, 'Silpo'),
    tx('t2', 0, 'Expense', CASH, 'Eating out', 380, 'Lunch with Vlad'),
    tx('t4', 1, 'Expense', MONO, 'Transportation', 45, 'Metro'),
    tx('t5', 2, 'Income', PRIVAT, 'Salary', 62000, 'October'),
    tx('t6', 2, 'Expense', MONO, 'Delivery', 120),
    tx('t7', 3, 'Expense', ['mono-usd', 'Mono dollars', 'USD'], 'Spotify', 11),
  ];
}

/** What the form picks and offers for them: Mono black last, Groceries with it, the prototype's most used. */
export const SUGGESTIONS: TransactionSuggestions = {
  lastAccounts: [
    { type: 'Expense', accountId: 'mono' },
    { type: 'Income', accountId: 'privat' },
  ],
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
