import { OVERVIEW } from '../../features/accounts/accountsTestData';

/** How the person signs in, or the admin (who can't delete their account here, open point 6). */
export type Who = 'password' | 'google' | 'admin';

/** Where the person is in a family: its owner with others, a member, or in none. */
export type FamilyRole = 'owner' | 'member' | 'none';

/** The word typed to confirm; any letter case counts. */
export const WORD = 'DELETE';

/** What the person has in Pup, as the API would count it for the confirmation. */
export const SUMMARY = {
  accounts: OVERVIEW.accounts.length,
  totals: OVERVIEW.totals,
  transactions: 1284,
  since: '3 Jan 2025',
  categories: 46,
} as const;

export const FAMILY = {
  name: 'Kovalenko',
  others: [
    { id: 'andriy', name: 'Andriy' },
    { id: 'sofiia', name: 'Sofiia' },
  ],
} as const;

export const ME = { name: 'Yulia Biriukova', email: 'yulia@example.com' } as const;

/** The prototype's password; anything else is "not right". */
export const PASSWORD = 'pup-budget';
