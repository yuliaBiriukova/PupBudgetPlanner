import { UnstyledButton } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { IconArrowsLeftRight, IconDots, IconMinus, IconPlus } from '@tabler/icons-react';
import type { CSSProperties, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet, useLocation } from 'react-router';
import layout from '../../app/shell/AppLayout.module.css';
import { MoreSheet, TopBar } from '../../app/shell/PhoneBars';
import bars from '../../app/shell/PhoneBars.module.css';
import {
  DESKTOP_QUERY,
  moreSectionsFor,
  TAB_SECTIONS,
  type ShellUser,
} from '../../app/shell/sections';
import { Sidebar } from '../../app/shell/Sidebar';
import { useSidebar } from '../../app/shell/useSidebar';
import { cx } from '../../shared/ui/cx';
import { useTransactionForm } from '../../features/transactions/transactionForm';
import { TransactionFormProvider } from '../../features/transactions/TransactionFormProvider';
import classes from './PrototypeShell.module.css';

/** Which way of adding the phone shows (I-030, round 2). */
export type AddVariant = 'wide' | 'rounds';

interface ShellProps {
  variant: AddVariant;
  user?: ShellUser;
}

/**
 * A copy of the app shell (`AppLayout`) for the prototype: the sidebar on the desktop is the app's own and unchanged;
 * on the phone the top bar and More are the app's, and the bottom is the variant's.
 */
export function PrototypeShell(props: ShellProps) {
  return (
    <TransactionFormProvider>
      <Shell {...props} />
    </TransactionFormProvider>
  );
}

function Shell({ variant, user }: ShellProps) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY, false, { getInitialValueInEffect: false });
  const sidebar = useSidebar();
  const form = useTransactionForm();
  const [moreOpened, more] = useDisclosure(false);

  const add = () => {
    form.add();
  };
  // The prototype opens the form and switches it to the type, as the built form would start on it
  const addAs = (type: 'Income' | 'Transfer') => () => {
    form.add();
    pickTypeWhenOpen(type);
  };

  return (
    <div
      className={layout.root}
      style={{ '--sidebar-width': `${String(sidebar.columnWidth)}px` } as CSSProperties}
    >
      {isDesktop && <Sidebar state={sidebar} user={user} onAdd={add} />}
      <div className={layout.column}>
        {!isDesktop && <TopBar user={user} />}
        <main className={layout.main}>
          <div className={layout.content}>
            {/* Room under the last rows for the floating buttons */}
            <div className={!isDesktop && variant === 'rounds' ? classes.roomForFloat : undefined}>
              <Outlet />
            </div>
          </div>
        </main>
        {!isDesktop && variant === 'wide' && (
          <BottomBar onMore={more.open} user={user}>
            <div className={classes.wideRow}>
              <UnstyledButton className={classes.wide} onClick={add}>
                <IconPlus size={20} stroke={1.7} aria-hidden />
                Add transaction
              </UnstyledButton>
            </div>
          </BottomBar>
        )}
        {!isDesktop && variant === 'rounds' && (
          <BottomBar onMore={more.open} user={user}>
            <div className={classes.float}>
              <div className={classes.roundDock} role="group" aria-label="Add a transaction">
                <UnstyledButton
                  className={classes.round}
                  data-type="transfer"
                  aria-label="Add transfer"
                  title="Transfer"
                  onClick={addAs('Transfer')}
                >
                  <IconArrowsLeftRight size={24} stroke={1.7} aria-hidden />
                </UnstyledButton>
                <UnstyledButton
                  className={classes.round}
                  data-type="income"
                  aria-label="Add income"
                  title="Income"
                  onClick={addAs('Income')}
                >
                  <IconPlus size={24} stroke={1.7} aria-hidden />
                </UnstyledButton>
                <UnstyledButton
                  className={classes.round}
                  data-type="expense"
                  aria-label="Add expense"
                  title="Expense"
                  onClick={add}
                >
                  <IconMinus size={24} stroke={1.7} aria-hidden />
                </UnstyledButton>
              </div>
            </div>
          </BottomBar>
        )}
      </div>
      {!isDesktop && <MoreSheet opened={moreOpened} onClose={more.close} user={user} />}
    </div>
  );
}

/**
 * The app's tab bar without its +: the tabs spread over the bar. What the variant adds comes first: a row of its own
 * over the tabs (variant 4) or a dock floating above the bar (variant 5).
 */
function BottomBar({
  onMore,
  user,
  children,
}: {
  onMore: () => void;
  user?: ShellUser;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const inMore = moreSectionsFor(user).some((s) => pathname.startsWith(s.path));

  return (
    <div className={classes.barHolder}>
      {children}
      <nav className={cx(bars.tabs, classes.spread)} aria-label={t('nav.main')}>
        {TAB_SECTIONS.map(({ id, path, icon: Icon }) => (
          <NavLink key={id} to={path} className={bars.tab}>
            <Icon size={24} stroke={1.7} />
            <span className={bars.tabLabel}>{t(`nav.${id}`)}</span>
          </NavLink>
        ))}
        <UnstyledButton
          className={bars.tab}
          data-active={inMore || undefined}
          aria-haspopup="dialog"
          onClick={onMore}
        >
          <IconDots size={24} stroke={1.7} />
          <span className={bars.tabLabel}>{t('nav.more')}</span>
        </UnstyledButton>
      </nav>
    </div>
  );
}

/** Prototype only: once the form's sheet is open, picks a type in its switch, as a form opened on it would start. */
function pickTypeWhenOpen(type: 'Income' | 'Transfer') {
  let tries = 0;
  const look = () => {
    const input = document.querySelector<HTMLInputElement>(
      `[role="dialog"] input[type="radio"][value="${type}"]`,
    );
    if (input) {
      input.click();
      return;
    }
    tries += 1;
    if (tries < 40) window.setTimeout(look, 50);
  };
  look();
}
