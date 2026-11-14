import { UnstyledButton, useComputedColorScheme, useMantineColorScheme } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { IconLogout, IconMoon, IconSun } from '@tabler/icons-react';
import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet, useLocation } from 'react-router';
import { AddDial } from '../../app/shell/AddDial';
import classes from '../../app/shell/AppLayout.module.css';
import { TabBar, TopBar } from '../../app/shell/PhoneBars';
import phoneClasses from '../../app/shell/PhoneBars.module.css';
import { DESKTOP_QUERY, moreSectionsFor, type ShellUser } from '../../app/shell/sections';
import { useServerWake } from '../../app/shell/useServerWake';
import { useSidebar } from '../../app/shell/useSidebar';
import { WakePill } from '../../app/shell/WakePill';
import wakeClasses from '../../app/shell/WakePill.module.css';
import { useKeptText } from '../../features/family/privacy';
import { FAMILY, useWhose } from '../../features/family/whose';
import { WhoseBand } from '../../features/family/WhoseLens';
import { WhoseProvider } from '../../features/family/WhoseProvider';
import { TransactionFormProvider } from '../../features/transactions/TransactionFormProvider';
import { useTransactionForm } from '../../features/transactions/transactionForm';
import { BottomSheet } from '../../shared/ui/BottomSheet';
import { showsCard, showsRow, usePwa } from './pwa';
import { InstallCard, InstallMoreRow, OfflinePill } from './PwaParts';
import { Sidebar } from './ProtoSidebar';

interface AppLayoutProps {
  user?: ShellUser;
  onSignOut?: () => void;
}

const WHOSE_PAGES = ['/transactions', '/accounts', '/reports'];

/**
 * F-025's copy of the app's frame: the sidebar's and More's install row (variants 1 and 3), the card at the top of the
 * page on the phone (variants 2 and 3) and the offline pill in the waking-up pill's place. The rest as in the app.
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

function PageBand() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { who } = useWhose();
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
  const pwa = usePwa();
  const [moreOpened, more] = useDisclosure(false);

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
          onAdd={() => {
            form.add();
          }}
          onSignOut={onSignOut}
        />
      )}
      <div className={classes.column}>
        {!isDesktop && <TopBar user={user} />}
        {pwa.offline ? (
          <div className={wakeClasses.region} role="status" aria-live="polite">
            <OfflinePill offline />
          </div>
        ) : (
          <WakePill waking={wake.waking} seconds={wake.seconds} />
        )}
        <main className={classes.main}>
          <div className={classes.content}>
            {!isDesktop && showsCard(pwa) && <InstallCard />}
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
          onInstall={
            showsRow(pwa)
              ? () => {
                  more.close();
                  pwa.openSheet();
                }
              : undefined
          }
        />
      )}
    </div>
  );
}

interface MoreSheetProps {
  opened: boolean;
  onClose: () => void;
  user?: ShellUser;
  onSignOut?: () => void;
  /** Variants 1 and 3: the install row first. */
  onInstall?: () => void;
}

/** The app's More sheet with the install row on top. */
function MoreSheet({ opened, onClose, user, onSignOut, onInstall }: MoreSheetProps) {
  const { t } = useTranslation();
  const { setColorScheme } = useMantineColorScheme();
  const isDark = useComputedColorScheme('light', { getInitialValueInEffect: true }) === 'dark';

  return (
    <BottomSheet opened={opened} onClose={onClose} title={t('nav.more')} hideTitle>
      {onInstall && <InstallMoreRow onClick={onInstall} />}
      {moreSectionsFor(user).map(({ id, path, icon: Icon }) => (
        <NavLink key={id} to={path} replace className={phoneClasses.menuItem} onClick={onClose}>
          <Icon size={20} stroke={1.7} />
          {t(`nav.${id}`)}
        </NavLink>
      ))}
      <UnstyledButton
        className={phoneClasses.menuItem}
        onClick={() => {
          setColorScheme(isDark ? 'light' : 'dark');
        }}
      >
        {isDark ? <IconSun size={20} stroke={1.7} /> : <IconMoon size={20} stroke={1.7} />}
        {isDark ? t('colorScheme.light') : t('colorScheme.dark')}
      </UnstyledButton>
      {user && (
        <UnstyledButton
          className={phoneClasses.menuItem}
          onClick={() => {
            onClose();
            onSignOut?.();
          }}
        >
          <IconLogout size={20} stroke={1.7} />
          {t('shell.signOut')}
        </UnstyledButton>
      )}
    </BottomSheet>
  );
}
