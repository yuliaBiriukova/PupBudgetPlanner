import { ActionIcon } from '@mantine/core';
import { IconAlertCircle, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import type { CSSProperties, ReactNode } from 'react';
import { monthName, shiftMonth, thisMonth } from './budget';
import classes from './Budget.module.css';

/** The month's name as the page's title with ‹ › around it. */
export function MonthHead({ month, onMonth }: { month: string; onMonth: (month: string) => void }) {
  const year = month.slice(0, 4);
  return (
    <div className={classes.head}>
      <ActionIcon
        variant="subtle"
        color="gray"
        aria-label={`${monthName(shiftMonth(month, -1))} ${shiftMonth(month, -1).slice(0, 4)}`}
        disabled={month <= '2000-01'}
        onClick={() => {
          onMonth(shiftMonth(month, -1));
        }}
      >
        <IconChevronLeft size={20} stroke={1.7} />
      </ActionIcon>
      <h1 className={classes.title}>
        <span className={classes.titleLong}>
          {monthName(month)} {year}
        </span>
        <span className={classes.titleShort} aria-hidden>
          {monthName(month, 'short')} {year}
        </span>
      </h1>
      <ActionIcon
        variant="subtle"
        color="gray"
        aria-label={`${monthName(shiftMonth(month, 1))} ${shiftMonth(month, 1).slice(0, 4)}`}
        disabled={month > thisMonth()}
        onClick={() => {
          onMonth(shiftMonth(month, 1));
        }}
      >
        <IconChevronRight size={20} stroke={1.7} />
      </ActionIcon>
    </div>
  );
}

/** Spent over the budget as a bar, red past it; a dashed empty one without a budget. */
export function Bar({
  spent,
  budget,
  thick,
}: {
  spent: number;
  budget: number | null;
  /** The month's own bar: 8 px, as the Transactions slip's. */
  thick?: boolean;
}) {
  if (budget == null || budget <= 0)
    return <div className={classes.bar} data-none aria-hidden data-testid="budget-bar" />;
  const share = Math.min(1, Math.max(0, spent / budget));
  return (
    <div
      className={classes.bar}
      data-over={spent > budget || undefined}
      data-thick={thick ? true : undefined}
      data-testid="budget-bar"
      aria-hidden
      style={{ '--fill': `${String(Math.round(share * 1000) / 10)}%` } as CSSProperties}
    >
      <span />
    </div>
  );
}

/** A message that something goes over: the red of a form's error, with its icon. */
export function IssueText({ children }: { children: ReactNode }) {
  return (
    <p className={classes.issue} role="alert">
      <IconAlertCircle size={16} stroke={1.7} aria-hidden />
      <span>{children}</span>
    </p>
  );
}
