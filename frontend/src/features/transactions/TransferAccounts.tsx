import { ActionIcon, UnstyledButton } from '@mantine/core';
import { IconAlertCircle, IconArrowsLeftRight, IconSelector } from '@tabler/icons-react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatMoney } from '../../shared/format/money';
import type { Account } from '../accounts/accountsApi';
import { ACCOUNT_LIST_HEIGHT, AccountList } from './AccountField';
import { Picker } from './Picker';
import classes from './TransactionForm.module.css';

interface TransferAccountsProps {
  /** Where the money leaves; an archived one when a transfer from it is changed. */
  from: Account;
  /** Where it goes; none until picked (the person has no other account). */
  to?: Account;
  /** The accounts in use, oldest first; the lists show the one used last first (I-024). */
  accounts: Account[];
  onFrom: (accountId: string) => void;
  onTo: (accountId: string) => void;
  onSwap: () => void;
  /** Shown under the fields: no To picked. */
  error?: string;
}

/**
 * From and To (F-019 final prototype) where the account field is, side by side, with their balances now and a swap
 * button between them. Both open the same account list; the To list leaves out the From account.
 */
export function TransferAccounts({
  from,
  to,
  accounts,
  onFrom,
  onTo,
  onSwap,
  error,
}: TransferAccountsProps) {
  const { t } = useTranslation();
  const errorId = useId();
  const [open, setOpen] = useState<'from' | 'to'>();
  const others = accounts.filter((account) => account.id !== from.id);

  const side = (which: 'from' | 'to', account: Account | undefined) => (
    <Picker
      opened={open === which}
      onClose={() => {
        setOpen(undefined);
      }}
      title={t(`transactions.form.${which}`)}
      listHeight={ACCOUNT_LIST_HEIGHT}
      target={
        <UnstyledButton
          className={classes.route}
          aria-haspopup="dialog"
          aria-expanded={open === which}
          aria-invalid={which === 'to' && error ? true : undefined}
          aria-describedby={which === 'to' && error ? errorId : undefined}
          onClick={() => {
            setOpen(open === which ? undefined : which);
          }}
        >
          <small>{t(`transactions.form.${which}`)}</small>
          <span className={classes.routeName}>
            {account?.name ?? t('transactions.form.pickAccount')}
          </span>
          {account && (
            <span className={classes.balance}>
              {formatMoney(account.balance, account.currency)}
            </span>
          )}
          <IconSelector size={20} stroke={1.7} aria-hidden className={classes.routeSelect} />
        </UnstyledButton>
      }
    >
      {which === 'to' && others.length === 0 ? (
        <p className={classes.none}>{t('transactions.form.noOtherAccount')}</p>
      ) : (
        <AccountList
          accounts={which === 'from' ? accounts : others}
          value={account?.id}
          onPick={(accountId) => {
            if (which === 'from') onFrom(accountId);
            else onTo(accountId);
            setOpen(undefined);
          }}
        />
      )}
    </Picker>
  );

  return (
    <div className={classes.block}>
      <div className={classes.routeRow}>
        {side('from', from)}
        <ActionIcon
          variant="subtle"
          className={classes.swap}
          aria-label={t('transactions.form.swap')}
          disabled={!to}
          onClick={onSwap}
        >
          <IconArrowsLeftRight size={20} stroke={1.7} />
        </ActionIcon>
        {side('to', to)}
      </div>
      {error && (
        <p className={classes.inlineError} id={errorId}>
          <IconAlertCircle size={16} stroke={1.7} aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}
