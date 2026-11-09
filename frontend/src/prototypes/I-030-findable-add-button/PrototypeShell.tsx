import { UnstyledButton } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { IconArrowsLeftRight, IconDots, IconMinus, IconPlus } from '@tabler/icons-react';
import { useEffect, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet, useLocation } from 'react-router';
import layout from '../../app/shell/AppLayout.module.css';
import { MoreSheet, TopBar } from '../../app/shell/PhoneBars';
import {
  DESKTOP_QUERY,
  moreSectionsFor,
  TAB_SECTIONS,
  type ShellUser,
} from '../../app/shell/sections';
import { Sidebar } from '../../app/shell/Sidebar';
import { useSidebar } from '../../app/shell/useSidebar';
import { useTransactionForm } from '../../features/transactions/transactionForm';
import { TransactionFormProvider } from '../../features/transactions/TransactionFormProvider';
import classes from './PrototypeShell.module.css';

type AddType = 'Expense' | 'Income' | 'Transfer';

/**
 * A copy of the app shell (`AppLayout`) for the final prototype (variant 8 with the menu's pill gone): the sidebar on
 * the desktop is the app's own and unchanged; on the phone the top bar and More are the app's, a + floats over the
 * page and opens ⇄ + −, and the menu has four named places.
 */
export function PrototypeShell({ user }: { user?: ShellUser }) {
  return (
    <TransactionFormProvider>
      <Shell user={user} />
    </TransactionFormProvider>
  );
}

function Shell({ user }: { user?: ShellUser }) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY, false, { getInitialValueInEffect: false });
  const sidebar = useSidebar();
  const form = useTransactionForm();
  const [moreOpened, more] = useDisclosure(false);

  // The prototype opens the form and switches it to the type, as the built form would start on it
  const addAs = (type: AddType) => {
    form.add();
    if (type !== 'Expense') pickTypeWhenOpen(type);
  };

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
            {/* Room under the last rows for the floating + */}
            <div className={isDesktop ? undefined : classes.roomForFloat}>
              <Outlet />
            </div>
          </div>
        </main>
        {!isDesktop && (
          <div className={classes.bottom}>
            <SpeedDial onAdd={addAs} />
            <NamedTabBar onMore={more.open} user={user} />
          </div>
        )}
      </div>
      {!isDesktop && <MoreSheet opened={moreOpened} onClose={more.close} user={user} />}
    </div>
  );
}

const TYPES: { type: AddType; label: string; icon: typeof IconPlus }[] = [
  { type: 'Transfer', label: 'Add transfer', icon: IconArrowsLeftRight },
  { type: 'Income', label: 'Add income', icon: IconPlus },
  { type: 'Expense', label: 'Add expense', icon: IconMinus },
];

/**
 * One charcoal + at the thumb's end; a tap dims the page and opens ⇄ + − above it (Expense nearest), the + turning
 * into ×. A type, ×, a tap outside or Escape folds them.
 */
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

/**
 * The menu without the bar's +: four equal places across the phone, each icon with its name under it; the open one in
 * the accent, its name in medium weight, with no pill behind it (owner, 2026-11-09).
 */
function NamedTabBar({ onMore, user }: { onMore: () => void; user?: ShellUser }) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const inMore = moreSectionsFor(user).some((s) => pathname.startsWith(s.path));

  return (
    <nav className={classes.namedBar} aria-label={t('nav.main')}>
      {TAB_SECTIONS.map(({ id, path, icon: Icon }) => (
        <NavLink key={id} to={path} className={classes.slot}>
          <Icon size={24} stroke={1.7} />
          <span className={classes.slotLabel}>{t(`nav.${id}`)}</span>
        </NavLink>
      ))}
      <UnstyledButton
        className={classes.slot}
        data-active={inMore || undefined}
        aria-haspopup="dialog"
        onClick={onMore}
      >
        <IconDots size={24} stroke={1.7} />
        <span className={classes.slotLabel}>{t('nav.more')}</span>
      </UnstyledButton>
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
