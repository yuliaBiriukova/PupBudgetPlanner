import { UnstyledButton, VisuallyHidden } from '@mantine/core';
import { IconSelector, IconWallet } from '@tabler/icons-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatMoney } from '../../shared/format/money';
import { cx } from '../../shared/ui/cx';
import type { Account } from '../accounts/accountsApi';
import { byLastUse } from './formDefaults';
import { Picker } from './Picker';
import { KEEP_FORM_OPEN } from './transactionForm';
import classes from './TransactionForm.module.css';

interface AccountFieldProps {
  /** The picked account; an archived one when a transaction on it is changed. */
  value: Account;
  /** The accounts in use, oldest first, as the Accounts page lists them; the list shows the one used last first. */
  accounts: Account[];
  onChange: (accountId: string) => void;
}

/**
 * The account (F-018 final prototype): a field with the account, its bank or cash, and its balance now. It opens the
 * accounts as the app's dropdowns do (the currency list): under the field, as wide as it, one line per account with
 * its balance, the picked one in the accent; a sheet on the phone.
 */
export function AccountField({ value, accounts, onChange }: AccountFieldProps) {
  const { t } = useTranslation();
  const sourceOf = useSourceOf();
  const [open, setOpen] = useState(false);

  return (
    <div className={classes.block}>
      <div className={classes.blockHead}>
        <span className={classes.label}>{t('transactions.form.account')}</span>
      </div>
      <Picker
        opened={open}
        onClose={() => {
          setOpen(false);
        }}
        title={t('transactions.form.account')}
        // As tall as its rows up to 344 px, like the currency list (owner, 2026-10-31)
        listHeight={ACCOUNT_LIST_HEIGHT}
        target={
          <UnstyledButton
            className={classes.field}
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => {
              setOpen(!open);
            }}
          >
            <IconWallet size={20} stroke={1.7} aria-hidden />
            <VisuallyHidden>{t('transactions.form.accountLabel')}</VisuallyHidden>
            <span className={classes.fieldValue}>
              <span>{value.name}</span>
              <small>{sourceOf(value)}</small>
            </span>
            <span className={classes.balance}>{formatMoney(value.balance, value.currency)}</span>
            <IconSelector size={20} stroke={1.7} aria-hidden />
          </UnstyledButton>
        }
      >
        <AccountList
          accounts={accounts}
          value={value.id}
          onPick={(accountId) => {
            onChange(accountId);
            setOpen(false);
          }}
        />
      </Picker>
    </div>
  );
}

/** Where an account is: its bank, Cash, or the person's own source. */
function useSourceOf() {
  const { t } = useTranslation();
  return (account: Account) =>
    account.source === 'Cash'
      ? t('accounts.cash')
      : account.source === 'Bank'
        ? (account.bankName ?? '')
        : (account.sourceName ?? '');
}

/** The account lists' height on the desktop: as tall as their rows up to 344 px (owner, 2026-10-31). */
export const ACCOUNT_LIST_HEIGHT = 344;

interface AccountListProps {
  accounts: Account[];
  /** The picked one, in the accent; it takes the focus. */
  value?: string;
  onPick: (accountId: string) => void;
}

/**
 * The accounts as the pickers list them (I-024 final prototype): the account used last first; each row is the name
 * and then its bank or cash as one line that wraps when it doesn't fit, and on the right its balance now with the
 * currency's code, so accounts of one name in several currencies are told apart.
 */
export function AccountList({ accounts, value, onPick }: AccountListProps) {
  const { t } = useTranslation();
  const sourceOf = useSourceOf();
  const picked = accounts.some((item) => item.id === value);
  return (
    <ul className={classes.list} aria-label={t('transactions.form.accounts')}>
      {byLastUse(accounts).map((account, i) => (
        <li key={account.id}>
          <UnstyledButton
            className={cx(classes.listItem, classes.accountItem)}
            aria-pressed={account.id === value}
            // The picked one takes the focus, or the first when none of them is picked
            data-autofocus={account.id === value || (i === 0 && !picked) ? true : undefined}
            onClick={() => {
              onPick(account.id);
            }}
            {...KEEP_FORM_OPEN}
          >
            <span className={classes.accountName}>
              {account.name} <span className={classes.accountSource}>{sourceOf(account)}</span>
            </span>
            <span className={classes.accountMoney}>
              <span className={classes.balance}>
                {formatMoney(account.balance, account.currency)}
              </span>
              <span className={classes.accountCode}>{account.currency}</span>
            </span>
          </UnstyledButton>
        </li>
      ))}
    </ul>
  );
}
