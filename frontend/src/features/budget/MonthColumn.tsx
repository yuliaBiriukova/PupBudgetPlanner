import { UnstyledButton } from '@mantine/core';
import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { cx } from '../../shared/ui/cx';
import { FadingScrollArea } from '../../shared/ui/FadingScrollArea';
import { shareText } from '../transactions/calendar';
import tx from '../transactions/TransactionsPage.module.css';
import { moneyIn, type MonthLines } from './budget';
import classes from './MonthColumn.module.css';

/** Darkest for the biggest group, lighter for each next: shades of the text colour, no new colours. */
const shade = (index: number) => `${String(Math.max(24, 92 - index * 30))}%`;

/**
 * Where the month's total goes (F-033, owner's review of PR #115): one bar split by the groups' budgets, the part in no
 * group an outline, and a legend with each group's amount and share; a row brings its group into view. Nothing without
 * a total.
 */
export function PlanSplit({ lines }: { lines: MonthLines }) {
  const { t } = useTranslation();
  const money = moneyIn(lines.currency);
  const total = lines.total.budget;
  if (total == null || total <= 0) return null;
  const parts = lines.groups
    .filter((g) => (g.budget ?? 0) > 0)
    .sort((a, b) => (b.budget ?? 0) - (a.budget ?? 0));
  const free = Math.max(0, lines.unplanned ?? 0);
  const share = (amount: number) => Math.round((amount / total) * 100);
  const width = (amount: number) => `${String((amount / total) * 100)}%`;
  return (
    <section
      className={classes.panel}
      aria-label={t('budget.split.title', { total: money(total) })}
    >
      <p className={classes.label}>{t('budget.split.title', { total: money(total) })}</p>
      <div className={classes.split} aria-hidden data-testid="plan-split">
        {parts.map((group, index) => (
          <span
            key={group.id}
            style={{ '--part': width(group.budget ?? 0), '--shade': shade(index) } as CSSProperties}
          />
        ))}
        {free > 0 && (
          <span className={classes.free} style={{ '--part': width(free) } as CSSProperties} />
        )}
      </div>
      <div className={classes.list}>
        {parts.map((group, index) => (
          <UnstyledButton
            key={group.id}
            className={cx(classes.row, classes.legendRow)}
            onClick={() => {
              document
                .getElementById(`budget-group-${group.id}`)
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          >
            <span
              className={classes.swatch}
              style={{ '--shade': shade(index) } as CSSProperties}
              aria-hidden
            />
            <span>{group.name}</span>
            <span className={classes.num}>{money(group.budget ?? 0)}</span>
            <span className={cx(classes.num, classes.dim, classes.share)}>
              {t('budget.split.share', { share: share(group.budget ?? 0) })}
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

/**
 * Spent outside the plan (F-033, owner's review of PR #115): this month's spending in categories without a budget,
 * biggest first, as Transactions' "Where it went" rows (the amount, its share of the month's spending and a bar). The
 * groups list only categories with a budget, so this is where the rest of the money shows; a row opens New budget with
 * its category picked. On the desktop its list scrolls inside the month's column.
 */
export function OutsidePlan({
  lines,
  onNew,
}: {
  lines: MonthLines;
  onNew: (groupId: string, categoryId: string) => void;
}) {
  const { t } = useTranslation();
  const money = moneyIn(lines.currency);
  const rows = lines.groups
    .flatMap((group) =>
      group.categories
        .filter((c) => c.budget == null && c.spent > 0)
        .map((c) => ({ ...c, groupId: group.id })),
    )
    .sort((a, b) => b.spent - a.spent);
  if (rows.length === 0) return null;
  const sum = rows.reduce((total, row) => total + row.spent, 0);
  const max = rows[0]?.spent ?? 0;
  return (
    <section className={cx(classes.panel, classes.outside)} aria-label={t('budget.outside.title')}>
      <p className={classes.label}>{t('budget.outside.title')}</p>
      <p className={classes.lead}>{t('budget.outside.lead', { amount: money(sum) })}</p>
      <FadingScrollArea className={classes.outsideScroll}>
        <ul className={cx(tx.bars, classes.bars)}>
          {rows.map((row) => (
            <li key={row.id}>
              <UnstyledButton
                className={tx.bar}
                aria-haspopup="dialog"
                title={t('budget.outside.set')}
                style={{
                  '--width': `${(max > 0 ? Math.max(2, (row.spent / max) * 100) : 2).toFixed(1)}%`,
                }}
                onClick={() => {
                  onNew(row.groupId, row.id);
                }}
              >
                <span className={tx.barName}>{row.name}</span>
                <span className={tx.barAmount}>{money(row.spent)}</span>
                <span className={tx.barShare}>{shareText(row.spent, lines.total.spent)}</span>
                <span className={tx.track} aria-hidden="true">
                  <span />
                </span>
              </UnstyledButton>
            </li>
          ))}
        </ul>
      </FadingScrollArea>
    </section>
  );
}
