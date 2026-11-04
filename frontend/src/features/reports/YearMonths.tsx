import { UnstyledButton } from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { formatMoney } from '../../shared/format/money';
import { cx } from '../../shared/ui/cx';
import { currentIndex, monthsBefore, signed, transactionsLink } from './report';
import type { Report } from './reportsApi';
import classes from './YearMonths.module.css';

/**
 * The year on the phone (F-022, option C): the year so far on the slip, the months as rows — what came in and went out
 * as two bars, the NET — each opening its month; under them where the year went, the groups with their total and usual
 * month, each opening its categories, and a category its transactions. The months before the first entry are one row.
 */
export function YearMonths({
  report,
  onMonth,
}: {
  report: Report;
  onMonth: (month: string) => void;
}) {
  const { t } = useTranslation();
  const s = report.summary;
  const currency = report.currency;
  const year = Number(report.months[0]?.month.slice(0, 4));
  const most = Math.max(1, ...[...s.income.months, ...s.expenses.months].map((v) => v ?? 0));
  const [open, setOpen] = useState<string | null>(null);
  const spent = s.expenses.total ?? 0;
  const current = currentIndex(report);
  const before = monthsBefore(report);
  const monthName = (m: number) => dayjs(report.months[m]?.month).format('MMMM');
  // This year: what is on the accounts now; an earlier year: at its end
  const balanceAt = current >= 0 ? current : report.months.length - 1;
  const width = (value: number, whole: number) =>
    `${String(whole > 0 ? (Math.max(0, value) / whole) * 100 : 0)}%`;

  return (
    <div className={classes.stack}>
      <section className={classes.yearSlip} aria-label={t('reports.phone.yearSoFar')}>
        <dl>
          <div>
            <dt>{t('reports.phone.spent')}</dt>
            <dd>{formatMoney(spent, currency)}</dd>
          </div>
          <div>
            <dt>{t('reports.phone.received')}</dt>
            <dd className={classes.slipUp}>{signed(s.income.total ?? 0, currency)}</dd>
          </div>
        </dl>
        <p>
          <span>
            {t(current >= 0 ? 'reports.phone.onAccountsNow' : 'reports.phone.onAccountsAtEnd')}
          </span>
          <span>{formatMoney(s.balance.months[balanceAt] ?? 0, currency)}</span>
        </p>
      </section>

      <ul className={classes.months} aria-label={t('reports.phone.months')}>
        {before > 0 && (
          <li className={classes.monthLater}>
            <span>{before > 1 ? `${monthName(0)} – ${monthName(before - 1)}` : monthName(0)}</span>
            <span>{t('reports.phone.before')}</span>
          </li>
        )}
        {report.months.map((month, m) => {
          if (m < before) return null;
          const income = s.income.months[m] ?? null;
          const expenses = s.expenses.months[m] ?? null;
          const net = s.net.months[m] ?? null;
          if (income === null || expenses === null || net === null) {
            return (
              <li key={month.month} className={classes.monthLater}>
                <span>{dayjs(month.month).format('MMMM')}</span>
                <span>{t('reports.phone.stillToCome')}</span>
              </li>
            );
          }
          return (
            <li key={month.month}>
              <UnstyledButton
                className={classes.monthRow}
                onClick={() => {
                  onMonth(month.month.slice(0, 7));
                }}
              >
                <span className={classes.monthName}>
                  {dayjs(month.month).format('MMM')}
                  {m === current && <span className={classes.now}>{t('reports.table.now')}</span>}
                </span>
                <span className={classes.pair} aria-hidden="true">
                  <span className={classes.barIn} style={{ width: width(income, most) }} />
                  <span className={classes.barOut} style={{ width: width(expenses, most) }} />
                </span>
                <span className={cx(classes.net, net >= 0 ? classes.up : classes.down)}>
                  {signed(net, currency)}
                </span>
                <IconChevronRight size={16} stroke={1.7} className={classes.go} />
                <span className={classes.monthNote}>
                  {t('reports.phone.inOut', {
                    income: formatMoney(income, currency),
                    expenses: formatMoney(expenses, currency),
                  })}
                </span>
              </UnstyledButton>
            </li>
          );
        })}
      </ul>

      <section aria-labelledby="reports-where-year-went">
        <h2 id="reports-where-year-went" className={classes.sectionTitle}>
          {t('reports.phone.whereYearWent')}
        </h2>
        <ul className={classes.groups}>
          {report.groups
            .filter((group) => group.kind === 'Expense')
            .map((group) => {
              const total = group.total.total ?? 0;
              const isOpen = open === group.id;
              return (
                <li key={group.id}>
                  <UnstyledButton
                    className={classes.groupLine}
                    aria-expanded={isOpen}
                    onClick={() => {
                      setOpen(isOpen ? null : group.id);
                    }}
                  >
                    <span>{group.name}</span>
                    <span>{formatMoney(total, currency)}</span>
                    <span className={classes.track} aria-hidden="true">
                      <span style={{ width: width(total, spent) }} />
                    </span>
                    <span className={classes.monthNote}>
                      {t('reports.phone.usuallyMonth', {
                        amount: formatMoney(group.total.average ?? 0, currency),
                      })}
                    </span>
                  </UnstyledButton>
                  {isOpen && (
                    <ul className={classes.categories}>
                      {group.categories.map((category) => (
                        <li key={category.id}>
                          <Link
                            className={classes.category}
                            to={transactionsLink({ kind: 'year', year }, category.id)}
                          >
                            <span>{category.name}</span>
                            <span>{formatMoney(category.amounts.total ?? 0, currency)}</span>
                            <span className={classes.monthNote}>
                              {t('reports.phone.usually', {
                                amount: formatMoney(category.amounts.average ?? 0, currency),
                              })}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
        </ul>
      </section>
    </div>
  );
}
