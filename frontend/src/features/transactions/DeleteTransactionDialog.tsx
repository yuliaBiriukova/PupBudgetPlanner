import { Button } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { formatMoney } from '../../shared/format/money';
import { ResponsiveDialog } from '../../shared/ui/ResponsiveDialog';
import type { Account } from '../accounts/accountsApi';
import { longDay } from './days';
import { SignedAmount } from './SignedAmount';
import classes from './Transactions.module.css';
import {
  isExchange,
  useDeleteTransaction,
  type BalanceChange,
  type Transaction,
} from './transactionsApi';

interface DeleteTransactionDialogProps {
  transaction: Transaction;
  /** Its account, for the balance it goes back to; it may be archived. */
  account?: Account;
  /** A transfer's To account (F-019), for its balance too. */
  toAccount?: Account;
  opened: boolean;
  onKeep: () => void;
  onDeleted: (balances: BalanceChange[]) => void;
}

/** Delete asks first and says what happens to the balance (F-018 final prototype); both of a transfer (F-019). */
export function DeleteTransactionDialog({
  transaction,
  account,
  toAccount,
  opened,
  onKeep,
  onDeleted,
}: DeleteTransactionDialogProps) {
  const { t } = useTranslation();
  const remove = useDeleteTransaction();
  const word = isExchange(transaction) ? 'Exchange' : transaction.type;
  // An expense or a transfer gives its amount back to the account, an income takes it away; a transfer's To gives
  // back what it got
  const after =
    account &&
    account.balance + (transaction.type === 'Income' ? -transaction.amount : transaction.amount);
  const toAfter =
    transaction.type === 'Transfer' && toAccount
      ? toAccount.balance - (transaction.toAmount ?? transaction.amount)
      : undefined;

  let text: string | undefined;
  if (after !== undefined && toAfter !== undefined && toAccount)
    text = t('transactions.delete.afterBoth', {
      account: transaction.accountName,
      amount: formatMoney(after, transaction.currency),
      toAccount: transaction.toAccountName ?? toAccount.name,
      toAmount: formatMoney(toAfter, toAccount.currency),
    });
  else if (after !== undefined)
    text = t('transactions.delete.after', {
      account: transaction.accountName,
      amount: formatMoney(after, transaction.currency),
    });

  return (
    <ResponsiveDialog
      opened={opened}
      onClose={onKeep}
      title={t(`transactions.delete.title.${word}`)}
      size={400}
      footer={
        <>
          <Button variant="quiet" onClick={onKeep}>
            {t('transactions.delete.keep')}
          </Button>
          <Button
            variant="danger"
            loading={remove.isPending}
            onClick={() => {
              remove.mutate(
                { id: transaction.id },
                {
                  onSuccess: onDeleted,
                },
              );
            }}
          >
            {t('transactions.delete.confirm')}
          </Button>
        </>
      }
    >
      <div className={classes.what}>
        <span className={classes.whatAmount}>
          <SignedAmount transaction={transaction} />
        </span>
        <span>
          {transaction.type === 'Transfer'
            ? t('transactions.delete.route', {
                what: t(
                  isExchange(transaction)
                    ? 'transactions.list.Exchange'
                    : 'transactions.list.Transfer',
                ),
                account: transaction.accountName,
                toAccount: transaction.toAccountName,
              })
            : t('transactions.delete.where', {
                category: transaction.categoryName,
                account: transaction.accountName,
              })}
        </span>
        <span className={classes.dim}>{longDay(transaction.date)}</span>
      </div>
      {text && <p className={classes.deleteText}>{text}</p>}
      {remove.isError && (
        <p className={classes.error} role="alert">
          {t('transactions.delete.error')}
        </p>
      )}
    </ResponsiveDialog>
  );
}
