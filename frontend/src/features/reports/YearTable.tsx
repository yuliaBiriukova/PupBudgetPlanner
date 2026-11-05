import { ScrollArea, UnstyledButton, VisuallyHidden } from '@mantine/core';
import { IconChevronDown, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { currencySign, wholeAmount } from '../../shared/format/money';
import { cx } from '../../shared/ui/cx';
import {
  currentIndex,
  heatLevel,
  monthsBefore,
  plain,
  transactionsLink,
  type ReportPeriod,
} from './report';
import type { Report, ReportCategory, ReportGroup, ReportLine } from './reportsApi';
import classes from './Reports.module.css';

interface CellOptions {
  /** The text colour of an amount that isn't nothing. */
  tone?: (value: number) => string | undefined;
  /** A month over the row's Avg turns red. */
  heat?: boolean;
  /** The row's amounts open its transactions: its category's. */
  category?: ReportCategory;
}

type Cells = (amounts: ReportLine, options?: CellOptions) => ReactNode;

/**
 * The year like the spreadsheet (F-022, variant 3): groups that fold to their totals over their categories, the twelve
 * months, Total and Avg, the summary rows at the foot on the slip's charcoal; income and expenses as bars over the
 * months; a month over the category's usual in four reds; the currency named once in the corner. The group column
 * stays put while the months scroll; the table is as tall as its rows. A month's heading opens the month, a category's
 * amount its transactions. The months before the person's first entry are one folded column that a tap unfolds.
 */
export function YearTable({
  report,
  onMonth,
}: {
  report: Report;
  onMonth: (month: string) => void;
}) {
  const { t } = useTranslation();
  const currency = report.currency;
  const months = report.months;
  const current = currentIndex(report);
  const year = Number(months[0]?.month.slice(0, 4));
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set());
  // The months before the first entry: one column, "Jan – Oct · before your first entry" (owner's review of PR #60)
  const before = monthsBefore(report);
  const [unfolded, setUnfolded] = useState(false);
  const hidden = (m: number) => !unfolded && m < before;
  const beforeCell = (key: string) =>
    before > 0 ? <td key={key} className={classes.before} aria-hidden="true" /> : null;
  const viewport = useRef<HTMLDivElement>(null);
  // Wider than the screen: the sideways bar, always on, in a gutter of its own (owner, 2026-11-04). The table is as
  // tall as its rows and the page scrolls; it has no bar of its own up and down (owner, the same day)
  const [wide, setWide] = useState(false);

  useEffect(() => {
    const el = viewport.current;
    const table = el?.querySelector('table');
    if (!el || !table) return;
    const measure = () => {
      setWide(table.offsetWidth > el.clientWidth + 1);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    observer.observe(table);
    return () => {
      observer.disconnect();
    };
  }, []);

  // The table opens with this month in sight: the months before it to its left, as far as the room goes
  useEffect(() => {
    const el = viewport.current;
    const cell = el?.querySelector<HTMLElement>('thead tr:last-child th[data-current]');
    if (!el || !cell) return;
    const place = () => {
      el.scrollLeft = Math.max(0, cell.offsetLeft + cell.offsetWidth - el.clientWidth);
    };
    // The columns settle as the fonts load and the gutter for the bar comes and goes: the month stays in sight until
    // the person scrolls themselves
    const observer = new ResizeObserver(place);
    const table = el.querySelector('table');
    if (table) observer.observe(table);
    observer.observe(el);
    const stop = () => {
      observer.disconnect();
    };
    el.addEventListener('pointerdown', stop, { once: true });
    el.addEventListener('wheel', stop, { once: true });
    return () => {
      stop();
      el.removeEventListener('pointerdown', stop);
      el.removeEventListener('wheel', stop);
    };
  }, []);

  const monthName = (m: number) => dayjs(months[m]?.month).format('MMM');
  const linked = (
    text: string,
    period: ReportPeriod,
    category: ReportCategory,
    periodName: string,
  ) => (
    <Link
      className={classes.cellLink}
      to={transactionsLink(period, category.id)}
      aria-label={t('reports.table.showTransactions', {
        amount: text,
        category: category.name,
        period: periodName,
      })}
    >
      {text}
    </Link>
  );

  const cells: Cells = (amounts, options = {}) => {
    const average = amounts.average;
    const { category } = options;
    return (
      <>
        {beforeCell('before')}
        {amounts.months.map((value, m) => {
          if (hidden(m)) return null;
          const month = months[m];
          const nothing = value !== null && wholeAmount(value) === 0;
          const level = options.heat && value !== null && average ? heatLevel(value, average) : 0;
          const text = value === null ? '' : nothing ? '–' : plain(value);
          return (
            <td
              key={month?.month ?? m}
              className={cx(
                classes.month,
                nothing && classes.zero,
                value !== null && !nothing && options.tone?.(value),
              )}
              data-current={m === current || undefined}
              data-heat={level || undefined}
            >
              {category && month && value !== null && !nothing
                ? linked(
                    text,
                    { kind: 'month', month: month.month.slice(0, 7) },
                    category,
                    dayjs(month.month).format('MMMM YYYY'),
                  )
                : text}
            </td>
          );
        })}
        {[amounts.total, amounts.average].map((value, i) => {
          const nothing = value !== null && wholeAmount(value) === 0;
          const text = value === null ? '' : nothing ? '–' : plain(value);
          return (
            <td
              key={i === 0 ? 'total' : 'avg'}
              className={cx(
                i === 0 ? classes.total : classes.avg,
                nothing && classes.zero,
                value !== null && !nothing && options.tone?.(value),
              )}
            >
              {i === 0 && category && value !== null && !nothing
                ? linked(text, { kind: 'year', year }, category, String(year))
                : text}
            </td>
          );
        })}
      </>
    );
  };

  const toggle = (id: string) => {
    setOpen((was) => {
      const next = new Set(was);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const { income, expenses } = report.summary;
  const most = Math.max(1, ...[...income.months, ...expenses.months].map((value) => value ?? 0));
  const counted = report.monthsCounted;
  const firstName = monthName(0);
  const beforeRange = before > 1 ? `${firstName} – ${monthName(before - 1)}` : firstName;

  return (
    <div
      className={classes.frame}
      data-x={wide || undefined}
      data-folded={(before > 0 && !unfolded) || undefined}
    >
      <ScrollArea.Autosize
        className={classes.sheet}
        scrollbars="x"
        // Always the same kind: changing it rebuilds the scroll area and loses the place. The bar is hidden while the
        // table fits, and has a gutter of its own when it doesn't (Reports.module.css)
        type="always"
        offsetScrollbars={false}
        viewportRef={viewport}
        viewportProps={{ tabIndex: 0 }}
      >
        <table className={classes.table} data-unfolded={(before > 0 && unfolded) || undefined}>
          <VisuallyHidden component="caption">
            {t('reports.table.caption', { currency })}
          </VisuallyHidden>
          <thead>
            <tr>
              <th className={cx(classes.name, classes.chartCell)} scope="col">
                <span className={classes.legend}>
                  <span>
                    <i className={classes.barIn} /> {t('reports.table.income')}
                  </span>
                  <span>
                    <i className={classes.barOut} /> {t('reports.table.expenses')}
                  </span>
                </span>
              </th>
              {before > 0 && (
                <th className={cx(classes.chartCell, classes.before)} aria-hidden="true" />
              )}
              {months.map((month, m) => {
                if (hidden(m)) return null;
                const inValue = income.months[m] ?? null;
                const outValue = expenses.months[m] ?? null;
                return (
                  <th
                    key={month.month}
                    className={classes.chartCell}
                    data-current={m === current || undefined}
                    aria-hidden="true"
                  >
                    {inValue !== null && outValue !== null && (
                      <span className={classes.bars}>
                        <span
                          className={cx(classes.bar, classes.barIn)}
                          style={{ height: `${String((Math.max(0, inValue) / most) * 100)}%` }}
                        />
                        <span
                          className={cx(classes.bar, classes.barOut)}
                          style={{ height: `${String((Math.max(0, outValue) / most) * 100)}%` }}
                        />
                      </span>
                    )}
                  </th>
                );
              })}
              <th className={classes.chartCell} aria-hidden="true" />
              <th className={classes.chartCell} aria-hidden="true" />
            </tr>
            <tr>
              <th className={classes.name} scope="col">
                {t('reports.table.inCurrency', { sign: currencySign(currency), code: currency })}
              </th>
              {before > 0 && (
                <th className={classes.before} scope="col">
                  <UnstyledButton
                    className={classes.beforeButton}
                    aria-expanded={unfolded}
                    aria-label={
                      unfolded ? t('reports.table.foldBefore', { months: beforeRange }) : undefined
                    }
                    onClick={() => {
                      setUnfolded(!unfolded);
                    }}
                  >
                    {unfolded ? (
                      <IconChevronLeft size={16} stroke={1.7} />
                    ) : (
                      <>
                        <span className={classes.monthLabel}>
                          {beforeRange}
                          <IconChevronRight size={14} stroke={1.7} aria-hidden />
                        </span>
                        <span className={classes.avgNote}>{t('reports.table.before')}</span>
                      </>
                    )}
                  </UnstyledButton>
                </th>
              )}
              {months.map((month, m) => {
                if (hidden(m)) return null;
                const label = (
                  <>
                    <span className={classes.monthLabel}>{monthName(m)}</span>
                    {m === current && (
                      <span className={classes.monthNote}>{t('reports.table.now')}</span>
                    )}
                  </>
                );
                return (
                  <th
                    key={month.month}
                    className={classes.month}
                    scope="col"
                    data-current={m === current || undefined}
                  >
                    {month.state !== 'Future' ? (
                      <UnstyledButton
                        className={classes.monthButton}
                        onClick={() => {
                          onMonth(month.month.slice(0, 7));
                        }}
                      >
                        {label}
                        <VisuallyHidden>{t('reports.table.openMonth')}</VisuallyHidden>
                      </UnstyledButton>
                    ) : (
                      label
                    )}
                  </th>
                );
              })}
              <th className={classes.total} scope="col">
                {t('reports.table.total')}
              </th>
              <th className={classes.avg} scope="col">
                <span className={classes.monthLabel}>{t('reports.table.avg')}</span>
                {counted !== null && counted > 0 && (
                  <span className={classes.avgNote}>
                    {t('reports.table.avgNote', { count: counted })}
                  </span>
                )}
              </th>
            </tr>
          </thead>
          {report.groups.map((group) => (
            <FoldingGroup
              key={group.id}
              group={group}
              cells={cells}
              open={open.has(group.id)}
              onToggle={() => {
                toggle(group.id);
              }}
            />
          ))}
          <tbody className={classes.summary}>
            <tr>
              <th className={classes.name} scope="row">
                {t('reports.table.totalIncome')}
              </th>
              {cells(income, { tone: () => classes.up })}
            </tr>
            <tr>
              <th className={classes.name} scope="row">
                {t('reports.table.totalExpenses')}
              </th>
              {cells(expenses)}
            </tr>
            <tr>
              <th className={classes.name} scope="row">
                {t('reports.table.net')}
              </th>
              {cells(report.summary.net, {
                tone: (value) => (value > 0 ? classes.up : classes.down),
              })}
            </tr>
            <tr>
              <th className={cx(classes.name, classes.muted)} scope="row">
                {t('reports.table.otherChanges')}
              </th>
              {cells(report.summary.otherChanges, { tone: () => classes.muted })}
            </tr>
            <tr>
              <th className={cx(classes.name, classes.balance)} scope="row">
                {t('reports.table.balance')}
              </th>
              {beforeCell('before')}
              {report.summary.balance.months.map((value, m) =>
                hidden(m) ? null : (
                  <td
                    key={months[m]?.month ?? m}
                    className={cx(classes.month, classes.balance)}
                    data-current={m === current || undefined}
                  >
                    {value === null ? '' : plain(value)}
                  </td>
                ),
              )}
              <td className={classes.total} />
              <td className={classes.avg} />
            </tr>
          </tbody>
        </table>
      </ScrollArea.Autosize>
    </div>
  );
}

/** A group's row with its total, which unfolds into its categories. */
function FoldingGroup({
  group,
  cells,
  open,
  onToggle,
}: {
  group: ReportGroup;
  cells: Cells;
  open: boolean;
  onToggle: () => void;
}) {
  const isIncome = group.kind === 'Income';
  const id = `group-${group.id}`;
  return (
    <tbody id={id}>
      <tr className={classes.groupRow}>
        <th className={classes.name} scope="row">
          <UnstyledButton
            className={classes.fold}
            aria-expanded={open}
            aria-controls={id}
            onClick={onToggle}
          >
            <IconChevronDown size={16} stroke={1.7} />
            {group.name}
          </UnstyledButton>
        </th>
        {cells(group.total, { tone: isIncome ? () => classes.income : undefined })}
      </tr>
      {open &&
        group.categories.map((category) => (
          <tr key={category.id} className={classes.child}>
            <th className={classes.name} scope="row">
              {category.name}
            </th>
            {cells(category.amounts, { heat: !isIncome, category })}
          </tr>
        ))}
    </tbody>
  );
}

/** What the reds in the year mean. */
export function HeatKey() {
  const { t } = useTranslation();
  return (
    <div className={classes.heatKey}>
      <span>
        <span className={classes.long}>{t('reports.heat.long')}</span>
        <span className={classes.short}>{t('reports.heat.short')}</span>
      </span>
      {(['1', '2', '3', '4'] as const).map((level) => (
        <span key={level}>
          <i data-heat={level} />{' '}
          <span className={classes.long}>{t(`reports.heat.level${level}`)}</span>
          <span className={classes.short}>{t(`reports.heat.level${level}Short`)}</span>
        </span>
      ))}
    </div>
  );
}
