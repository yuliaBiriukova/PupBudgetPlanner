import { ActionIcon, UnstyledButton, VisuallyHidden } from '@mantine/core';
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronUp,
  IconPencil,
  IconPlus,
} from '@tabler/icons-react';
import { forwardRef, useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { cx } from '../../shared/ui/cx';
import { scrollParentOf } from '../../shared/ui/scrollParent';
import tx from '../transactions/TransactionsPage.module.css';
import { daysLeft, moneyIn, monthName, shiftMonth, thisMonth, type MonthLines } from './budget';
import classes from './Budget.module.css';

interface SlipProps {
  lines: MonthLines;
  ratesMissing: boolean;
  onMonth: (month: string) => void;
  onEditTotal: () => void;
}

/**
 * The Budget page's header (F-033, owner's review of PR #115): the month on Transactions' dark slip, and the slim bar
 * that slides in at the top once the slip has scrolled away, as Transactions' on the phone, here on every width: the
 * month, what's left and (but on a phone) what's spent; a tap goes back to the top.
 */
export function SlipWithBar(props: SlipProps) {
  const { t } = useTranslation();
  const slip = useRef<HTMLElement>(null);
  const away = useAway(slip);
  const { lines } = props;
  const money = moneyIn(lines.currency);
  const left = lines.total.left;
  return (
    <>
      <div className={cx(tx.miniWrap, classes.slimWrap)} data-on={away || undefined}>
        <UnstyledButton
          className={cx(tx.mini, classes.slimBar)}
          tabIndex={away ? 0 : -1}
          aria-hidden={!away}
          onClick={() => {
            scrollParentOf(slip.current)?.scrollTo({
              top: 0,
              behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
            });
          }}
        >
          <span className={tx.miniMonth}>{monthName(lines.month)}</span>
          <span className={tx.miniFigures}>
            {left != null && (
              <span className={left < 0 ? classes.slipOver : undefined}>
                {t(left < 0 ? 'budget.slip.overShort' : 'budget.slip.leftShort', {
                  amount: money(Math.abs(left)),
                })}
              </span>
            )}
            <span className={classes.slimSpent}>
              {t('budget.slip.spentShort', { amount: money(lines.total.spent) })}
            </span>
          </span>
          <IconChevronUp size={20} stroke={1.7} aria-hidden />
          <VisuallyHidden>{t('budget.slip.backToTop')}</VisuallyHidden>
        </UnstyledButton>
      </div>
      <BudgetSlip ref={slip} {...props} />
    </>
  );
}

/** Whether the slip has scrolled away under the top of the page's scrolling area (as Transactions' slim bar). */
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
 * The month on the slip: ‹ the month › and Change total (Set a total) at the end of the row; what's left of the total
 * (over, or not spent of a past month) and what was spent big; the slip's bar for the share of the total spent; the
 * days to go and the part of the total in no group.
 */
const BudgetSlip = forwardRef<HTMLElement, SlipProps>(function BudgetSlip(
  { lines, ratesMissing, onMonth, onEditTotal },
  ref,
) {
  const { t } = useTranslation();
  const money = moneyIn(lines.currency);
  const { total, month } = lines;
  const previous = shiftMonth(month, -1);
  const next = shiftMonth(month, 1);
  const past = month < thisMonth();
  const share = total.budget ? Math.round((total.spent / total.budget) * 100) : 0;
  const over = total.left != null && total.left < 0;
  const year = month.slice(0, 4);
  const amounts = total.budget != null ? { total: money(total.budget) } : undefined;

  return (
    <section ref={ref} className={cx(tx.slip, classes.slip)} aria-label={t('budget.slip.label')}>
      <div className={tx.slipRow}>
        <ActionIcon
          variant="subtle"
          className={tx.step}
          aria-label={`${monthName(previous)} ${previous.slice(0, 4)}`}
          disabled={month <= '2000-01'}
          onClick={() => {
            onMonth(previous);
          }}
        >
          <IconChevronLeft size={20} stroke={1.7} />
        </ActionIcon>
        <h1 className={cx(tx.periodName, classes.slipTitle)}>
          <span className={tx.monthLong}>{monthName(month)}</span>
          <span className={tx.monthShort} aria-hidden="true">
            {monthName(month, 'short')}
          </span>{' '}
          <span className={tx.year}>{year}</span>
        </h1>
        <ActionIcon
          variant="subtle"
          className={tx.step}
          aria-label={`${monthName(next)} ${next.slice(0, 4)}`}
          disabled={month > thisMonth()}
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
            {t(total.budget == null ? 'budget.slip.setTotal' : 'budget.slip.changeTotal')}
          </span>
        </UnstyledButton>
      </div>
      <dl className={tx.figures}>
        {amounts && total.left != null && (
          <div>
            <dt>
              {over
                ? t('budget.hero.over', amounts)
                : past
                  ? t('budget.hero.notSpent', amounts)
                  : t('budget.hero.left', amounts)}
            </dt>
            <dd className={over ? classes.slipOver : undefined} data-testid="month-left">
              {money(Math.abs(total.left))}
            </dd>
          </div>
        )}
        <div>
          <dt>{t('budget.slip.spent')}</dt>
          <dd>{money(total.spent)}</dd>
        </div>
      </dl>
      {total.budget != null && (
        <div
          className={tx.ratio}
          role="img"
          aria-label={t('budget.slip.share', { share: String(share) })}
        >
          <span style={{ '--share': `${String(Math.min(100, share))}%` } as CSSProperties} />
        </div>
      )}
      <p className={tx.caption}>
        {past
          ? t('budget.hero.noCarry')
          : month === thisMonth()
            ? t('budget.hero.daysToGo', { count: daysLeft(month) })
            : ''}
        {lines.unplanned != null && lines.unplanned > 0 && (
          <>
            {' '}
            <Trans
              i18nKey="budget.slip.unplanned"
              values={{ amount: money(lines.unplanned) }}
              components={{ b: <b /> }}
            />
          </>
        )}
      </p>
      {ratesMissing && <p className={tx.caption}>{t('budget.ratesMissing')}</p>}
    </section>
  );
});
