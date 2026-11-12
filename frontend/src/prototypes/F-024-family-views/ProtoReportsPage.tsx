import { Skeleton, UnstyledButton } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconRefresh } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { DESKTOP_QUERY } from '../../app/shell/sections';
import { afterPopupsClose } from '../../shared/ui/popupHistory';
import { cx } from '../../shared/ui/cx';
import { settingsQuery } from '../../features/settings/settingsApi';
import { MonthReport } from '../../features/reports/MonthReport';
import {
  addressFrom,
  periodName,
  reportParams,
  stepped,
  switched,
  usedOnly,
  type ReportAddress,
} from '../../features/reports/report';
import { ReportsHead } from '../../features/reports/ReportsHead';
import { usePageWho, whoseMonthQuery, whoseYearQuery } from './who';
import classes from '../../features/reports/Reports.module.css';
import { HeatKey, YearTable } from '../../features/reports/YearTable';
import { YearMonths } from '../../features/reports/YearMonths';

/**
 * Reports (F-022): the year like the spreadsheet — a table whose groups fold to their totals on the desktop and tablet,
 * the months as rows on the phone — and the month as a receipt a group with its balance from the start to the end.
 * The period and the currency are the page's address; it opens on this year in the person's report currency.
 */
export function ProtoReportsPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const address = addressFrom(params);
  const { period, currency } = address;
  const isPhone = !useMediaQuery(DESKTOP_QUERY, false, { getInitialValueInEffect: false });
  const settings = useQuery(settingsQuery);

  const [who] = usePageWho();
  const report = useQuery(
    period.kind === 'year'
      ? whoseYearQuery(who, period.year, currency)
      : whoseMonthQuery(who, period.month, currency),
  );

  // A pick in a phone sheet lands on the page's own history entry once the sheet's step is gone (I-015)
  const go = (next: ReportAddress) => {
    afterPopupsClose(() => {
      setParams(reportParams(next), { replace: true });
    });
  };
  const step = (by: -1 | 1) => {
    const next = stepped(period, by, report.data?.firstMonth ?? null);
    return next
      ? () => {
          go({ ...address, period: next });
        }
      : undefined;
  };
  const openMonth = (month: string) => {
    go({ ...address, period: { kind: 'month', month } });
  };

  // The report asked for, or the last one of the same kind while the next loads (a year isn't shown as a month)
  const kept =
    report.data?.months.length === (period.kind === 'year' ? 12 : 1) ? report.data : undefined;
  const data = kept && period.kind === 'year' ? usedOnly(kept) : kept;
  const stale = report.isPlaceholderData;
  const name = periodName(period);

  let body;
  if (report.isError && !data) {
    body = (
      <div className={classes.errorBanner} role="alert">
        <p>{t('reports.error')}</p>
        <UnstyledButton
          className={classes.retry}
          onClick={() => {
            void report.refetch();
          }}
        >
          <IconRefresh size={16} stroke={1.7} aria-hidden />
          {t('reports.retry')}
        </UnstyledButton>
      </div>
    );
  } else if (!data) {
    body = (
      <div role="status" aria-busy="true" aria-label={t('reports.loading')}>
        <Skeleton height={isPhone ? 120 : 88} radius="lg" mb={16} />
        <Skeleton height={isPhone ? 360 : 420} radius="lg" />
      </div>
    );
  } else if (data.firstMonth === null) {
    body = (
      <div className={classes.empty}>
        <h2 className={classes.emptyTitle}>{t('reports.emptyTitle')}</h2>
        <p className={classes.emptyText}>{t('reports.emptyText')}</p>
      </div>
    );
  } else if (period.kind === 'month') {
    body = <MonthReport report={data} periodName={name} />;
  } else if (data.groups.length === 0) {
    body = (
      <div className={classes.empty}>
        <h2 className={classes.emptyTitle}>{t('reports.nothingTitle', { period: name })}</h2>
        <p className={classes.emptyText}>{t('reports.nothingText', { period: name })}</p>
      </div>
    );
  } else if (isPhone) {
    body = <YearMonths report={data} onMonth={openMonth} />;
  } else {
    body = (
      <>
        <HeatKey />
        <YearTable key={data.months[0]?.month} report={data} onMonth={openMonth} />
      </>
    );
  }

  return (
    <div className={classes.page} data-wide>
      <ReportsHead
        kind={period.kind}
        onKind={(kind) => {
          go({ ...address, period: switched(period, kind) });
        }}
        period={name}
        onPrevious={step(-1)}
        onNext={step(1)}
        currency={currency ?? report.data?.currency ?? settings.data?.reportCurrency ?? 'UAH'}
        onCurrency={(code) => {
          go({
            ...address,
            currency: code === settings.data?.reportCurrency ? undefined : code,
          });
        }}
      />
      <div className={cx(classes.page, stale && classes.stale)}>{body}</div>
      {data?.months.some((month) => month.ratesMissing) && (
        <p className={classes.note}>{t('reports.ratesMissing')}</p>
      )}
    </div>
  );
}
