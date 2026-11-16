import { ActionIcon, UnstyledButton, VisuallyHidden } from '@mantine/core';
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronUp,
  IconPencil,
  IconPlus,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import { forwardRef, useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import {
  daysLeft,
  moneyIn,
  shiftMonth,
  thisMonth,
  type MonthLines,
} from '../../features/budget/budget';
import tx from '../../features/transactions/TransactionsPage.module.css';
import { cx } from '../../shared/ui/cx';
import { scrollParentOf } from '../../shared/ui/scrollParent';
import classes from './BudgetSlip.module.css';

interface SlipProps {
  lines: MonthLines;
  onMonth: (month: string) => void;
  onEditTotal: () => void;
}

/**
 * The slip, and the slim bar that slides in at the top once it has scrolled away, as Transactions' on the phone (owner:
 * "sticky as on mobile"), here on every width: the month, what's left and what's spent; a tap goes back to the top.
 */
export function SlipWithBar(props: SlipProps) {
  const slip = useRef<HTMLElement>(null);
  const away = useAway(slip);
  const { lines } = props;
  const money = moneyIn(lines.currency);
  const left = lines.total.left;
  return (
    <>
      <div className={cx(tx.miniWrap, classes.barWrap)} data-on={away || undefined}>
        <UnstyledButton
          className={cx(tx.mini, classes.bar)}
          tabIndex={away ? 0 : -1}
          aria-hidden={!away}
          onClick={() => {
            scrollParentOf(slip.current)?.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <span className={tx.miniMonth}>{dayjs(`${lines.month}-01`).format('MMMM')}</span>
          <span className={tx.miniFigures}>
            {left != null && (
              <span className={left < 0 ? classes.over : undefined}>
                {money(Math.abs(left))} {left < 0 ? 'over' : 'left'}
              </span>
            )}
            <span className={classes.barSpent}>{money(lines.total.spent)} spent</span>
          </span>
          <IconChevronUp size={20} stroke={1.7} aria-hidden />
          <VisuallyHidden>Back to the top</VisuallyHidden>
        </UnstyledButton>
      </div>
      <BudgetSlip ref={slip} {...props} />
    </>
  );
}

/** Whether the slip has scrolled away under the top of the page's scrolling area, as Transactions' useMiniBar. */
function useAway(slip: RefObject<HTMLElement | null>) {
  const [away, setAway] = useState(false);
  useEffect(() => {
    const el = slip.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setAway(!!entry && !entry.isIntersecting);
      },
      { root: scrollParentOf(el), rootMargin: '-48px 0px 0px 0px' },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, [slip]);
  return away;
}

/**
 * F-033 prototype (owner: "make the header for budget as for transactions"): the month's figures on Transactions' dark
 * slip with its torn edge. The month with ‹ ›, Change total at the end of the row; what's left of the total big and
 * what was spent beside it; the slip's bar for how much of the total is spent, and the days to go under it.
 */
const BudgetSlip = forwardRef<HTMLElement, SlipProps>(function BudgetSlip(
  { lines, onMonth, onEditTotal },
  ref,
) {
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
    <section ref={ref} className={cx(tx.slip, classes.slip)} aria-label="The month">
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
});
