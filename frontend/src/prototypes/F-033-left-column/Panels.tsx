import { UnstyledButton } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import type { CSSProperties } from 'react';
import { cx } from '../../shared/ui/cx';
import { moneyIn, tightest } from '../../features/budget/budget';
import { Bar } from '../../features/budget/parts';
import type { Panel } from './LeftColumnPage';
import classes from './Panels.module.css';

/**
 * Variant 1, "Not in the plan": this month's spending in categories without a budget, the biggest first. The groups on
 * the right list only categories with a budget, so this is where the rest of the money shows; a row opens the new
 * budget's dialog in its group.
 */
export const NotInThePlan: Panel = ({ lines, onOpen }) => {
  const money = moneyIn(lines.currency);
  const rows = lines.groups
    .flatMap((group) =>
      group.categories
        .filter((c) => c.budget == null && c.spent > 0)
        .map((c) => ({ ...c, groupId: group.id, groupName: group.name })),
    )
    .sort((a, b) => b.spent - a.spent);
  if (rows.length === 0) return null;
  const sum = rows.reduce((total, row) => total + row.spent, 0);
  return (
    <section className={classes.panel} aria-label="Not in the plan">
      <p className={classes.label}>Spent outside the plan</p>
      <p className={classes.lead}>
        <span className={classes.num}>{money(sum)}</span> in categories without a budget
      </p>
      <div className={classes.list}>
        {rows.map((row) => (
          <UnstyledButton
            key={row.id}
            className={classes.row}
            aria-haspopup="dialog"
            title="Set a budget"
            onClick={() => {
              onOpen({ kind: 'new', groupId: row.groupId });
            }}
          >
            <span className={classes.rowName}>
              <span>{row.name}</span>
              <span className={classes.dim}>{row.groupName}</span>
            </span>
            <span className={classes.num}>{money(row.spent)}</span>
            <IconPlus className={classes.plus} size={16} stroke={1.7} aria-hidden />
          </UnstyledButton>
        ))}
      </div>
    </section>
  );
};

/**
 * Variant 2, "Running out": the four categories over or closest to their budget, each as a line with its bar. Quick to
 * read without scrolling the groups; a row opens its budget's dialog.
 */
export const RunningOut: Panel = ({ lines, onOpen }) => {
  const money = moneyIn(lines.currency);
  const rows = tightest(lines, 4);
  if (rows.length === 0) return null;
  return (
    <section className={classes.panel} aria-label="Running out">
      <p className={classes.label}>Closest to running out</p>
      <div className={classes.list}>
        {rows.map((row) => (
          <UnstyledButton
            key={row.id}
            className={cx(classes.row, classes.lineRow)}
            aria-haspopup="dialog"
            onClick={() => {
              onOpen({ kind: 'category', id: row.id });
            }}
          >
            <span className={classes.lineTop}>
              <span>{row.name}</span>
              <span className={cx(classes.num, (row.left ?? 0) < 0 ? classes.over : '')}>
                {(row.left ?? 0) < 0
                  ? `${money(-(row.left ?? 0))} over`
                  : `${money(row.left ?? 0)} left`}
              </span>
            </span>
            <Bar spent={row.spent} budget={row.budget} />
          </UnstyledButton>
        ))}
      </div>
    </section>
  );
};

/**
 * Variant 3, "Where the total goes" (the risk): the month's total as one bar split by its groups' budgets, and the part
 * in no group left open, with a legend of each group's share. It shows the plan's shape at a glance; a legend row
 * brings its group into view.
 */
export const WhereItGoes: Panel = ({ lines }) => {
  const money = moneyIn(lines.currency);
  const total = lines.total.budget;
  if (total == null || total <= 0) return null;
  const parts = lines.groups
    .filter((g) => (g.budget ?? 0) > 0)
    .sort((a, b) => (b.budget ?? 0) - (a.budget ?? 0));
  const free = Math.max(0, lines.unplanned ?? 0);
  const share = (amount: number) => Math.round((amount / total) * 100);
  // Darkest for the biggest group, lighter for each next: shades of the text colour, no new colours
  const shade = (index: number) => `${String(Math.max(24, 92 - index * 30))}%`;
  return (
    <section className={classes.panel} aria-label="Where the total goes">
      <p className={classes.label}>Where the {money(total)} goes</p>
      <div className={classes.split} aria-hidden>
        {parts.map((group, index) => (
          <span
            key={group.id}
            style={
              {
                '--part': `${String(((group.budget ?? 0) / total) * 100)}%`,
                '--shade': shade(index),
              } as CSSProperties
            }
          />
        ))}
        {free > 0 && (
          <span
            className={classes.free}
            style={{ '--part': `${String((free / total) * 100)}%` } as CSSProperties}
          />
        )}
      </div>
      <div className={classes.list}>
        {parts.map((group, index) => (
          <UnstyledButton
            key={group.id}
            className={cx(classes.row, classes.legendRow)}
            onClick={() => {
              document
                .querySelector(`section[aria-label="${group.name}"]`)
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
              {share(group.budget ?? 0)} %
            </span>
          </UnstyledButton>
        ))}
        {free > 0 && (
          <div className={cx(classes.row, classes.legendRow, classes.static)}>
            <span className={cx(classes.swatch, classes.free)} aria-hidden />
            <span className={classes.dim}>Not in any group</span>
            <span className={classes.num}>{money(free)}</span>
            <span className={cx(classes.num, classes.dim, classes.share)}>{share(free)} %</span>
          </div>
        )}
      </div>
    </section>
  );
};
