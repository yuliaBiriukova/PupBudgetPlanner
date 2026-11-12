import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { accountsQuery } from '../accounts/accountsApi';
import { categoriesQuery } from '../categories/categoriesApi';
import type { FamilyMember } from './familyApi';
import type { AccountShare, TransactionShare } from './privacyApi';
import { FAMILY, ME, useWhose } from './whose';

/** The three shares of an account, in the order the menu offers them (F-030). */
export const ACCOUNT_SHARES: readonly AccountShare[] = ['Everything', 'BalanceOnly', 'Hidden'];

/** All your transactions, or only their totals by category. */
export const TRANSACTION_SHARES: readonly TransactionShare[] = ['Every', 'Totals'];

/** The id the API gives the hidden side of a transfer (F-030): "A private account". */
export const PRIVATE_ACCOUNT_ID = '00000000-0000-0000-0000-000000000000';

/** The parts of a line that decide whether the family sees it. */
export interface LineParts {
  accountId: string;
  toAccountId?: string | null;
  categoryId?: string | null;
}

/**
 * Whether the family doesn't see one of your lines: on an account not shared in full, or in a private category (the
 * stricter wins). "Only totals" isn't counted: then every line would be.
 */
export function isKept(
  line: LineParts,
  shareOf: (accountId: string) => AccountShare,
  privateCategories: ReadonlySet<string>,
): boolean {
  const shared = (accountId: string | null | undefined) =>
    !accountId || shareOf(accountId) === 'Everything';
  return (
    !shared(line.accountId) ||
    !shared(line.toAccountId) ||
    (!!line.categoryId && privateCategories.has(line.categoryId))
  );
}

/**
 * Whether one of your own lines is kept from the family, for the lock after its category. Asks for your accounts and
 * categories only while you are in a family with someone else in it; otherwise nothing is kept.
 */
export function useKeptLine(): (line: LineParts) => boolean {
  const { lens } = useWhose();
  const accounts = useQuery({ ...accountsQuery, enabled: lens });
  const categories = useQuery({ ...categoriesQuery, enabled: lens });
  const own = accounts.data;
  const groups = categories.data?.groups;

  if (!lens || !own || !groups) return () => false;
  const shares = new Map(
    [...own.accounts, ...own.archived].map((account) => [account.id, account.familySees]),
  );
  const kept = new Set(
    groups.flatMap((group) =>
      group.categories
        .filter((category) => group.isPrivate || category.isPrivate)
        .map((category) => category.id),
    ),
  );
  return (line) => isKept(line, (id) => shares.get(id) ?? 'Everything', kept);
}

/** Everyone in the family but you, in the order they joined. */
export function othersOf(members: readonly FamilyMember[]): FamilyMember[] {
  return members.filter((member) => !member.isYou);
}

/** Names as a list in the app's language: "Andriy", "Andriy and Iryna", "Andriy, Iryna and Petro". */
export function listOf(names: readonly string[], language: string): string {
  try {
    return new Intl.ListFormat(language, { style: 'long', type: 'conjunction' }).format(names);
  } catch {
    return names.join(', ');
  }
}

/**
 * What the band over someone else's money adds about what they keep (F-030): one member's "… keeps some of it
 * private" (on Transactions "… shares only totals" when they do), the family's "Some of …'s money is private".
 * Nothing for your own money, or when nobody keeps anything.
 */
export function useKeptText(pathname: string): string | undefined {
  const { t, i18n } = useTranslation();
  const { who, person, people } = useWhose();
  if (who === ME) return undefined;
  if (person) {
    if (person.transactions === 'Totals' && pathname.startsWith('/transactions'))
      return t('privacy.band.totals', { name: person.displayName });
    return person.keepsPrivate ? t('privacy.band.keeps', { name: person.displayName }) : undefined;
  }
  if (who !== FAMILY) return undefined;
  const keeping = people.filter((member) => !member.isYou && member.keepsPrivate);
  if (keeping.length === 0) return undefined;
  const names = keeping.map((member) => t('whose.theirs', { name: member.displayName }));
  return t('privacy.band.family', { names: listOf(names, i18n.language) });
}
