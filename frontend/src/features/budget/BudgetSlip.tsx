import { ActionIcon, UnstyledButton } from '@mantine/core';
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
  month: string;
  /** None while the month loads (`loading`) or when it couldn't be loaded. */
  lines?: MonthLines;
  loading?: boolean;
  ratesMissing: boolean;
  onMonth: (month: string) => void;
  /** Change total (Set a total): only on a planned month. */
  onEditTotal?: () => void;
}

/** ‹ and › around the month: back to 2000, forward to next month (as far as the API goes). */
function MonthStep({
  month,
  step,
  onMonth,
}: {
  month: string;
  step: -1 | 1;
  onMonth: (month: string) => void;
}) {
  const target = shiftMonth(month, step);
  return (
    <ActionIcon
      variant="subtle"
      className={tx.step}
      aria-label={`${monthName(target)} ${target.slice(0, 4)}`}
      disabled={step < 0 ? month <= '2000-01' : month > thisMonth()}
      onClick={() => {
        onMonth(target);
      }}
    >
      {step < 0 ? (
        <IconChevronLeft size={20} stroke={1.7} />
      ) : (
        <IconChevronRight size={20} stroke={1.7} />
      )}
    </ActionIcon>
  );
}

/**
 * The Budget page's header (F-033, owner's reviews of PR #115) in every state of the month: the month on Transactions'
 * dark slip, and the slim bar that slides in at the top once the slip has scrolled away, as Transactions' on the phone,
 * here on every width: ‹ the month and its year ›, what's left and (but on a phone) what's spent, and ˄ back to the top.
 */
export function SlipWithBar(props: SlipProps) {
  const { t } = useTranslation();
  const slip = useRef<HTMLElement>(null);
  const away = useAway(slip);
  const { month, lines, onMonth } = props;
  const money = lines && moneyIn(lines.currency);
  const left = lines?.total.left;
  return (
    <>
      <div className={cx(tx.miniWrap, classes.slimWrap)} data-on={away || undefined}>
        <div className={cx(tx.mini, classes.slimBar)} inert={!away}>
          <MonthStep month={month} step={-1} onMonth={onMonth} />
          <span className={cx(tx.miniMonth, classes.slimMonth)}>
            <span className={classes.titleLong}>
              {monthName(month)} {month.slice(0, 4)}
            </span>
            <span className={classes.titleShort} aria-hidden>
              {monthName(month, 'short')} {month.slice(0, 4)}
            </span>
          </span>
          <MonthStep month={month} step={1} onMonth={onMonth} />
          {money && (
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
          )}
          <ActionIcon
            variant="subtle"
            className={cx(tx.step, classes.slimUp)}
            aria-label={t('budget.slip.backToTop')}
            onClick={() => {
              scrollParentOf(slip.current)?.scrollTo({
                top: 0,
                behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
                  ? 'auto'
                  : 'smooth',
              });
            }}
          >
            <IconChevronUp size={20} stroke={1.7} />
          </ActionIcon>
        </div>
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
 * days to go and the part of the total in no group. A month not planned has only what was spent.
 */
const BudgetSlip = forwardRef<HTMLElement, SlipProps>(function BudgetSlip(
  { month, lines, loading, ratesMissing, onMonth, onEditTotal },
  ref,
) {
  const { t } = useTranslation();
  const year = month.slice(0, 4);

  return (
    <section ref={ref} className={cx(tx.slip, classes.slip)} aria-label={t('budget.slip.label')}>
      <div className={tx.slipRow}>
        <MonthStep month={month} step={-1} onMonth={onMonth} />
        <h1 className={cx(tx.periodName, classes.slipTitle)}>
          <span className={tx.monthLong}>{monthName(month)}</span>
          <span className={tx.monthShort} aria-hidden="true">
            {monthName(month, 'short')}
          </span>{' '}
          <span className={tx.year}>{year}</span>
        </h1>
        <MonthStep month={month} step={1} onMonth={onMonth} />
        {onEditTotal && lines && (
          <UnstyledButton className={tx.add} onClick={onEditTotal}>
            {lines.total.budget == null ? (
              <IconPlus size={20} stroke={1.7} aria-hidden />
            ) : (
              <IconPencil size={20} stroke={1.7} aria-hidden />
            )}
            <span className={tx.addLabel}>
              {t(lines.total.budget == null ? 'budget.slip.setTotal' : 'budget.slip.changeTotal')}
            </span>
          </UnstyledButton>
        )}
      </div>
      {lines ? (
        <Figures lines={lines} ratesMissing={ratesMissing} />
      ) : (
        loading && (
          <div className={tx.figuresLoading} aria-hidden="true">
            <span />
            <span />
          </div>
        )
      )}
    </section>
  );
});

function Figures({ lines, ratesMissing }: { lines: MonthLines; ratesMissing: boolean }) {
  const { t } = useTranslation();
  const money = moneyIn(lines.currency);
  const { total, month } = lines;
  const past = month < thisMonth();
  const share = total.budget ? Math.round((total.spent / total.budget) * 100) : 0;
  const over = total.left != null && total.left < 0;
  const amounts = total.budget != null ? { total: money(total.budget) } : undefined;
  return (
    <>
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
    </>
  );
}
