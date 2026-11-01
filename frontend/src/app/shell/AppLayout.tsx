import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import type { CSSProperties } from 'react';
import { Outlet } from 'react-router';
import { TransactionFormProvider } from '../../features/transactions/TransactionFormProvider';
import { useTransactionForm } from '../../features/transactions/transactionForm';
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

/**
 * The frame around every page: sidebar on desktop; top bar, tab bar and More on the phone. The + in the sidebar and the
 * tab bar opens the quick-add form (F-018), which every page inside can open too.
 */
export function AppLayout(props: AppLayoutProps) {
  return (
    <TransactionFormProvider>
      <Shell {...props} />
    </TransactionFormProvider>
  );
}

function Shell({ user, onSignOut }: AppLayoutProps) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY, false, { getInitialValueInEffect: false });
  const sidebar = useSidebar();
  const wake = useServerWake();
  const form = useTransactionForm();
  const add = () => {
    form.add();
  };
  const [moreOpened, more] = useDisclosure(false);

  return (
    <div
      className={classes.root}
      data-resizing={sidebar.resizing || undefined}
      style={{ '--sidebar-width': `${String(sidebar.columnWidth)}px` } as CSSProperties}
    >
      {isDesktop && <Sidebar state={sidebar} user={user} onAdd={add} onSignOut={onSignOut} />}
      <div className={classes.column}>
        {!isDesktop && <TopBar user={user} />}
        <WakePill waking={wake.waking} seconds={wake.seconds} />
        <main className={classes.main}>
          <div className={classes.content}>
            <Outlet />
          </div>
        </main>
        {!isDesktop && <TabBar onAdd={add} onMore={more.open} user={user} />}
      </div>
      {!isDesktop && (
        <MoreSheet opened={moreOpened} onClose={more.close} user={user} onSignOut={onSignOut} />
      )}
    </div>
  );
}
