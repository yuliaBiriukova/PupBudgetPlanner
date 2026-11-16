import { useQuery } from '@tanstack/react-query';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { cx } from '../../shared/ui/cx';
import { leftFor, linesOf, moneyIn, thisMonth, tightest } from './budget';
import { monthBudgetQuery } from './budgetApi';
import classes from './Budget.module.css';
import { Bar } from './parts';
import r from './Reminder.module.css';

/** `1 095 ₴ left` or `607 ₴ over`. */
function useLeftText(currency: string) {
  const { t } = useTranslation();
  const money = moneyIn(currency);
  return (left: number) =>
    left < 0
      ? t('budget.amount.over', { amount: money(-left) })
      : t('budget.amount.left', { amount: money(left) });
}

/**
 * Under the amount in the quick-add form (F-033): the picked category's left and, as the amount is typed, what it
 * leaves after this one, its bar showing both. A category without its own budget shows its group's, else the month's
 * (Q-015); nothing in a month not planned. Only while adding: a change to a saved expense is already counted.
 */
export function AmountLeft({
  categoryId,
  amount,
  date,
  adding,
}: {
  categoryId: string | null;
  amount: number;
  /** The form's day: its month's budget. */
  date: string;
  adding: boolean;
}) {
  const { t } = useTranslation();
  const { data } = useQuery(monthBudgetQuery(date.slice(0, 7)));
  const leftText = useLeftText(data?.currency ?? 'UAH');
  if (!categoryId || !data?.planned) return null;
  const left = leftFor(linesOf(data), categoryId);
  if (!left) return null;
  const adds = adding ? Math.max(0, amount) : 0;
  const after = left.left - adds;
  const whose =
    left.of === 'category'
      ? left.name
      : left.of === 'group'
        ? t('budget.form.group', { name: left.name })
        : t('budget.form.total');
  return (
    <div className={r.leftLine} aria-live="polite" data-testid="amount-left">
      <span>
        {adds > 0 ? (
          <Trans
            i18nKey="budget.form.lineAfter"
            values={{ whose, left: leftText(left.left), after: leftText(after) }}
            components={{
              b: <b data-over={left.left < 0 || undefined} />,
              after: <b data-over={after < 0 || undefined} />,
            }}
          />
        ) : (
          <Trans
            i18nKey="budget.form.line"
            values={{ whose, left: leftText(left.left) }}
            components={{ b: <b data-over={left.left < 0 || undefined} /> }}
          />
        )}
      </span>
      <AfterBar budget={left.budget} spent={left.budget - left.left} adding={adds} />
    </div>
  );
}

function AfterBar({ budget, spent, adding }: { budget: number; spent: number; adding: number }) {
  const share = (value: number) =>
    `${String(Math.max(0, Math.min(100, Math.round((value / budget) * 1000) / 10)))}%`;
  return (
    <span
      className={r.afterBar}
      data-over={spent + adding > budget || undefined}
      data-over-now={spent > budget || undefined}
      aria-hidden
    >
      <span style={{ width: share(spent) }} />
      {adding > 0 && <span className={r.afterAdd} style={{ width: share(adding) }} />}
    </span>
  );
}

/**
 * On the Transactions page (F-033): the month's left with its bar and the two categories closest to running out; it
 * opens the Budget page. Over the calendar on the desktop, under the slip on the phone. Only for a planned month.
 */
export function BudgetSummary({ month }: { month: string }) {
  const { t } = useTranslation();
  const { data } = useQuery(monthBudgetQuery(month));
  const leftText = useLeftText(data?.currency ?? 'UAH');
  if (!data?.planned) return null;
  const lines = linesOf(data);
  if (lines.isEmpty) return null;
  const { total } = lines;
  return (
    <Link
      to={`/budget${month === thisMonth() ? '' : `?month=${month}`}`}
      className={r.summary}
      data-testid="budget-summary"
    >
      <span className={r.summaryTop}>
        <span>{t('budget.summary.title')}</span>
        {total.left != null && (
          <span className={cx(classes.num, total.left < 0 ? classes.over : '')}>
            {leftText(total.left)}
          </span>
        )}
      </span>
      {total.budget != null && <Bar spent={total.spent} budget={total.budget} />}
      {tightest(lines, 2).map((c) => (
        <span key={c.id} className={r.summaryRow}>
          <span>{c.name}</span>
          <span className={cx(classes.num, (c.left ?? 0) < 0 ? classes.over : classes.dim)}>
            {leftText(c.left ?? 0)}
          </span>
        </span>
      ))}
    </Link>
  );
}
