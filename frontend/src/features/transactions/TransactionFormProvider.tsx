import { notifications } from '@mantine/notifications';
import { IconCheck } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { CountUp } from '../../shared/ui/CountUp';
import { accountsQuery, type AccountsOverview } from '../accounts/accountsApi';
import { TransactionDialog, type FormRequest } from './TransactionDialog';
import {
  TransactionFormContext,
  type LastChange,
  type TransactionFormApi,
} from './transactionForm';
import type { BalanceChange } from './transactionsApi';

/**
 * Holds the quick-add form (F-018) for the whole app shell: the + in the sidebar and the tab bar, the + on an account's
 * card and a row of the Transactions page open it. After a save or a delete the notification counts the account's
 * balance to its new value: the one moment of the form.
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

  /** The notification with the balance counting from before to after; the account named as the page has it. */
  const notify = (
    text: string,
    balances: BalanceChange[],
    fallbackName: string,
    transactionId?: string,
  ) => {
    const overview = queryClient.getQueryData<AccountsOverview>(accountsQuery.queryKey);
    const change = balances[balances.length - 1];
    const account = [...(overview?.accounts ?? []), ...(overview?.archived ?? [])].find(
      (item) => item.id === change?.accountId,
    );
    notifications.show({
      icon: <IconCheck size={16} stroke={1.8} />,
      message: change ? (
        <>
          {t('transactions.saved.balance', { what: text, account: account?.name ?? fallbackName })}{' '}
          <CountUp
            value={change.after}
            from={change.before}
            currency={account?.currency ?? 'UAH'}
          />
        </>
      ) : (
        text
      ),
    });
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
                : t(`transactions.saved.${saved.transaction.type}`),
              saved.balances,
              saved.transaction.accountName,
              saved.transaction.id,
            );
          }}
          onDeleted={(transaction, balances) => {
            close();
            notify(t('transactions.saved.deleted'), balances, transaction.accountName);
          }}
        />
      )}
    </TransactionFormContext.Provider>
  );
}
