import type { Account } from '../accounts/accountsApi';
import type { CategoryGroup, CategoryKind } from '../categories/categoriesApi';
import type { TransactionSuggestions, TransactionType } from './transactionsApi';

/**
 * What the form picks and offers before the person does (F-018 final prototype, the owner's reviews): the last
 * account used for the type, the category last used with that account, and the most used categories as pills.
 */

/** A category as the form offers it, with its group for the search. */
export interface CategoryOption {
  id: string;
  name: string;
  group: string;
}

/** How many pills the form shows: 6 on the phone (3 lines), 8 on the desktop (owner, 2026-11-01). */
export const PILLS_PHONE = 6;
export const PILLS_DESKTOP = 8;

export function kindOf(type: TransactionType): CategoryKind {
  return type === 'Income' ? 'Income' : 'Expense';
}

/** The categories in use for the type, in the report's order. */
export function categoriesFor(groups: CategoryGroup[], type: TransactionType): CategoryOption[] {
  return groups
    .filter((group) => group.kind === kindOf(type))
    .flatMap((group) => group.categories.map((category) => ({ ...category, group: group.name })));
}

/** The account last used for the type while it is in use; otherwise the first account in use. */
export function defaultAccount(
  accounts: Account[],
  suggestions: TransactionSuggestions,
  type: TransactionType,
): string | undefined {
  const last = suggestions.lastAccounts.find((item) => item.type === type)?.accountId;
  return accounts.find((account) => account.id === last)?.id ?? accounts[0]?.id;
}

/**
 * Where a transfer from `fromId` goes when the form opens (F-019): the last transfer's To, or its From when the money
 * now leaves that account (a card's +), else the first other account in use; none when there is no other account.
 */
export function defaultTo(
  accounts: Account[],
  suggestions: TransactionSuggestions,
  fromId: string,
): string | null {
  const last = suggestions.lastTransfer;
  const candidates = [
    last?.toAccountId,
    last?.fromAccountId,
    ...accounts.map((account) => account.id),
  ];
  return (
    candidates.find(
      (id) => id !== undefined && id !== fromId && accounts.some((account) => account.id === id),
    ) ?? null
  );
}

/** The category last used with the account for the type while it is in use; none when the account has none yet. */
export function lastCategory(
  suggestions: TransactionSuggestions,
  categories: CategoryOption[],
  accountId: string,
  type: TransactionType,
): string | null {
  const last = suggestions.lastCategories.find(
    (item) => item.type === type && item.accountId === accountId,
  )?.categoryId;
  return categories.find((category) => category.id === last)?.id ?? null;
}

/** The type's most used categories in use, most used first. */
export function mostUsed(
  categories: CategoryOption[],
  suggestions: TransactionSuggestions,
  type: TransactionType,
): CategoryOption[] {
  const used = suggestions.mostUsed.find((item) => item.type === type)?.categoryIds ?? [];
  return used.flatMap((id) => categories.filter((category) => category.id === id));
}

/**
 * The pills: the type's most used categories, then the rest in the report's order, `count` in all. A picked one that
 * isn't among them comes first and the last one drops off, so there are never more.
 */
export function pills(
  categories: CategoryOption[],
  suggestions: TransactionSuggestions,
  type: TransactionType,
  count: number,
  picked?: CategoryOption,
): CategoryOption[] {
  const used = mostUsed(categories, suggestions, type);
  const rest = categories.filter((category) => !used.includes(category));
  const list = [...used, ...rest].slice(0, count);
  if (!picked || list.some((category) => category.id === picked.id)) return list;
  return [picked, ...list.slice(0, count - 1)];
}
