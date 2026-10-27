import {
  IconChartBar,
  IconReceipt,
  IconSettings,
  IconUsers,
  IconWallet,
  type Icon,
} from '@tabler/icons-react';

export type SectionId = 'transactions' | 'accounts' | 'reports' | 'family' | 'settings';

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

export const TAB_SECTIONS = SECTIONS.slice(0, 3);
export const MORE_SECTIONS = SECTIONS.slice(3);

/** The signed-in person shown in the shell; sign-in arrives in F-011, until then there is none. */
export interface ShellUser {
  name: string;
  email: string;
}
