import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { formatMoney, wholeAmount } from '../../shared/format/money';
import { cx } from '../../shared/ui/cx';
import paper from '../transactions/TransactionsPage.module.css';
import { signed, transactionsLink } from './report';
import type { Report, ReportGroup, ReportLine } from './reportsApi';
import classes from './MonthReport.module.css';

const value = (line: ReportLine) => line.months[0] ?? 0;

/**
 * The month (F-022, M2): the month from the balance at the start to the end on a receipt — beside the categories on
 * the desktop, first on the phone — and a receipt a group with its total, holding the categories with something in
 * the month, stacked like the Transactions page's days. A category's line opens its transactions in the month.
 */
export function MonthReport({ report, periodName }: { report: Report; periodName: string }) {
  const { t } = useTranslation();
  const month = report.months[0]?.month.slice(0, 7) ?? '';
  const groups = report.groups
    .map((group) => ({
      group,
      used: group.categories.filter((category) => wholeAmount(value(category.amounts)) !== 0),
    }))
    .filter(({ used }) => used.length > 0);

  return (
    <div className={classes.layout}>
      <div className={cx(paper.slips, classes.side)}>
        <Ledger report={report} />
      </div>
      <div className={classes.main}>
        {groups.length === 0 ? (
          <div className={classes.nothing}>
            <h2>{t('reports.nothingTitle', { period: periodName })}</h2>
            <p>{t('reports.nothingText', { period: periodName })}</p>
          </div>
        ) : (
          <div className={cx(paper.slips, classes.receipts)}>
            {groups.map(({ group, used }) => (
              <section key={group.id} className={paper.paper} aria-label={group.name}>
                <GroupHead group={group} currency={report.currency} />
                <div className={paper.rule} role="presentation" />
                <ul className={classes.lines}>
                  {used.map((category) => (
                    <li key={category.id}>
                      <Link
                        className={classes.line}
                        to={transactionsLink({ kind: 'month', month }, category.id)}
                      >
                        <span>{category.name}</span>
                        <span className={paper.leader} aria-hidden="true" />
                        <span className={group.kind === 'Income' ? classes.income : undefined}>
                          {formatMoney(value(category.amounts), report.currency)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function GroupHead({ group, currency }: { group: ReportGroup; currency: string }) {
  const isIncome = group.kind === 'Income';
  return (
    <div className={classes.groupHead}>
      <h2>{group.name}</h2>
      <span className={isIncome ? classes.income : undefined}>
        {isIncome
          ? signed(value(group.total), currency)
          : formatMoney(value(group.total), currency)}
      </span>
    </div>
  );
}

/** The month from the balance at the start to the end: start + income − expenses + other changes = end. */
function Ledger({ report }: { report: Report }) {
  const { t } = useTranslation();
  const s = report.summary;
  const currency = report.currency;
  const income = value(s.income);
  const expenses = value(s.expenses);
  const line = (label: string, amount: ReactNode, tone?: string) => (
    <li className={classes.line}>
      <span>{label}</span>
      <span className={paper.leader} aria-hidden="true" />
      <span className={tone}>{amount}</span>
    </li>
  );
  return (
    <section className={paper.paper} aria-labelledby="reports-the-month">
      <h2 id="reports-the-month" className={paper.receiptDay}>
        {t('reports.ledger.title')}
      </h2>
      <div className={paper.rule} role="presentation" />
      <ul className={classes.lines}>
        {line(t('reports.ledger.start'), formatMoney(s.startBalance ?? 0, currency))}
        {line(
          t('reports.ledger.income'),
          signed(income, currency),
          wholeAmount(income) ? classes.income : undefined,
        )}
        {line(
          t('reports.ledger.expenses'),
          signed(-expenses, currency),
          wholeAmount(expenses) ? classes.expense : undefined,
        )}
        {line(t('reports.ledger.otherChanges'), signed(value(s.otherChanges), currency))}
      </ul>
      <div className={paper.rule} role="presentation" />
      <div className={classes.end}>
        <span>{t('reports.ledger.end')}</span>
        <span>{formatMoney(s.balance.months[0] ?? 0, currency)}</span>
      </div>
      <p className={classes.note}>{t('reports.ledger.note')}</p>
    </section>
  );
}
