import { describe, expect, it } from 'vitest';
import { account } from '../accounts/accountsTestData';
import { DEFAULT_CATEGORIES } from '../categories/categoriesTestData';
import {
  categoriesFor,
  defaultAccount,
  defaultTo,
  lastCategory,
  pills,
  type CategoryOption,
} from './formDefaults';
import type { TransactionSuggestions } from './transactionsApi';

const GROUPS = DEFAULT_CATEGORIES.groups;
const ACCOUNTS = [account('mono', 'Mono black'), account('cash', 'Wallet')];
const EXPENSES = categoriesFor(GROUPS, 'Expense');
const id = (name: string) => EXPENSES.find((category) => category.name === name)?.id ?? name;
const names = (list: CategoryOption[]) => list.map((category) => category.name);

const NONE: TransactionSuggestions = { lastAccounts: [], lastCategories: [], mostUsed: [] };

describe('the form picks', () => {
  it('the account last used for the type while it is in use, else the first one', () => {
    const suggestions: TransactionSuggestions = {
      ...NONE,
      lastAccounts: [
        { type: 'Expense', accountId: 'cash' },
        { type: 'Income', accountId: 'archived' },
      ],
    };

    expect(defaultAccount(ACCOUNTS, suggestions, 'Expense')).toBe('cash');
    expect(defaultAccount(ACCOUNTS, suggestions, 'Income')).toBe('mono');
    expect(defaultAccount(ACCOUNTS, NONE, 'Expense')).toBe('mono');
    expect(defaultAccount([], NONE, 'Expense')).toBeUndefined();
  });

  it('the category last used with the account, or none', () => {
    const suggestions: TransactionSuggestions = {
      ...NONE,
      lastCategories: [
        { type: 'Expense', accountId: 'mono', categoryId: id('Groceries') },
        { type: 'Expense', accountId: 'cash', categoryId: 'archived-category' },
      ],
    };

    expect(lastCategory(suggestions, EXPENSES, 'mono', 'Expense')).toBe(id('Groceries'));
    expect(lastCategory(suggestions, EXPENSES, 'cash', 'Expense')).toBeNull();
    expect(lastCategory(suggestions, EXPENSES, 'mono', 'Income')).toBeNull();
  });
});

describe('the category pills', () => {
  const suggestions: TransactionSuggestions = {
    ...NONE,
    mostUsed: [
      { type: 'Expense', categoryIds: [id('Groceries'), id('Eating out'), 'archived-category'] },
    ],
  };

  it('are the most used, then the others in the report order', () => {
    expect(names(pills(EXPENSES, suggestions, 'Expense', 4))).toEqual([
      'Groceries',
      'Eating out',
      EXPENSES[0]?.name,
      EXPENSES[1]?.name,
    ]);
  });

  it('put a picked one first and drop the last, so there are never more', () => {
    const books = EXPENSES.find((category) => category.name === 'Books');
    expect(books).toBeDefined();

    const list = pills(EXPENSES, suggestions, 'Expense', 4, books);

    expect(names(list)).toEqual(['Books', 'Groceries', 'Eating out', EXPENSES[0]?.name]);
    expect(names(pills(EXPENSES, suggestions, 'Expense', 4, list[1]))).toEqual(
      names(pills(EXPENSES, suggestions, 'Expense', 4)),
    );
  });

  it('are all the income categories when there are only a few', () => {
    const incomes = categoriesFor(GROUPS, 'Income');

    expect(pills(incomes, NONE, 'Income', 6)).toEqual(incomes);
  });
});

describe('a transfer’s To', () => {
  const three = [...ACCOUNTS, account('usd', 'Mono dollars', { currency: 'USD' })];
  const last: TransactionSuggestions = {
    ...NONE,
    lastTransfer: { fromAccountId: 'usd', toAccountId: 'mono' },
  };

  it('is the last transfer’s To', () => {
    expect(defaultTo(three, last, 'usd')).toBe('mono');
  });

  it('is the last transfer’s From when the money now leaves its To (a card’s +)', () => {
    expect(defaultTo(three, last, 'mono')).toBe('usd');
  });

  it('is the first other account in use without a transfer yet, or one no longer in use', () => {
    expect(defaultTo(three, NONE, 'mono')).toBe('cash');
    expect(
      defaultTo(
        three,
        { ...NONE, lastTransfer: { fromAccountId: 'gone', toAccountId: 'old' } },
        'usd',
      ),
    ).toBe('mono');
  });

  it('is none without another account', () => {
    expect(defaultTo([account('mono', 'Mono black')], NONE, 'mono')).toBeNull();
  });
});
