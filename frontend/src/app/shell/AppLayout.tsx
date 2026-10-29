import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import type { CSSProperties } from 'react';
import { Outlet } from 'react-router';
import { AddTransactionSheet } from './AddTransactionSheet';
import classes from './AppLayout.module.css';
import { MoreSheet, TabBar, TopBar } from './PhoneBars';
import { DESKTOP_QUERY, type ShellUser } from './sections';
import { Sidebar } from './Sidebar';
import { useServerWake } from './useServerWake';
import { useSidebar } from './useSidebar';
import { WakePill } from './WakePill';

interface AppLayoutProps {
  /** The signed-in person. */
  user?: ShellUser;
  onSignOut?: () => void;
}

/** The frame around every page: sidebar on desktop; top bar, tab bar and More on the phone. */
export function AppLayout({ user, onSignOut }: AppLayoutProps) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY, false, { getInitialValueInEffect: false });
  const sidebar = useSidebar();
  const wake = useServerWake();
  const [addOpened, add] = useDisclosure(false);
  const [moreOpened, more] = useDisclosure(false);

  return (
    <div
      className={classes.root}
      data-resizing={sidebar.resizing || undefined}
      style={{ '--sidebar-width': `${String(sidebar.columnWidth)}px` } as CSSProperties}
    >
      {isDesktop && <Sidebar state={sidebar} user={user} onAdd={add.open} onSignOut={onSignOut} />}
      <div className={classes.column}>
        {!isDesktop && <TopBar user={user} />}
        <WakePill waking={wake.waking} seconds={wake.seconds} />
        <main className={classes.main}>
          <div className={classes.content}>
            <Outlet />
          </div>
        </main>
        {!isDesktop && <TabBar onAdd={add.open} onMore={more.open} user={user} />}
      </div>
      {!isDesktop && (
        <MoreSheet opened={moreOpened} onClose={more.close} user={user} onSignOut={onSignOut} />
      )}
      <AddTransactionSheet opened={addOpened} onClose={add.close} asSheet={!isDesktop} />
    </div>
  );
}
