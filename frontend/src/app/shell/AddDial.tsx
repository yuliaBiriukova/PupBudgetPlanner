import { Transition, UnstyledButton, type MantineTransition } from '@mantine/core';
import { IconArrowsLeftRight, IconMinus, IconPlus } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';
import type { TransactionType } from '../../features/transactions/transactionsApi';
import classes from './AddDial.module.css';

/** Nearest to the + first: they stand above it in reverse, Expense right over the + (I-030). */
const TYPES = [
  { type: 'Expense', icon: IconMinus },
  { type: 'Income', icon: IconPlus },
  { type: 'Transfer', icon: IconArrowsLeftRight },
] as const satisfies readonly { type: TransactionType; icon: typeof IconPlus }[];

/** ⇄ + − rise 16 px as they come and fade (the final prototype's 160 ms). */
const RISE: MantineTransition = {
  in: { opacity: 1, transform: 'none' },
  out: { opacity: 0, transform: 'translateY(16px)' },
  transitionProperty: 'opacity, transform',
};
const EASE = 'cubic-bezier(0.2, 0, 0, 1)';

/**
 * The phone's Add (I-030, final prototype): one charcoal + floating over the page at the thumb's end; a tap dims the
 * page and opens ⇄ Transfer, + Income and − Expense above it, the + turning into ×. A type, ×, a tap on the dimmed
 * page or Escape folds them; so does leaving the page (Back adds no step for them, owner, 2026-11-09).
 */
export function AddDial({ onAdd }: { onAdd: (type: TransactionType) => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const { pathname } = useLocation();

  // Another page (Back, a tab) starts with the three folded
  const [shownOn, setShownOn] = useState(pathname);
  if (shownOn !== pathname) {
    setShownOn(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      toggle.current?.focus();
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
          data-testid="add-dial-scrim"
          aria-hidden
          onClick={() => {
            setOpen(false);
          }}
        />
      )}
      <div className={classes.dial} data-open={open || undefined}>
        <UnstyledButton
          ref={toggle}
          className={classes.toggle}
          aria-label={open ? t('shell.closeAdd') : t('shell.openAdd')}
          aria-expanded={open}
          onClick={() => {
            setOpen((value) => !value);
          }}
        >
          <IconPlus size={24} stroke={1.7} aria-hidden />
        </UnstyledButton>
        {/* Respects reduced motion (the theme's `respectReducedMotion`): then they show and go without moving */}
        <Transition mounted={open} transition={RISE} duration={160} timingFunction={EASE}>
          {(style) => (
            <div
              className={classes.types}
              style={style}
              role="group"
              aria-label={t('shell.openAdd')}
            >
              {TYPES.map(({ type, icon: Icon }) => (
                <UnstyledButton
                  key={type}
                  className={classes.type}
                  data-type={type.toLowerCase()}
                  aria-label={t(`transactions.add.${type}`)}
                  title={t(`transactions.add.${type}`)}
                  onClick={() => {
                    setOpen(false);
                    onAdd(type);
                  }}
                >
                  <Icon size={24} stroke={1.7} aria-hidden />
                </UnstyledButton>
              ))}
            </div>
          )}
        </Transition>
      </div>
    </>
  );
}
