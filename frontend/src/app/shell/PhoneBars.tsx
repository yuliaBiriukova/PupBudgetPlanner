import {
  ActionIcon,
  Avatar,
  UnstyledButton,
  useComputedColorScheme,
  useMantineColorScheme,
} from '@mantine/core';
import { IconDots, IconLogout, IconMoon, IconPlus, IconSun } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, useLocation } from 'react-router';
import { BottomSheet } from '../../shared/ui/BottomSheet';
import { ColorSchemeToggle } from '../../shared/ui/ColorSchemeToggle';
import { Brand } from './Logo';
import classes from './PhoneBars.module.css';
import { MORE_SECTIONS, TAB_SECTIONS, type ShellUser } from './sections';

/** Phone top bar: logo and name, the theme switch and the avatar (a link to Settings). */
export function TopBar({ user }: { user?: ShellUser }) {
  const { t } = useTranslation();

  return (
    <header className={classes.top}>
      <span className={classes.topBrand}>
        <Brand />
      </span>
      <ColorSchemeToggle variant="subtle" />
      {user && (
        <ActionIcon
          component={Link}
          to="/settings"
          variant="subtle"
          color="gray"
          size="xl"
          aria-label={t('nav.settings')}
        >
          <Avatar size={32} radius="xl" color="gray" aria-hidden="true">
            {user.name.slice(0, 1)}
          </Avatar>
        </ActionIcon>
      )}
    </header>
  );
}

interface TabBarProps {
  onAdd: () => void;
  onMore: () => void;
}

/** Phone tab bar: Transactions, Accounts, Reports and More as icons, the open one named; Add at the end. */
export function TabBar({ onAdd, onMore }: TabBarProps) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const inMore = MORE_SECTIONS.some((s) => pathname.startsWith(s.path));

  return (
    <nav className={classes.tabs} aria-label={t('nav.main')}>
      {TAB_SECTIONS.map(({ id, path, icon: Icon }) => (
        <NavLink key={id} to={path} className={classes.tab}>
          <Icon size={24} stroke={1.6} />
          <span className={classes.tabLabel}>{t(`nav.${id}`)}</span>
        </NavLink>
      ))}
      <UnstyledButton
        className={classes.tab}
        data-active={inMore || undefined}
        aria-haspopup="dialog"
        onClick={onMore}
      >
        <IconDots size={24} stroke={1.6} />
        <span className={classes.tabLabel}>{t('nav.more')}</span>
      </UnstyledButton>
      <UnstyledButton
        className={classes.add}
        aria-label={t('shell.addTransaction')}
        onClick={onAdd}
      >
        <IconPlus size={24} stroke={1.8} />
      </UnstyledButton>
    </nav>
  );
}

interface MoreSheetProps {
  opened: boolean;
  onClose: () => void;
  user?: ShellUser;
  onSignOut?: () => void;
}

/** Phone bottom sheet with the sections that don't fit the tab bar, the theme switch and sign-out. */
export function MoreSheet({ opened, onClose, user, onSignOut }: MoreSheetProps) {
  const { t } = useTranslation();
  const { setColorScheme } = useMantineColorScheme();
  const isDark = useComputedColorScheme('light', { getInitialValueInEffect: true }) === 'dark';

  return (
    <BottomSheet opened={opened} onClose={onClose} title={t('nav.more')} hideTitle>
      {MORE_SECTIONS.map(({ id, path, icon: Icon }) => (
        <NavLink key={id} to={path} className={classes.menuItem} onClick={onClose}>
          <Icon size={20} stroke={1.6} />
          {t(`nav.${id}`)}
        </NavLink>
      ))}
      <UnstyledButton
        className={classes.menuItem}
        onClick={() => {
          setColorScheme(isDark ? 'light' : 'dark');
        }}
      >
        {isDark ? <IconSun size={20} stroke={1.6} /> : <IconMoon size={20} stroke={1.6} />}
        {isDark ? t('colorScheme.light') : t('colorScheme.dark')}
      </UnstyledButton>
      {user && (
        <UnstyledButton
          className={classes.menuItem}
          onClick={() => {
            onClose();
            onSignOut?.();
          }}
        >
          <IconLogout size={20} stroke={1.6} />
          {t('shell.signOut')}
        </UnstyledButton>
      )}
    </BottomSheet>
  );
}
