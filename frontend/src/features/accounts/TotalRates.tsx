import { IconInfoCircle } from '@tabler/icons-react';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../../shared/format/date';
import { formatRate } from '../../shared/format/money';
import classes from './Accounts.module.css';
import type { AccountsTotal } from './accountsApi';

/**
 * The rates under a total and their date, in hryvnias as the NBU publishes them; earlier ones say why (F-014's "Total:
 * earlier rates"). Under "In total" on Accounts and under the total in Settings (F-016).
 */
export function TotalRates({ total }: { total: AccountsTotal }) {
  const { t } = useTranslation();
  if (total.rates.length === 0 || !total.ratesDate) return null;

  const date = formatDate(new Date(`${total.ratesDate}T00:00`));
  const rates = total.rates.map((item, i) => (
    <Fragment key={item.currency}>
      {i > 0 && ', '}
      <span className={classes.num}>{formatRate(item.currency, item.rate, 'UAH')}</span>
    </Fragment>
  ));

  return (
    <p className={classes.rates}>
      {total.status === 'Current' ? (
        t('accounts.rates.current', { date })
      ) : (
        <span className={classes.stale}>
          <IconInfoCircle size={16} stroke={1.7} aria-hidden />
          {t(
            total.status === 'NotPublished'
              ? 'accounts.rates.notPublished'
              : 'accounts.rates.unavailable',
            { date },
          )}
        </span>
      )}{' '}
      {rates}
    </p>
  );
}
