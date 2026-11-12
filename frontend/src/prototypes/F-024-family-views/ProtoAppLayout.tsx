import { ActionIcon, Avatar } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Outlet, useLocation } from 'react-router';
import { AddDial } from '../../app/shell/AddDial';
import classes from '../../app/shell/AppLayout.module.css';
import { Brand } from '../../app/shell/Logo';
import { MoreSheet, TabBar, TopBar } from '../../app/shell/PhoneBars';
import barClasses from '../../app/shell/PhoneBars.module.css';
import { DESKTOP_QUERY, type ShellUser } from '../../app/shell/sections';
import { Sidebar } from '../../app/shell/Sidebar';
import { useServerWake } from '../../app/shell/useServerWake';
import { useSidebar } from '../../app/shell/useSidebar';
import { WakePill } from '../../app/shell/WakePill';
import { TransactionFormProvider } from '../../features/transactions/TransactionFormProvider';
import { useTransactionForm } from '../../features/transactions/transactionForm';
import { ProtoSidebar } from './ProtoSidebar';
import { Lens, WhoseLine } from './Switchers';
import { useWhoState } from './who';

interface AppLayoutProps {
  user?: ShellUser;
}

/** The pages whose money can be someone else's (F-024). */
const SCOPED = ['/transactions', '/accounts', '/reports'];

/**
 * The app's shell (`AppLayout`), copied for F-024's final prototype: the lens of whose money sits in the sidebar and
 * the phone's top bar, and the three pages get a band saying whose money they show. With no family, the shell as now.
 */
export function ProtoAppLayout(props: AppLayoutProps) {
  return (
    <TransactionFormProvider>
      <Shell {...props} />
    </TransactionFormProvider>
  );
}

function Shell({ user }: AppLayoutProps) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY, false, { getInitialValueInEffect: false });
  const sidebar = useSidebar();
  const wake = useServerWake();
  const form = useTransactionForm();
  const [moreOpened, more] = useDisclosure(false);
  const { people, who, setWho } = useWhoState();
  const { pathname } = useLocation();
  const lens = people.length > 0;
  const add = () => {
    form.add();
  };

  return (
    <div
      className={classes.root}
      data-resizing={sidebar.resizing || undefined}
      style={{ '--sidebar-width': `${String(sidebar.columnWidth)}px` } as CSSProperties}
    >
      {isDesktop &&
        (lens ? (
          <ProtoSidebar
            state={sidebar}
            user={user}
            onAdd={add}
            lens={
              <Lens
                who={who}
                people={people}
                onPick={setWho}
                place="sidebar"
                collapsed={sidebar.collapsed}
              />
            }
          />
        ) : (
          <Sidebar state={sidebar} user={user} onAdd={add} />
        ))}
      <div className={classes.column}>
        {!isDesktop && (lens ? <LensTopBar user={user} /> : <TopBar user={user} />)}
        <WakePill waking={wake.waking} seconds={wake.seconds} />
        <main className={classes.main}>
          <div className={classes.content}>
            {lens && SCOPED.some((path) => pathname.startsWith(path)) && (
              <WhoseLine
                who={who}
                people={people}
                onMine={() => {
                  setWho('me');
                }}
              >
                {who === 'family' &&
                  pathname.startsWith('/reports') &&
                  'Categories of the same group and name count as one.'}
              </WhoseLine>
            )}
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
      {!isDesktop && <MoreSheet opened={moreOpened} onClose={more.close} user={user} />}
    </div>
  );
}

/** The phone's top bar with the lens: the lens takes the theme switch's place (More keeps the theme). */
function LensTopBar({ user }: { user?: ShellUser }) {
  const { t } = useTranslation();
  const { people, who, setWho } = useWhoState();
  return (
    <header className={barClasses.top}>
      <span className={barClasses.topBrand}>
        <Brand />
      </span>
      <Lens who={who} people={people} onPick={setWho} place="top" />
      {user && (
        <ActionIcon
          component={Link}
          to="/settings"
          variant="subtle"
          color="gray"
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
