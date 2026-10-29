import {
  IconChartBar,
  IconReceipt,
  IconSettings,
  IconUserShield,
  IconUsers,
  IconWallet,
  type Icon,
} from '@tabler/icons-react';

export type SectionId = 'transactions' | 'accounts' | 'reports' | 'family' | 'settings' | 'people';

export interface Section {
  id: SectionId;
  path: `/${SectionId}`;
  icon: Icon;
}

/** The app's sections in navigation order. The phone tab bar shows the first three; the rest are under More. */
export const SECTIONS: readonly Section[] = [
  { id: 'transactions', path: '/transactions', icon: IconReceipt },
  { id: 'accounts', path: '/accounts', icon: IconWallet },
  { id: 'reports', path: '/reports', icon: IconChartBar },
  { id: 'family', path: '/family', icon: IconUsers },
  { id: 'settings', path: '/settings', icon: IconSettings },
];

/** Matches Mantine's `sm` breakpoint: the sidebar from here up, the tab bar below. */
export const DESKTOP_QUERY = '(min-width: 48em)';

/** Only the admin sees these, under a line after the others (F-028). */
export const ADMIN_SECTIONS: readonly Section[] = [
  { id: 'people', path: '/people', icon: IconUserShield },
];

export const TAB_SECTIONS = SECTIONS.slice(0, 3);
export const MORE_SECTIONS = SECTIONS.slice(3);

/** The sections under More on the phone for this person: the admin's come last. */
export function moreSectionsFor(user?: ShellUser): readonly Section[] {
  return user?.isAdmin ? [...MORE_SECTIONS, ...ADMIN_SECTIONS] : MORE_SECTIONS;
}

/** The signed-in person shown in the shell; sign-in arrives in F-011, until then there is none. */
export interface ShellUser {
  name: string;
  email: string;
  /** The admin also sees People (F-028). */
  isAdmin?: boolean;
}
