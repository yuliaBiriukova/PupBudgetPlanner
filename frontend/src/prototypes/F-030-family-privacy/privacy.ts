import { createContext, useContext } from 'react';
import type { FamilyMember } from '../../features/family/familyApi';

/**
 * F-030's prototype: what the other members of the family see of a person's money (owner's answers, 2026-11-12).
 * The same for every member; set on the Family page only.
 */

/** How much of one account the family sees. */
export type Level = 'Everything' | 'BalanceOnly' | 'Hidden';

/** All your transactions, or only their totals by category. */
export type Lines = 'Every' | 'Totals';

export interface Privacy {
  lines: Lines;
  /** Accounts not at `Everything` (a new account is `Everything`). */
  accounts: Record<string, Level>;
  /** Categories the family sees nothing of. */
  categories: string[];
}

export const LEVELS: { value: Level; label: string; short: string; text: string }[] = [
  {
    value: 'Everything',
    label: 'Everything',
    short: 'Everything',
    text: 'The account, its balance and its transactions',
  },
  {
    value: 'BalanceOnly',
    label: 'Balance only',
    short: 'Balance',
    text: 'The account and its balance, none of its transactions',
  },
  { value: 'Hidden', label: 'Hidden', short: 'Hidden', text: 'Nothing of it' },
];

export const LINES: { value: Lines; label: string; text: string }[] = [
  {
    value: 'Every',
    label: 'Every transaction',
    text: 'Each line with its account, category and note, as you see it',
  },
  {
    value: 'Totals',
    label: 'Only totals by category',
    text: 'How much went on each category in a month or a year; no lines, no notes',
  },
];

export const NOTHING_PRIVATE: Privacy = { lines: 'Every', accounts: {}, categories: [] };

/** Olena's start in the stories: a hidden account, her Privat card at balance only, Gifts kept private. */
export const SOME_PRIVATE: Privacy = {
  lines: 'Every',
  accounts: { 'cash-usd': 'Hidden', privat: 'BalanceOnly' },
  categories: ['group-2-6'],
};

/** Andriy's settings, fixed in the stories: what Olena no longer sees of his money. */
export const ANDRIYS: Privacy = {
  lines: 'Every',
  accounts: { 'a-usd': 'Hidden', 'a-cash': 'BalanceOnly' },
  categories: ['group-2-6'],
};

export const levelOf = (privacy: Privacy, accountId: string): Level =>
  privacy.accounts[accountId] ?? 'Everything';

export const labelOf = (level: Level) => LEVELS.find((item) => item.value === level)?.label ?? '';

/** A line the family doesn't see: on an account not fully shared, or in a private category (the stricter wins). */
export function isKept(
  privacy: Privacy,
  item: { accountId: string; toAccountId?: string | null; categoryId?: string | null },
): boolean {
  const shared = (accountId: string | null | undefined) =>
    !accountId || levelOf(privacy, accountId) === 'Everything';
  return (
    !shared(item.accountId) ||
    !shared(item.toAccountId) ||
    (!!item.categoryId && privacy.categories.includes(item.categoryId))
  );
}

/** Whether a person keeps anything from the family. */
export const keepsAny = (privacy: Privacy) =>
  privacy.lines === 'Totals' ||
  Object.keys(privacy.accounts).length > 0 ||
  privacy.categories.length > 0;

export interface PrivacyState {
  privacy: Privacy;
  setLevel: (accountId: string, level: Level) => void;
  setLines: (lines: Lines) => void;
  setCategory: (categoryId: string, isPrivate: boolean) => void;
  /** Andriy's settings, fixed in the stories: what Olena sees of his money. */
  andriy: Privacy;
}

export const PrivacyContext = createContext<PrivacyState>({
  andriy: ANDRIYS,
  privacy: NOTHING_PRIVATE,
  setLevel: () => undefined,
  setLines: () => undefined,
  setCategory: () => undefined,
});

export function usePrivacy(): PrivacyState {
  return useContext(PrivacyContext);
}

/** Who sees your money, by name: "Andriy", "Andriy and Iryna", "Andriy, Iryna and Petro". */
export function seersOf(members: readonly FamilyMember[]): string {
  const names = members.filter((member) => !member.isYou).map((member) => member.displayName);
  if (names.length <= 1) return names[0] ?? 'The family';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1] ?? ''}`;
}

/** "sees" or "see" after `seersOf`. */
export function seeOf(members: readonly FamilyMember[]): string {
  return members.filter((member) => !member.isYou).length > 1 ? 'see' : 'sees';
}
