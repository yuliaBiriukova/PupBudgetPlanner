import { notifications } from '@mantine/notifications';
import { IconCheck } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { Fragment, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { CountUp } from '../../shared/ui/CountUp';
import { accountsQuery, type AccountsOverview } from '../accounts/accountsApi';
import { TransactionDialog, type FormRequest } from './TransactionDialog';
import {
  TransactionFormContext,
  type LastChange,
  type TransactionFormApi,
} from './transactionForm';
import classes from './Transactions.module.css';
import { isExchange, type BalanceChange, type Transaction } from './transactionsApi';

/**
 * Holds the quick-add form (F-018) for the whole app shell: the + in the sidebar and the tab bar, the + on an account's
 * card and a row of the Transactions page open it. After a save or a delete the notification counts the account's
 * balance to its new value (both of a transfer, F-019): the one moment of the form.
 */
export function TransactionFormProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState<{ request: FormRequest; opened: boolean; key: number }>();
  const [lastChange, setLastChange] = useState<LastChange>();

  const api = useMemo<TransactionFormApi>(() => {
    const open = (request: FormRequest) => {
      setDialog((current) => ({ request, opened: true, key: (current?.key ?? 0) + 1 }));
    };
    return {
      add: (options) => {
        open({ kind: 'add', accountId: options?.accountId });
      },
      edit: (transaction) => {
        open({ kind: 'edit', transaction });
      },
      lastChange,
    };
  }, [lastChange]);

  const close = () => {
    setDialog((current) => current && { ...current, opened: false });
  };

  /**
   * The notification with the balance counting from before to after; the account named as the page has it. A transfer
   * (F-019) counts both: the accounts on a second line.
   */
  const notify = (
    text: string,
    balances: BalanceChange[],
    transaction: Transaction,
    transactionId?: string,
  ) => {
    const overview = queryClient.getQueryData<AccountsOverview>(accountsQuery.queryKey);
    const accounts = [...(overview?.accounts ?? []), ...(overview?.archived ?? [])];
    // A transfer's From and To; otherwise the account it is on now (the last balance, F-018)
    const shown =
      transaction.type === 'Transfer' && transaction.toAccountId
        ? [transaction.accountId, transaction.toAccountId].flatMap(
            (id) => balances.find((change) => change.accountId === id) ?? [],
          )
        : balances.slice(-1);
    const counts = shown.map((change) => {
      const account = accounts.find((item) => item.id === change.accountId);
      return {
        key: change.accountId,
        name:
          account?.name ??
          (change.accountId === transaction.toAccountId
            ? (transaction.toAccountName ?? '')
            : transaction.accountName),
        count: (
          <CountUp
            value={change.after}
            from={change.before}
            currency={account?.currency ?? 'UAH'}
          />
        ),
      };
    });
    const [only] = counts;
    let message: ReactNode = text;
    if (counts.length > 1)
      message = (
        <span className={classes.lines}>
          <span>{t('transactions.saved.what', { what: text })}</span>
          <span>
            {counts.map((item, i) => (
              <Fragment key={item.key}>
                {i > 0 && ', '}
                {item.name} {item.count}
              </Fragment>
            ))}
          </span>
        </span>
      );
    else if (only)
      message = (
        <>
          {t('transactions.saved.balance', { what: text, account: only.name })} {only.count}
        </>
      );
    notifications.show({ icon: <IconCheck size={16} stroke={1.7} />, message });
    setLastChange((current) => ({
      key: (current?.key ?? 0) + 1,
      transactionId,
      balances,
    }));
  };

  return (
    <TransactionFormContext.Provider value={api}>
      {children}
      {dialog && (
        <TransactionDialog
          key={dialog.key}
          request={dialog.request}
          opened={dialog.opened}
          onClose={close}
          onSaved={(saved, edited) => {
            close();
            notify(
              edited
                ? t('transactions.saved.changes')
                : t(
                    `transactions.saved.${isExchange(saved.transaction) ? 'Exchange' : saved.transaction.type}`,
                  ),
              saved.balances,
              saved.transaction,
              saved.transaction.id,
            );
          }}
          onDeleted={(transaction, balances) => {
            close();
            notify(t('transactions.saved.deleted'), balances, transaction);
          }}
        />
      )}
    </TransactionFormContext.Provider>
  );
}
