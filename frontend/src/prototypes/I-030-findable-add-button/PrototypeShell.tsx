import { UnstyledButton } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { IconDots, IconMinus, IconPlus } from '@tabler/icons-react';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
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

/** Which way of adding the phone shows (I-030). */
export type AddVariant = 'pill' | 'centre' | 'types';

interface ShellProps {
  variant: AddVariant;
  user?: ShellUser;
  /** Variant 1: the words on the pill. */
  label?: string;
}

/**
 * A copy of the app shell (`AppLayout`) for the prototype: the sidebar on the desktop is the app's own and unchanged;
 * on the phone the top bar and More are the app's, and the tab bar is the variant's.
 */
export function PrototypeShell(props: ShellProps) {
  return (
    <TransactionFormProvider>
      <Shell {...props} />
    </TransactionFormProvider>
  );
}

function Shell({ variant, user, label = 'Add transaction' }: ShellProps) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY, false, { getInitialValueInEffect: false });
  const sidebar = useSidebar();
  const form = useTransactionForm();
  const [moreOpened, more] = useDisclosure(false);
  const main = useRef<HTMLElement>(null);
  const scrolledDown = useScrolledDown(main);

  const add = () => {
    form.add();
  };
  // The prototype opens the form and switches it to Income, as the built form would start on it
  const addIncome = () => {
    form.add();
    pickTypeWhenOpen('Income');
  };

  return (
    <div
      className={layout.root}
      style={{ '--sidebar-width': `${String(sidebar.columnWidth)}px` } as CSSProperties}
    >
      {isDesktop && <Sidebar state={sidebar} user={user} onAdd={add} />}
      <div className={layout.column}>
        {!isDesktop && <TopBar user={user} />}
        <main ref={main} className={layout.main}>
          <div className={layout.content}>
            {/* Room under the last rows for the floating buttons */}
            <div className={!isDesktop && variant !== 'centre' ? classes.roomForFloat : undefined}>
              <Outlet />
            </div>
          </div>
        </main>
        {!isDesktop && variant === 'pill' && (
          <PlainTabBar onMore={more.open} user={user}>
            <UnstyledButton
              className={classes.pill}
              data-compact={scrolledDown || undefined}
              aria-label={label}
              onClick={add}
            >
              <IconPlus size={24} stroke={1.7} aria-hidden />
              <span className={classes.pillLabel} aria-hidden>
                {label}
              </span>
            </UnstyledButton>
          </PlainTabBar>
        )}
        {!isDesktop && variant === 'centre' && (
          <CentreTabBar onAdd={add} onMore={more.open} user={user} />
        )}
        {!isDesktop && variant === 'types' && (
          <PlainTabBar onMore={more.open} user={user}>
            <div className={classes.typeDock} role="group" aria-label="Add a transaction">
              <UnstyledButton className={classes.typeButton} data-type="expense" onClick={add}>
                <IconMinus size={20} stroke={1.7} aria-hidden />
                Expense
              </UnstyledButton>
              <UnstyledButton className={classes.typeButton} data-type="income" onClick={addIncome}>
                <IconPlus size={20} stroke={1.7} aria-hidden />
                Income
              </UnstyledButton>
            </div>
          </PlainTabBar>
        )}
      </div>
      {!isDesktop && <MoreSheet opened={moreOpened} onClose={more.close} user={user} />}
    </div>
  );
}

/** The app's tab bar without its + (variants 1 and 3): the tabs spread over the bar, the floating part above it. */
function PlainTabBar({
  onMore,
  user,
  children,
}: {
  onMore: () => void;
  user?: ShellUser;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const inMore = moreSectionsFor(user).some((s) => pathname.startsWith(s.path));

  return (
    <div className={classes.barHolder}>
      <div className={classes.float}>{children}</div>
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

/** Variant 2: every tab named under its icon, and Add raised in the middle of the bar. */
function CentreTabBar({
  onAdd,
  onMore,
  user,
}: {
  onAdd: () => void;
  onMore: () => void;
  user?: ShellUser;
}) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const inMore = moreSectionsFor(user).some((s) => pathname.startsWith(s.path));
  const [first, second, ...rest] = TAB_SECTIONS;
  const tab = ({ id, path, icon: Icon }: (typeof TAB_SECTIONS)[number]) => (
    <NavLink key={id} to={path} className={classes.slot}>
      <span className={classes.slotIcon}>
        <Icon size={24} stroke={1.7} />
      </span>
      <span className={classes.slotLabel}>{t(`nav.${id}`)}</span>
    </NavLink>
  );

  return (
    <nav className={classes.centreBar} aria-label={t('nav.main')}>
      {first && tab(first)}
      {second && tab(second)}
      <UnstyledButton className={classes.centreAdd} onClick={onAdd}>
        <span className={classes.centreCircle}>
          <IconPlus size={24} stroke={1.7} aria-hidden />
        </span>
        <span className={classes.slotLabel}>Add</span>
      </UnstyledButton>
      {rest.map(tab)}
      <UnstyledButton
        className={classes.slot}
        data-active={inMore || undefined}
        aria-haspopup="dialog"
        onClick={onMore}
      >
        <span className={classes.slotIcon}>
          <IconDots size={24} stroke={1.7} />
        </span>
        <span className={classes.slotLabel}>{t('nav.more')}</span>
      </UnstyledButton>
    </nav>
  );
}

/** True while the page was last scrolled down (variant 1's pill folds to its + then, and comes back on the way up). */
function useScrolledDown(ref: React.RefObject<HTMLElement | null>) {
  const [down, setDown] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let last = element.scrollTop;
    const onScroll = () => {
      const now = element.scrollTop;
      if (Math.abs(now - last) < 8) return;
      setDown(now > last && now > 24);
      last = now;
    };
    element.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      element.removeEventListener('scroll', onScroll);
    };
  }, [ref]);
  return down;
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
