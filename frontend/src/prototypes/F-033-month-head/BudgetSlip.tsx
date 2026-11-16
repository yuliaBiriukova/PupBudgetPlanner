import { ActionIcon, UnstyledButton } from '@mantine/core';
import { IconChevronLeft, IconChevronRight, IconPencil, IconPlus } from '@tabler/icons-react';
import dayjs from 'dayjs';
import type { CSSProperties } from 'react';
import {
  daysLeft,
  moneyIn,
  shiftMonth,
  thisMonth,
  type MonthLines,
} from '../../features/budget/budget';
import tx from '../../features/transactions/TransactionsPage.module.css';
import { cx } from '../../shared/ui/cx';
import classes from './BudgetSlip.module.css';

/**
 * F-033 prototype (owner: "make the header for budget as for transactions"): the month's figures on Transactions' dark
 * slip with its torn edge. The month with ‹ ›, Change total at the end of the row; what's left of the total big and
 * what was spent beside it; the slip's bar for how much of the total is spent, and the days to go under it.
 */
export function BudgetSlip({
  lines,
  onMonth,
  onEditTotal,
}: {
  lines: MonthLines;
  onMonth: (month: string) => void;
  onEditTotal: () => void;
}) {
  const money = moneyIn(lines.currency);
  const { total } = lines;
  const month = lines.month;
  const previous = shiftMonth(month, -1);
  const next = shiftMonth(month, 1);
  const nextAllowed = next <= shiftMonth(thisMonth(), 1);
  const past = month < thisMonth();
  const share = total.budget ? Math.round((total.spent / total.budget) * 100) : 0;
  const over = total.left != null && total.left < 0;

  return (
    <section className={cx(tx.slip, classes.slip)} aria-label="The month">
      <div className={tx.slipRow}>
        <ActionIcon
          variant="subtle"
          className={tx.step}
          aria-label="Previous month"
          onClick={() => {
            onMonth(previous);
          }}
        >
          <IconChevronLeft size={20} stroke={1.7} />
        </ActionIcon>
        <h1 className={cx(tx.periodName, classes.title)}>
          <span className={tx.monthLong}>{dayjs(`${month}-01`).format('MMMM')}</span>
          <span className={tx.monthShort} aria-hidden="true">
            {dayjs(`${month}-01`).format('MMM')}
          </span>{' '}
          <span className={tx.year}>{month.slice(0, 4)}</span>
        </h1>
        <ActionIcon
          variant="subtle"
          className={tx.step}
          disabled={!nextAllowed}
          aria-label="Next month"
          onClick={() => {
            onMonth(next);
          }}
        >
          <IconChevronRight size={20} stroke={1.7} />
        </ActionIcon>
        <UnstyledButton className={tx.add} onClick={onEditTotal}>
          {total.budget == null ? (
            <IconPlus size={20} stroke={1.7} aria-hidden />
          ) : (
            <IconPencil size={20} stroke={1.7} aria-hidden />
          )}
          <span className={tx.addLabel}>
            {total.budget == null ? 'Set a total' : 'Change total'}
          </span>
        </UnstyledButton>
      </div>
      <dl className={tx.figures}>
        {total.budget != null && total.left != null && (
          <div>
            <dt>
              {over
                ? `Over of ${money(total.budget)}`
                : past
                  ? `Not spent of ${money(total.budget)}`
                  : `Left of ${money(total.budget)}`}
            </dt>
            <dd className={over ? classes.over : undefined} data-testid="month-left">
              {money(Math.abs(total.left))}
            </dd>
          </div>
        )}
        <div>
          <dt>Spent</dt>
          <dd>{money(total.spent)}</dd>
        </div>
      </dl>
      {total.budget != null && (
        <div className={tx.ratio} role="img" aria-label={`${String(share)} % of the total spent`}>
          <span style={{ '--share': `${String(Math.min(100, share))}%` } as CSSProperties} />
        </div>
      )}
      <p className={tx.caption}>
        {past
          ? 'What’s left doesn’t carry over to the next month.'
          : month === thisMonth()
            ? `${String(daysLeft(month))} days to go.`
            : ''}
        {lines.unplanned != null && lines.unplanned > 0 && (
          <>
            {' '}
            <b>{money(lines.unplanned)}</b> of the total isn’t in any group.
          </>
        )}
      </p>
    </section>
  );
}
