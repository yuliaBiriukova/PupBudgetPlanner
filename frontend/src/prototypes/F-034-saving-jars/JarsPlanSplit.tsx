import { UnstyledButton } from '@mantine/core';
import { useId, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { moneyIn, type MonthLines } from '../../features/budget/budget';
import classes from '../../features/budget/MonthColumn.module.css';
import { cx } from '../../shared/ui/cx';

/** Darkest for the biggest part, lighter for each next: shades of the text colour, no new colours (as `PlanSplit`). */
const shade = (index: number) => `${String(Math.max(24, 92 - index * 30))}%`;

const scrollTo = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

/**
 * F-033's *Where the … goes* (`PlanSplit`) copied for the jars (owner, 2026-11-27): the month's plan for jars is a part
 * of its own, beside the groups, sorted with them by size; *Not in any group* is what's left after both. A row brings
 * its group, or the Jars card, into view.
 */
export function JarsPlanSplit({ lines, jars }: { lines: MonthLines; jars: number }) {
  const { t } = useTranslation();
  const titleId = useId();
  const money = moneyIn(lines.currency);
  const total = lines.total.budget;
  if (total == null || total <= 0) return null;
  const parts = [
    ...lines.groups
      .filter((g) => (g.budget ?? 0) > 0)
      .map((g) => ({ id: `budget-group-${g.id}`, name: g.name, amount: g.budget ?? 0 })),
    ...(jars > 0 ? [{ id: 'budget-jars', name: 'Jars', amount: jars }] : []),
  ].sort((a, b) => b.amount - a.amount);
  const free = Math.max(0, (lines.unplanned ?? 0) - jars);
  const share = (amount: number) => Math.round((amount / total) * 100);
  const width = (amount: number) => `${String((amount / total) * 100)}%`;
  return (
    <section className={classes.panel} aria-labelledby={titleId}>
      <h2 id={titleId} className={classes.title}>
        {t('budget.split.title', { total: money(total) })}
      </h2>
      <div className={classes.split} aria-hidden data-testid="plan-split">
        {parts.map((part, index) => (
          <span
            key={part.id}
            style={{ '--part': width(part.amount), '--shade': shade(index) } as CSSProperties}
          />
        ))}
        {free > 0 && (
          <span className={classes.free} style={{ '--part': width(free) } as CSSProperties} />
        )}
      </div>
      <div className={classes.list}>
        {parts.map((part, index) => (
          <UnstyledButton
            key={part.id}
            className={cx(classes.row, classes.legendRow)}
            onClick={() => {
              scrollTo(part.id);
            }}
          >
            <span
              className={classes.swatch}
              style={{ '--shade': shade(index) } as CSSProperties}
              aria-hidden
            />
            <span>{part.name}</span>
            <span className={classes.num}>{money(part.amount)}</span>
            <span className={cx(classes.num, classes.dim, classes.share)}>
              {t('budget.split.share', { share: share(part.amount) })}
            </span>
          </UnstyledButton>
        ))}
        {free > 0 && (
          <div className={cx(classes.row, classes.legendRow)}>
            <span className={cx(classes.swatch, classes.free)} aria-hidden />
            <span className={classes.dim}>{t('budget.split.free')}</span>
            <span className={classes.num}>{money(free)}</span>
            <span className={cx(classes.num, classes.dim, classes.share)}>
              {t('budget.split.share', { share: share(free) })}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
