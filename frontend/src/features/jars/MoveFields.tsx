import { UnstyledButton, VisuallyHidden } from '@mantine/core';
import { IconPigMoney, IconSelector, IconWallet } from '@tabler/icons-react';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { Account } from '../accounts/accountsApi';
import { ACCOUNT_LIST_HEIGHT } from '../transactions/AccountField';
import { Picker } from '../transactions/Picker';
import form from '../transactions/TransactionForm.module.css';
import { KEEP_FORM_OPEN } from '../transactions/transactionForm';
import { cx } from '../../shared/ui/cx';
import type { Jar } from './jarsApi';
import classes from './Jars.module.css';

/** One account the money can come from or go back to, with what to show on its right. */
export interface AccountOption {
  account: Account;
  /** "784 ₴ free", "$900 in the jar"; red when the jars on it are short. */
  money: string;
  short?: boolean;
}

function useSourceOf() {
  const { t } = useTranslation();
  return (account: Account): string =>
    account.source === 'Cash'
      ? t('accounts.cash')
      : account.source === 'Bank'
        ? (account.bankName ?? '')
        : (account.sourceName ?? '');
}

/**
 * The quick-add form's account field (F-018, `AccountField`) for the jars (F-034): the same field and list, but each
 * account's right side says what is free on it (or how much of the jar lies on it) instead of its balance, and the list
 * keeps the given order (the most free money first).
 */
export function JarAccountField({
  label,
  value,
  options,
  onChange,
  inline = false,
}: {
  label: string;
  value: AccountOption;
  options: AccountOption[];
  onChange: (accountId: string) => void;
  /** The label before the field on the same line (the Budget's split, owner 2026-11-27), not above it. */
  inline?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const sourceOf = useSourceOf();
  return (
    <PickField
      label={label}
      inline={inline}
      open={open}
      setOpen={setOpen}
      icon={<IconWallet size={20} stroke={1.7} aria-hidden />}
      name={value.account.name}
      sub={sourceOf(value.account)}
      right={
        <span
          className={form.balance}
          style={value.short ? { color: 'var(--pup-color-expense)' } : undefined}
        >
          {value.money}
        </span>
      }
    >
      <ul className={form.list} aria-label={label}>
        {options.map((option) => (
          <li key={option.account.id}>
            <UnstyledButton
              className={cx(form.listItem, form.accountItem)}
              aria-pressed={option.account.id === value.account.id}
              data-autofocus={option.account.id === value.account.id ? true : undefined}
              onClick={() => {
                onChange(option.account.id);
                setOpen(false);
              }}
              {...KEEP_FORM_OPEN}
            >
              <span className={form.accountName}>
                {option.account.name}{' '}
                <span className={form.accountSource}>{sourceOf(option.account)}</span>
              </span>
              <span className={form.accountMoney}>
                <span className={form.balance}>{option.money}</span>
                <span className={form.accountCode}>{option.account.currency}</span>
              </span>
            </UnstyledButton>
          </li>
        ))}
      </ul>
    </PickField>
  );
}

/** The jar to move money into: the same field and list as the account's, each jar with what is saved in it. */
export function JarField({
  value,
  jars,
  savedOf,
  onChange,
}: {
  value: Jar;
  jars: Jar[];
  savedOf: (jar: Jar) => string;
  onChange: (jarId: string) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <PickField
      label={t('jars.move.into')}
      open={open}
      setOpen={setOpen}
      icon={<IconPigMoney size={20} stroke={1.7} aria-hidden />}
      name={value.name}
      right={<span className={form.balance}>{savedOf(value)}</span>}
    >
      <ul className={form.list} aria-label={t('jars.move.jarList')}>
        {jars.map((jar) => (
          <li key={jar.id}>
            <UnstyledButton
              className={cx(form.listItem, form.accountItem)}
              aria-pressed={jar.id === value.id}
              data-autofocus={jar.id === value.id ? true : undefined}
              onClick={() => {
                onChange(jar.id);
                setOpen(false);
              }}
              {...KEEP_FORM_OPEN}
            >
              <span className={form.accountName}>{jar.name}</span>
              <span className={form.accountMoney}>
                <span className={form.balance}>{savedOf(jar)}</span>
              </span>
            </UnstyledButton>
          </li>
        ))}
      </ul>
    </PickField>
  );
}

/** The field and its picker, as `AccountField` draws them. */
function PickField({
  label,
  open,
  setOpen,
  icon,
  name,
  sub,
  right,
  children,
  inline = false,
}: {
  label: string;
  inline?: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
  icon: ReactNode;
  name: string;
  sub?: string;
  right: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={inline ? classes.inlinePick : form.block}>
      {inline ? (
        <span className={cx(form.label, classes.inlineLabel)}>{label}</span>
      ) : (
        <div className={form.blockHead}>
          <span className={form.label}>{label}</span>
        </div>
      )}
      <Picker
        opened={open}
        onClose={() => {
          setOpen(false);
        }}
        title={label}
        listHeight={ACCOUNT_LIST_HEIGHT}
        target={
          <UnstyledButton
            className={form.field}
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => {
              setOpen(!open);
            }}
          >
            {icon}
            <VisuallyHidden>{label}:</VisuallyHidden>
            <span className={form.fieldValue}>
              <span>{name}</span>
              {sub && <small>{sub}</small>}
            </span>
            {right}
            <IconSelector size={20} stroke={1.7} aria-hidden />
          </UnstyledButton>
        }
      >
        {children}
      </Picker>
    </div>
  );
}
