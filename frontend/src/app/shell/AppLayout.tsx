import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation } from 'react-router';
import { FAMILY, useWhose } from '../../features/family/whose';
import { WhoseBand } from '../../features/family/WhoseLens';
import { WhoseProvider } from '../../features/family/WhoseProvider';
import { TransactionFormProvider } from '../../features/transactions/TransactionFormProvider';
import { useTransactionForm } from '../../features/transactions/transactionForm';
import { AddDial } from './AddDial';
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

/** The pages whose money can be someone else's or the family's (F-024). */
const WHOSE_PAGES = ['/transactions', '/accounts', '/reports'];

/**
 * The frame around every page: sidebar on desktop; top bar, tab bar and More on the phone. The sidebar's Add and the
 * phone's floating + (its ⇄ + −, I-030) open the quick-add form (F-018), which every page inside can open too. In a
 * family the lens of whose money (F-024) sits in the sidebar and the phone's top bar; the Add buttons still add your
 * own.
 */
export function AppLayout(props: AppLayoutProps) {
  return (
    <WhoseProvider>
      <TransactionFormProvider>
        <Shell {...props} />
      </TransactionFormProvider>
    </WhoseProvider>
  );
}

/** Over Transactions, Accounts and Reports when the money isn't only yours: whose it is, and Back to mine. */
function PageBand() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { who } = useWhose();
  if (!WHOSE_PAGES.some((path) => pathname.startsWith(path))) return null;
  return (
    <WhoseBand>{who === FAMILY && pathname.startsWith('/reports') && t('whose.merged')}</WhoseBand>
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
            <PageBand />
            <Outlet />
          </div>
        </main>
        {!isDesktop && (
          <div className={classes.bottom}>
            <AddDial
              onAdd={(type) => {
                form.add({ type });
              }}
            />
            <TabBar onMore={more.open} user={user} />
          </div>
        )}
      </div>
      {!isDesktop && (
        <MoreSheet opened={moreOpened} onClose={more.close} user={user} onSignOut={onSignOut} />
      )}
    </div>
  );
}
