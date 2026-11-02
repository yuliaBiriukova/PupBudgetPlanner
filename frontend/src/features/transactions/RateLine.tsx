import { UnstyledButton } from '@mantine/core';
import { Trans, useTranslation } from 'react-i18next';
import { formatDate } from '../../shared/format/date';
import { exchangeRateText, nbuRate } from './exchange';
import classes from './TransactionForm.module.css';
import type { DayRates } from './transactionsApi';

interface RateLineProps {
  from: string;
  to: string;
  /** The To account's name, for "Type how much … got." */
  toName: string;
  /** `YYYY-MM-DD`: the transaction's day. */
  date: string;
  amount: number | null;
  toAmount: number | null;
  /** The To amount was typed by the person, not suggested. */
  byHand: boolean;
  /** The day's rates; none while they load or when they couldn't be loaded. */
  rates?: DayRates;
  loading: boolean;
  onUseNbu: () => void;
}

/**
 * Where an exchange's second number comes from (F-019 final prototype): the NBU rate of the picked day (or the latest
 * earlier one, said so), or "Your rate" next to the NBU's once the person typed what the bank gave, with "Use the NBU
 * rate" to go back. With no rate at all it asks for the amount.
 */
export function RateLine({
  from,
  to,
  toName,
  date,
  amount,
  toAmount,
  byHand,
  rates,
  loading,
  onUseNbu,
}: RateLineProps) {
  const { t } = useTranslation();
  const known = rates ?? { date: null, status: 'Missing' as const, rates: {} };
  const nbu = nbuRate(from, to, known.rates);
  const num = { num: <span className={classes.num} /> };

  let text;
  if (byHand && amount && toAmount && amount > 0 && toAmount > 0) {
    const yours = exchangeRateText(from, to, toAmount / amount, known.rates);
    text = (
      <>
        <Trans i18nKey="transactions.rate.yours" values={{ rate: yours }} components={num} />{' '}
        {nbu === null ? (
          t('transactions.rate.nbuNone')
        ) : (
          <>
            <Trans
              i18nKey="transactions.rate.nbu"
              values={{ rate: exchangeRateText(from, to, nbu, known.rates) }}
              components={num}
            />
            <UnstyledButton
              className={classes.textLink}
              onClick={(event) => {
                // Not a tap on the display: the keys stay where they are
                event.stopPropagation();
                onUseNbu();
              }}
            >
              {t('transactions.rate.useNbu')}
            </UnstyledButton>
          </>
        )}
      </>
    );
  } else if (loading) {
    text = t('transactions.rate.loading');
  } else if (nbu === null || !known.date) {
    text = t('transactions.rate.none', { account: toName });
  } else {
    const values = {
      rate: exchangeRateText(from, to, nbu, known.rates),
      date: formatDate(`${date}T00:00`),
      ratesDate: formatDate(`${known.date}T00:00`),
    };
    const key =
      known.status === 'NotPublished'
        ? 'transactions.rate.notPublished'
        : known.status === 'Unavailable'
          ? 'transactions.rate.unavailable'
          : 'transactions.rate.current';
    text = (
      <>
        <Trans i18nKey={key} values={values} components={num} /> {t('transactions.rate.change')}
      </>
    );
  }

  return (
    <p className={classes.rate} aria-live="polite">
      {text}
    </p>
  );
}
