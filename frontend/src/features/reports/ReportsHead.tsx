import { ActionIcon, SegmentedControl, Title } from '@mantine/core';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { CurrencyPicker } from '../../shared/ui/CurrencyPicker';
import { yourCurrencies } from '../accounts/accountGroups';
import { accountsQuery } from '../accounts/accountsApi';
import type { ReportPeriod } from './report';
import classes from './Reports.module.css';

interface ReportsHeadProps {
  kind: ReportPeriod['kind'];
  onKind: (kind: ReportPeriod['kind']) => void;
  /** The period's name: `2026`, `October 2026`. */
  period: string;
  /** None when there is nothing before or after (the ‹ › are off). */
  onPrevious?: () => void;
  onNext?: () => void;
  currency: string;
  onCurrency: (currency: string) => void;
}

/**
 * The Reports page's head (F-022): the title (only for screen readers on the phone, where the tab bar says Reports),
 * Year / Month, the period with ‹ ›, and the report currency as a filter pill opening the shared currency list.
 */
export function ReportsHead({
  kind,
  onKind,
  period,
  onPrevious,
  onNext,
  currency,
  onCurrency,
}: ReportsHeadProps) {
  const { t } = useTranslation();
  const accounts = useQuery(accountsQuery);
  const isYear = kind === 'year';

  return (
    <div className={classes.head}>
      <Title order={1} className={classes.title}>
        {t('nav.reports')}
      </Title>
      <div className={classes.stepper}>
        <ActionIcon
          variant="quiet"
          aria-label={t(isYear ? 'reports.previousYear' : 'reports.previousMonth')}
          disabled={!onPrevious}
          onClick={onPrevious}
        >
          <IconChevronLeft size={20} stroke={1.7} />
        </ActionIcon>
        <span className={classes.period} aria-live="polite">
          {period}
        </span>
        <ActionIcon
          variant="quiet"
          aria-label={t(isYear ? 'reports.nextYear' : 'reports.nextMonth')}
          disabled={!onNext}
          onClick={onNext}
        >
          <IconChevronRight size={20} stroke={1.7} />
        </ActionIcon>
      </div>
      <span className={classes.break} aria-hidden="true" />
      <SegmentedControl
        className={classes.mode}
        aria-label={t('reports.report')}
        value={kind}
        onChange={(value) => {
          onKind(value === 'month' ? 'month' : 'year');
        }}
        data={[
          { value: 'year', label: t('reports.year') },
          { value: 'month', label: t('reports.month') },
        ]}
      />
      <div className={classes.currency}>
        <CurrencyPicker
          pill
          label={t('reports.currency')}
          sheetTitle={t('reports.currency')}
          value={currency}
          onChange={onCurrency}
          currencies={accounts.data?.currencies ?? [currency]}
          yours={accounts.data ? yourCurrencies(accounts.data) : [currency]}
        />
      </div>
    </div>
  );
}
