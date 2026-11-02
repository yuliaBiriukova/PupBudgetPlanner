import { IconArrowRight } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { formatMoney } from '../../shared/format/money';
import { cx } from '../../shared/ui/cx';
import classes from './Transactions.module.css';
import { isExchange, type Transaction } from './transactionsApi';

/** A true minus or plus in front of the amount. */
const SIGN = { Expense: '−', Income: '+' } as const;

/**
 * An amount in a list or a question: red with a minus for an expense, green with a plus for an income. Color is never
 * the only signal (DESIGN_RULES §5). A transfer (F-019) is in blue without a sign, neither in nor out: `2 000 ₴`, and
 * an exchange both amounts with an arrow: `$100 → 4 490 ₴`.
 */
export function SignedAmount({
  transaction,
}: {
  transaction: Pick<Transaction, 'type' | 'amount' | 'currency' | 'toAmount' | 'toCurrency'>;
}) {
  const { t } = useTranslation();

  if (transaction.type === 'Transfer') {
    const exchange = isExchange(transaction) && transaction.toCurrency;
    return (
      <span className={cx(classes.amount, classes.transfer)}>
        {formatMoney(transaction.amount, transaction.currency)}
        {exchange && (
          <>
            <IconArrowRight
              size={16}
              stroke={1.7}
              className={classes.arrow}
              aria-label={t('transactions.list.into')}
            />
            {formatMoney(transaction.toAmount ?? 0, exchange)}
          </>
        )}
      </span>
    );
  }

  return (
    <span
      className={cx(
        classes.amount,
        transaction.type === 'Expense' ? classes.expense : classes.income,
      )}
    >
      {SIGN[transaction.type]}
      {formatMoney(transaction.amount, transaction.currency)}
    </span>
  );
}
