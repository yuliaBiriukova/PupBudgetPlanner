import { UnstyledButton, VisuallyHidden } from '@mantine/core';
import { IconSelector, IconWallet } from '@tabler/icons-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatMoney } from '../../shared/format/money';
import type { Account } from '../accounts/accountsApi';
import { Picker } from './Picker';
import { KEEP_FORM_OPEN } from './transactionForm';
import classes from './TransactionForm.module.css';

interface AccountFieldProps {
  /** The picked account; an archived one when a transaction on it is changed. */
  value: Account;
  /** The accounts in use, oldest first, as the Accounts page lists them. */
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
  const [open, setOpen] = useState(false);

  const sourceOf = (account: Account) =>
    account.source === 'Cash'
      ? t('accounts.cash')
      : account.source === 'Bank'
        ? (account.bankName ?? '')
        : (account.sourceName ?? '');

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
        listHeight={344}
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
        <ul className={classes.list} aria-label={t('transactions.form.accounts')}>
          {accounts.map((account) => (
            <li key={account.id}>
              <UnstyledButton
                className={classes.listItem}
                aria-pressed={account.id === value.id}
                onClick={() => {
                  onChange(account.id);
                  setOpen(false);
                }}
                {...KEEP_FORM_OPEN}
              >
                <span className={classes.listName}>{account.name}</span>
                <span className={classes.balance}>
                  {formatMoney(account.balance, account.currency)}
                </span>
              </UnstyledButton>
            </li>
          ))}
        </ul>
      </Picker>
    </div>
  );
}
