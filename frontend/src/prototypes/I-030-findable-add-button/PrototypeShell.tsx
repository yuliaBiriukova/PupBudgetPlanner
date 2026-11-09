import { UnstyledButton } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { IconArrowsLeftRight, IconDots, IconMinus, IconPlus } from '@tabler/icons-react';
import { useEffect, useState, type CSSProperties } from 'react';
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

/** Which way of adding the phone shows (I-030, rounds 2 and 3). */
export type AddVariant = 'wide' | 'rounds' | 'bigExpense' | 'inBar' | 'dial' | 'row';

type AddType = 'Expense' | 'Income' | 'Transfer';

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

  // The prototype opens the form and switches it to the type, as the built form would start on it
  const addAs = (type: AddType) => {
    form.add();
    if (type !== 'Expense') pickTypeWhenOpen(type);
  };
  const floats = variant === 'rounds' || variant === 'bigExpense' || variant === 'dial';

  return (
    <div
      className={layout.root}
      style={{ '--sidebar-width': `${String(sidebar.columnWidth)}px` } as CSSProperties}
    >
      {isDesktop && (
        <Sidebar
          state={sidebar}
          user={user}
          onAdd={() => {
            addAs('Expense');
          }}
        />
      )}
      <div className={layout.column}>
        {!isDesktop && <TopBar user={user} />}
        <main className={layout.main}>
          <div className={layout.content}>
            {/* Room under the last rows for the floating buttons */}
            <div className={!isDesktop && floats ? classes.roomForFloat : undefined}>
              <Outlet />
            </div>
          </div>
        </main>
        {!isDesktop && (
          <PhoneBottom variant={variant} user={user} onMore={more.open} onAdd={addAs} />
        )}
      </div>
      {!isDesktop && <MoreSheet opened={moreOpened} onClose={more.close} user={user} />}
    </div>
  );
}

interface BottomProps {
  variant: AddVariant;
  user?: ShellUser;
  onMore: () => void;
  onAdd: (type: AddType) => void;
}

/** What each variant puts at the bottom of the phone. */
function PhoneBottom({ variant, user, onMore, onAdd }: BottomProps) {
  switch (variant) {
    case 'wide':
      return (
        <div className={classes.barHolder}>
          <div className={classes.wideRow}>
            <UnstyledButton
              className={classes.wide}
              onClick={() => {
                onAdd('Expense');
              }}
            >
              <IconPlus size={20} stroke={1.7} aria-hidden />
              Add transaction
            </UnstyledButton>
          </div>
          <IconTabBar onMore={onMore} user={user} bordered={false} />
        </div>
      );
    case 'rounds':
      return (
        <div className={classes.barHolder}>
          <div className={classes.float}>
            <TypeButtons onAdd={onAdd} dock />
          </div>
          <IconTabBar onMore={onMore} user={user} />
        </div>
      );
    case 'bigExpense':
      return (
        <div className={classes.barHolder}>
          <div className={classes.float}>
            <TypeButtons onAdd={onAdd} dock bigExpense />
          </div>
          <NamedTabBar onMore={onMore} user={user} />
        </div>
      );
    case 'inBar':
      return <InBarTabBar onMore={onMore} user={user} onAdd={onAdd} />;
    case 'dial':
      return (
        <div className={classes.barHolder}>
          <SpeedDial onAdd={onAdd} />
          <NamedTabBar onMore={onMore} user={user} />
        </div>
      );
    case 'row':
      return (
        <div className={classes.barHolder}>
          <div className={classes.typeRow}>
            <TypeButtons onAdd={onAdd} />
          </div>
          <NamedTabBar onMore={onMore} user={user} bordered={false} />
        </div>
      );
  }
}

const TYPES: { type: AddType; label: string; icon: typeof IconPlus }[] = [
  { type: 'Transfer', label: 'Add transfer', icon: IconArrowsLeftRight },
  { type: 'Income', label: 'Add income', icon: IconPlus },
  { type: 'Expense', label: 'Add expense', icon: IconMinus },
];

/** ⇄ + − as round buttons in the types' colours, Expense last (at the thumb's end). */
function TypeButtons({
  onAdd,
  dock,
  bigExpense,
  size = 'md',
}: {
  onAdd: (type: AddType) => void;
  /** On a floating surface of their own. */
  dock?: boolean;
  /** Expense, the most used, bigger and filled (variant 6). */
  bigExpense?: boolean;
  size?: 'sm' | 'md';
}) {
  return (
    <div
      className={cx(classes.types, dock && classes.roundDock)}
      role="group"
      aria-label="Add a transaction"
    >
      {TYPES.map(({ type, label, icon: Icon }) => (
        <UnstyledButton
          key={type}
          className={classes.round}
          data-type={type.toLowerCase()}
          data-size={bigExpense ? (type === 'Expense' ? 'lg' : 'sm') : size}
          data-filled={bigExpense && type === 'Expense' ? true : undefined}
          aria-label={label}
          title={label}
          onClick={() => {
            onAdd(type);
          }}
        >
          <Icon size={24} stroke={1.7} aria-hidden />
        </UnstyledButton>
      ))}
    </div>
  );
}

