import { formatMoney } from '../../shared/format/money';
import { cx } from '../../shared/ui/cx';
import classes from './Transactions.module.css';
import type { Transaction } from './transactionsApi';

/** A true minus or plus in front of the amount. */
const SIGN = { Expense: '−', Income: '+' } as const;

/**
 * An amount in a list or a question: red with a minus for an expense, green with a plus for an income. Color is never
 * the only signal (DESIGN_RULES §5).
 */
export function SignedAmount({
  transaction,
}: {
  transaction: Pick<Transaction, 'type' | 'amount' | 'currency'>;
}) {
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
