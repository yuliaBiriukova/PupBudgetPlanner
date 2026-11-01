import { Button } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { formatMoney } from '../../shared/format/money';
import { ResponsiveDialog } from '../../shared/ui/ResponsiveDialog';
import type { Account } from '../accounts/accountsApi';
import { longDay } from './days';
import { SignedAmount } from './SignedAmount';
import classes from './Transactions.module.css';
import { useDeleteTransaction, type BalanceChange, type Transaction } from './transactionsApi';

interface DeleteTransactionDialogProps {
  transaction: Transaction;
  /** Its account, for the balance it goes back to; it may be archived. */
  account?: Account;
  opened: boolean;
  onKeep: () => void;
  onDeleted: (balances: BalanceChange[]) => void;
}

/** Delete asks first and says what happens to the balance (F-018 final prototype). */
export function DeleteTransactionDialog({
  transaction,
  account,
  opened,
  onKeep,
  onDeleted,
}: DeleteTransactionDialogProps) {
  const { t } = useTranslation();
  const remove = useDeleteTransaction();
  // An expense gives its amount back to the account, an income takes it away
  const after =
    account &&
    account.balance + (transaction.type === 'Expense' ? transaction.amount : -transaction.amount);

  return (
    <ResponsiveDialog
      opened={opened}
      onClose={onKeep}
      title={t(`transactions.delete.title.${transaction.type}`)}
      size={400}
      footer={
        <>
          <Button variant="default" radius="xl" onClick={onKeep}>
            {t('transactions.delete.keep')}
          </Button>
          <Button
            radius="xl"
            color="var(--pup-color-danger)"
            className={classes.danger}
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
          {t('transactions.delete.where', {
            category: transaction.categoryName,
            account: transaction.accountName,
          })}
        </span>
        <span className={classes.dim}>{longDay(transaction.date)}</span>
      </div>
      {after !== undefined && (
        <p className={classes.deleteText}>
          {t('transactions.delete.after', {
            account: transaction.accountName,
            amount: formatMoney(after, transaction.currency),
          })}
        </p>
      )}
      {remove.isError && (
        <p className={classes.error} role="alert">
          {t('transactions.delete.error')}
        </p>
      )}
    </ResponsiveDialog>
  );
}