/** Variant 8: one charcoal + that opens ⇄ + − above it, over a dimmed page; × or a tap outside folds them. */
function SpeedDial({ onAdd }: { onAdd: (type: AddType) => void }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      {open && (
        <div
          className={classes.scrim}
          aria-hidden
          onClick={() => {
            setOpen(false);
          }}
        />
      )}
      <div className={classes.float}>
        <div className={classes.dial} data-open={open || undefined}>
          <div className={classes.dialItems} role="group" aria-label="Add a transaction">
            {TYPES.map(({ type, label, icon: Icon }) => (
              <UnstyledButton
                key={type}
                className={classes.round}
                data-type={type.toLowerCase()}
                data-size="md"
                aria-label={label}
                title={label}
                tabIndex={open ? 0 : -1}
                onClick={() => {
                  setOpen(false);
                  onAdd(type);
                }}
              >
                <Icon size={24} stroke={1.7} aria-hidden />
              </UnstyledButton>
            ))}
          </div>
          <UnstyledButton
            className={classes.dialToggle}
            aria-label={open ? 'Close' : 'Add a transaction'}
            aria-expanded={open}
            onClick={() => {
              setOpen((value) => !value);
            }}
          >
            <IconPlus size={24} stroke={1.7} aria-hidden />
          </UnstyledButton>
        </div>
      </div>
    </>
  );
}

function useInMore(user?: ShellUser) {
  const { pathname } = useLocation();
  return moreSectionsFor(user).some((s) => pathname.startsWith(s.path));
}

/** Round 2's bar: the app's tabs (icons, the open one named on its pill) spread over the bar. */
function IconTabBar({
  onMore,
  user,
  bordered = true,
}: {
  onMore: () => void;
  user?: ShellUser;
  bordered?: boolean;
}) {
  const { t } = useTranslation();
  const inMore = useInMore(user);

  return (
    <nav
      className={cx(bars.tabs, classes.spread, !bordered && classes.noRule)}
      aria-label={t('nav.main')}
    >
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
  );
}

/**
 * Round 3's menu, rearranged for the bar without its +: four equal places across the phone, each icon with its name
 * under it, the open one's icon on the accent's pill (as the app's open tab is now).
 */
function NamedTabBar({
  onMore,
  user,
  bordered = true,
}: {
  onMore: () => void;
  user?: ShellUser;
  bordered?: boolean;
}) {
  const { t } = useTranslation();
  const inMore = useInMore(user);

  return (
    <nav className={cx(classes.namedBar, !bordered && classes.noRule)} aria-label={t('nav.main')}>
      {TAB_SECTIONS.map(({ id, path, icon: Icon }) => (
        <NavLink key={id} to={path} className={classes.slot}>
          <span className={classes.slotIcon}>
            <Icon size={24} stroke={1.7} />
          </span>
          <span className={classes.slotLabel}>{t(`nav.${id}`)}</span>
        </NavLink>
      ))}
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

/** Variant 7: one bar for both, the four places on the left and ⇄ + − on the right after a thin rule. */
function InBarTabBar({ onMore, user, onAdd }: Omit<BottomProps, 'variant'>) {
  const { t } = useTranslation();
  const inMore = useInMore(user);

  return (
    <nav className={classes.inBar} aria-label={t('nav.main')}>
      <div className={classes.inBarTabs}>
        {TAB_SECTIONS.map(({ id, path, icon: Icon }) => (
          <NavLink key={id} to={path} className={classes.slot}>
            <span className={classes.slotIcon} data-narrow>
              <Icon size={24} stroke={1.7} />
            </span>
            <span className={classes.slotLabel}>{t(`nav.${id}`)}</span>
          </NavLink>
        ))}
        <UnstyledButton
          className={classes.slot}
          data-active={inMore || undefined}
          aria-haspopup="dialog"
          onClick={onMore}
        >
          <span className={classes.slotIcon} data-narrow>
            <IconDots size={24} stroke={1.7} />
          </span>
          <span className={classes.slotLabel}>{t('nav.more')}</span>
        </UnstyledButton>
      </div>
      <span className={classes.inBarRule} aria-hidden />
      <TypeButtons onAdd={onAdd} size="sm" />
    </nav>
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
