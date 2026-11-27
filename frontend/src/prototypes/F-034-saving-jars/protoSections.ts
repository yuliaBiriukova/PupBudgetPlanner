import { IconPigMoney } from '@tabler/icons-react';
import type { TFunction } from 'i18next';
import {
  ADMIN_SECTIONS,
  DESKTOP_QUERY,
  SECTIONS as APP_SECTIONS,
  TAB_SECTIONS,
  type Section,
  type ShellUser,
} from '../../app/shell/sections';

/** F-034's prototype: the app's sections with Jars after Budget (under More on the phone, after Budget too). */
type ProtoSection = Omit<Section, 'id' | 'path'> & { id: Section['id'] | 'jars'; path: string };

const JARS: ProtoSection = { id: 'jars', path: '/jars', icon: IconPigMoney };

export const SECTIONS: readonly ProtoSection[] = APP_SECTIONS.flatMap((s) =>
  s.id === 'budget' ? [s, JARS] : [s],
);

const MORE_SECTIONS = SECTIONS.filter((s) => !TAB_SECTIONS.some((tab) => tab.id === s.id));

export function moreSectionsFor(user?: ShellUser): readonly ProtoSection[] {
  return user?.isAdmin ? [...MORE_SECTIONS, ...ADMIN_SECTIONS] : MORE_SECTIONS;
}

/** The section's name: Jars has no i18n key yet. */
export function navLabel(t: TFunction, id: ProtoSection['id']): string {
  return id === 'jars' ? 'Jars' : t(`nav.${id}`);
}

export { ADMIN_SECTIONS, DESKTOP_QUERY, TAB_SECTIONS, type ShellUser };
