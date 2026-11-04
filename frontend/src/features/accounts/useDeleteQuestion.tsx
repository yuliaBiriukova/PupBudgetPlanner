import { Button, TextInput } from '@mantine/core';
import { IconInfoCircle, IconTrash } from '@tabler/icons-react';
import { useState, type ReactNode } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { formatMoney } from '../../shared/format/money';
import classes from './Accounts.module.css';
import { useDeleteAccount, type Account } from './accountsApi';

interface DeleteQuestionOptions {
  /** "Keep it": back to where the question came from. */
  onKeep: () => void;
  /** After the API deleted it. */
  onDeleted: (account: Account) => void;
}

/** The account's name, typed to confirm: any case, spaces around it don't count. */
export const nameMatches = (typed: string, name: string) =>
  typed.trim().toLocaleLowerCase() === name.trim().toLocaleLowerCase();

/**
 * Delete an account for good (I-011, final prototype): names it, says it can't be undone and how much money is still
 * on it, and works once its name is typed. Returns the dialog's title, buttons and content, so the edit form can
 * turn its own dialog into the question (nothing closes and opens in between).
 */
export function useDeleteQuestion(
  account: Account | undefined,
  { onKeep, onDeleted }: DeleteQuestionOptions,
): { title: string; footer: ReactNode; children: ReactNode; keep: () => void } {
  const { t } = useTranslation();
  const remove = useDeleteAccount();
  const [typed, setTyped] = useState('');
  const name = account?.name ?? '';
  const ready = account !== undefined && nameMatches(typed, name);

  const keep = () => {
    setTyped('');
    onKeep();
  };
  const confirm = () => {
    if (!account || !ready || remove.isPending) return;
    remove.mutate(
      { id: account.id },
      {
        onSuccess: () => {
          setTyped('');
          onDeleted(account);
        },
      },
    );
  };

  return {
    keep,
    title: t('accounts.delete.title', { name }),
    footer: (
      <>
        <Button variant="quiet" onClick={keep}>
          {t('accounts.delete.keep')}
        </Button>
        <Button
          variant="danger"
          disabled={!ready}
          loading={remove.isPending}
          leftSection={<IconTrash size={20} stroke={1.7} />}
          onClick={confirm}
        >
          {t('accounts.delete.confirm')}
        </Button>
      </>
    ),
    children: account && (
      <form
        className={classes.deleteQuestion}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          confirm();
        }}
      >
        <p className={classes.dialogText}>{t('accounts.delete.text')}</p>
        {account.balance !== 0 && (
          <div className={classes.infoBanner}>
            <IconInfoCircle size={20} stroke={1.7} aria-hidden />
            <p>
              {t('accounts.delete.stillHas', {
                amount: formatMoney(account.balance, account.currency),
                currency: account.currency,
              })}
            </p>
          </div>
        )}
        <TextInput
          label={
            <Trans
              i18nKey="accounts.delete.type"
              values={{ name }}
              components={{ b: <b className={classes.confirmName} /> }}
            />
          }
          value={typed}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          // The edit form turns into the question without opening a dialog, so Mantine's autofocus doesn't run
          autoFocus
          onChange={(event) => {
            setTyped(event.currentTarget.value);
          }}
          classNames={{ label: classes.label, input: classes.input }}
        />
        {remove.isError && (
          <p className={classes.formError} role="alert">
            {t('accounts.errors.save')}
          </p>
        )}
      </form>
    ),
  };
}
