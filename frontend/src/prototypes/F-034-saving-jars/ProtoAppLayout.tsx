// F-034 prototype: a copy of app/shell/AppLayout.tsx using the copied sidebar and phone bars (Jars in the menu).
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation } from 'react-router';
import { ReminderBanner } from '../../features/budget/Reminder';
import { useKeptText } from '../../features/family/privacy';
import { FAMILY, useWhose } from '../../features/family/whose';
import { WhoseBand } from '../../features/family/WhoseLens';
import { WhoseProvider } from '../../features/family/WhoseProvider';
import { TransactionFormProvider } from '../../features/transactions/TransactionFormProvider';
import { useTransactionForm } from '../../features/transactions/transactionForm';
import { InstallCard, InstallSheet } from '../../app/pwa/InstallParts';
import { useInstall, useInstallCard } from '../../app/pwa/install';
import { useOnline } from '../../app/pwa/online';
import { AddDial } from '../../app/shell/AddDial';
import classes from '../../app/shell/AppLayout.module.css';
import { MoreSheet, TabBar, TopBar } from './ProtoPhoneBars';
import { DESKTOP_QUERY, type ShellUser } from './protoSections';
import { Sidebar } from './ProtoSidebar';
import { useServerWake } from '../../app/shell/useServerWake';
import { useSidebar } from '../../app/shell/useSidebar';
import { WakePill } from '../../app/shell/WakePill';

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
 * own. In a browser that can install the app (F-025) a card, More or the sidebar offer it; without a network the top
 * pill says so.
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

/**
 * Over Transactions, Accounts and Reports when the money isn't only yours: whose it is, what they keep from you
 * (F-030), and Back to mine.
 */
function PageBand() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { who } = useWhose();
  // What they keep from you (F-030)
  const kept = useKeptText(pathname);
  if (!WHOSE_PAGES.some((path) => pathname.startsWith(path))) return null;
  const merged = who === FAMILY && pathname.startsWith('/reports') && t('whose.merged');
  return <WhoseBand>{[kept, merged].filter(Boolean).join(' ') || undefined}</WhoseBand>;
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
  const online = useOnline();
  // The installable app (F-025): on the phone a card once, then a row in More; on the desktop a row in the sidebar
  // where the browser has its own dialog (Chrome, Edge)
  const install = useInstall();
  const card = useInstallCard();
  const [installOpened, installSheet] = useDisclosure(false);
  const showCard = !isDesktop && install.way !== null && !card.dismissed;
  const moreInstall = install.way !== null && card.dismissed ? installSheet.open : undefined;
  const sidebarInstall = install.way === 'prompt' ? installSheet.open : undefined;

  return (
    <div
      className={classes.root}
      data-resizing={sidebar.resizing || undefined}
      style={{ '--sidebar-width': `${String(sidebar.columnWidth)}px` } as CSSProperties}
    >
      {isDesktop && (
        <Sidebar
          state={sidebar}
          user={user}
          onAdd={add}
          onSignOut={onSignOut}
          onInstall={sidebarInstall}
        />
      )}
      <div className={classes.column}>
        {!isDesktop && <TopBar user={user} />}
        <WakePill waking={wake.waking} seconds={wake.seconds} offline={!online} />
        <main className={classes.main}>
          <div className={classes.content}>
            {showCard && <InstallCard onInstall={installSheet.open} onDismiss={card.dismiss} />}
            <ReminderBanner />
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
        <MoreSheet
          opened={moreOpened}
          onClose={more.close}
          user={user}
          onSignOut={onSignOut}
          onInstall={moreInstall}
        />
      )}
      {install.way && (
        <InstallSheet
          opened={installOpened}
          way={install.way}
          onClose={installSheet.close}
          onInstall={() => {
            installSheet.close();
            void install.prompt();
          }}
        />
      )}
    </div>
  );
}
