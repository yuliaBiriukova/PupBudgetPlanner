import {
  ActionIcon,
  Button,
  SegmentedControl,
  Skeleton,
  TextInput,
  UnstyledButton,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconAlertCircle, IconRefresh, IconTrash } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useId, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { DESKTOP_QUERY } from '../../app/shell/sections';
import { ResponsiveDialog } from '../../shared/ui/ResponsiveDialog';
import { accountsQuery, type AccountsOverview } from '../accounts/accountsApi';
import { categoriesQuery, type CategoriesOverview } from '../categories/categoriesApi';
import { AccountField } from './AccountField';
import { evaluate, isSum, pressKey } from './amount';
import { AmountDisplay } from './AmountDisplay';
import { AmountKeys } from './AmountKeys';
import { CategoryField } from './CategoryField';
import { mondayOf, today } from './days';
import { DeleteTransactionDialog } from './DeleteTransactionDialog';
import {
  categoriesFor,
  defaultAccount,
  lastCategory,
  mostUsed,
  pills,
  PILLS_DESKTOP,
  PILLS_PHONE,
  type CategoryOption,
} from './formDefaults';
import classes from './TransactionForm.module.css';
import {
  suggestionsQuery,
  useSaveTransaction,
  type BalanceChange,
  type SavedTransaction,
  type Transaction,
  type TransactionSuggestions,
  type TransactionType,
} from './transactionsApi';
import { WeekStrip } from './WeekStrip';

/** What the form opens for: a new transaction (from an account's card, with that account), or a change. */
export type FormRequest =
  { kind: 'add'; accountId?: string } | { kind: 'edit'; transaction: Transaction };

const TYPES: readonly TransactionType[] = ['Expense', 'Income'];

/** The longest note the API keeps (`Transaction.NoteMaxLength`). */
const NOTE_MAX_LENGTH = 200;

interface FormState {
  type: TransactionType;
  /** `YYYY-MM-DD`; today unless picked. */
  date: string;
  /** The Monday of the week the strip shows. */
  week: string;
  accountId: string;
  categoryId: string | null;
  /** Picked by the person: it stays when the account changes. One picked for them follows the account. */
  categoryByHand: boolean;
  /** The amount field: an amount or a sum (`amount.ts`). */
  amount: string;
  note: string;
}

interface FormErrors {
  amount?: string;
  category?: string;
}

interface FormData {
  overview: AccountsOverview;
  categories: CategoriesOverview;
  suggestions: TransactionSuggestions;
}

interface TransactionDialogProps {
  request: FormRequest;
  opened: boolean;
  onClose: () => void;
  /** After the API saved it: the notification and the pages light up what changed. */
  onSaved: (saved: SavedTransaction, edited: boolean) => void;
  /** After the API deleted it. */
  onDeleted: (transaction: Transaction, balances: BalanceChange[]) => void;
}

/**
 * Quick add (F-018, final prototype variant 7): one form for an expense or an income, and for changing one. In order
 * the day, the account, the amount, the category and the note. On the phone a full sheet with the app's own keys under
 * the scrolling form; on the desktop a dialog where the amount is typed, with Cancel and Save.
 */
export function TransactionDialog({
  request,
  opened,
  onClose,
  onSaved,
  onDeleted,
}: TransactionDialogProps) {
  const accounts = useQuery({ ...accountsQuery, enabled: opened });
  const categories = useQuery({ ...categoriesQuery, enabled: opened });
  const suggestions = useQuery({ ...suggestionsQuery, enabled: opened });
  const [deleting, setDeleting] = useState(false);
  const editing = request.kind === 'edit' ? request.transaction : undefined;

  const data: FormData | undefined =
    accounts.data && categories.data && suggestions.data
      ? { overview: accounts.data, categories: categories.data, suggestions: suggestions.data }
      : undefined;

  return (
    <>
      <TransactionForm
        request={request}
        data={data}
        failed={accounts.isError || categories.isError || suggestions.isError}
        onRetry={() => {
          void accounts.refetch();
          void categories.refetch();
          void suggestions.refetch();
        }}
        opened={opened && !deleting}
        onClose={onClose}
        onSaved={onSaved}
        onDelete={() => {
          setDeleting(true);
        }}
      />
      {editing && data && (
        <DeleteTransactionDialog
          transaction={editing}
          account={[...data.overview.accounts, ...data.overview.archived].find(
            (account) => account.id === editing.accountId,
          )}
          opened={opened && deleting}
          onKeep={() => {
            setDeleting(false);
          }}
          onDeleted={(balances) => {
            onDeleted(editing, balances);
          }}
        />
      )}
    </>
  );
}

/** The form's first values: the day, the account and the category picked for the person, or the transaction's. */
function initialState(request: FormRequest, data: FormData): FormState {
  if (request.kind === 'edit') {
    const { transaction } = request;
    return {
      type: transaction.type,
      date: transaction.date,
      week: mondayOf(transaction.date),
      accountId: transaction.accountId,
      categoryId: transaction.categoryId,
      categoryByHand: true,
      amount: String(transaction.amount),
      note: transaction.note ?? '',
    };
  }
  const type: TransactionType = 'Expense';
  const accountId = accountFor(request, data, type);
  const now = today();
  return {
    type,
    date: now,
    week: mondayOf(now),
    accountId,
    categoryId: lastCategory(
      data.suggestions,
      categoriesFor(data.categories.groups, type),
      accountId,
      type,
    ),
    categoryByHand: false,
    amount: '',
    note: '',
  };
}

/** The account a card's + opened the form with stays for both types; otherwise the last one used for the type. */
function accountFor(request: FormRequest, data: FormData, type: TransactionType): string {
  const fixed = request.kind === 'add' ? request.accountId : undefined;
  return (
    data.overview.accounts.find((account) => account.id === fixed)?.id ??
    defaultAccount(data.overview.accounts, data.suggestions, type) ??
    ''
  );
}

interface TransactionFormProps {
  request: FormRequest;
  /** Empty while the accounts, categories and suggestions load. */
  data?: FormData;
  failed: boolean;
  onRetry: () => void;
  opened: boolean;
  onClose: () => void;
  onSaved: (saved: SavedTransaction, edited: boolean) => void;
  onDelete: () => void;
}

/** One dialog from loading to saving, so nothing closes and opens again when the data arrives. */
function TransactionForm({
  request,
  data,
  failed,
  onRetry,
  opened,
  onClose,
  onSaved,
  onDelete,
}: TransactionFormProps) {
  const { t } = useTranslation();
  const noteId = useId();
  const isDesktop = useMediaQuery(DESKTOP_QUERY, false, { getInitialValueInEffect: false });
  const editing = request.kind === 'edit' ? request.transaction : undefined;
  const usable = data && (editing || data.overview.accounts.length > 0) ? data : undefined;
  const [form, setForm] = useState(() => usable && initialState(request, usable));
  const [errors, setErrors] = useState<FormErrors>({});
  const save = useSaveTransaction();

  // The data arrived after the dialog opened: the form starts now
  if (!form && usable) setForm(initialState(request, usable));

  const type = form?.type ?? editing?.type ?? 'Expense';
  const title = editing ? t(`transactions.edit.${type}`) : t(`transactions.add.${type}`);

  if (!form || !usable) {
    let body: ReactNode;
    if (data && !usable) {
      body = (
        <div className={classes.empty}>
          <p>{t('transactions.form.noAccounts')}</p>
          <Button component={Link} to="/accounts" radius="xl" onClick={onClose}>
            {t('transactions.form.goToAccounts')}
          </Button>
        </div>
      );
    } else if (failed) {
      body = (
        <div className={classes.banner} role="alert">
          <IconAlertCircle size={20} stroke={1.7} aria-hidden />
          <div>
            <p>{t('transactions.form.loadError')}</p>
            <UnstyledButton
              className={classes.textLink}
              style={{ color: 'inherit' }}
              onClick={onRetry}
            >
              <IconRefresh size={20} stroke={1.7} aria-hidden />
              {t('transactions.form.retry')}
            </UnstyledButton>
          </div>
        </div>
      );
    } else {
      body = (
        <div
          className={classes.loading}
          role="status"
          aria-busy="true"
          aria-label={t('transactions.form.loading')}
        >
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={80} radius="md" />
          ))}
        </div>
      );
    }
    return (
      <ResponsiveDialog opened={opened} onClose={onClose} title={title} size={520} full>
        {body}
      </ResponsiveDialog>
    );
  }

  const allAccounts = [...usable.overview.accounts, ...usable.overview.archived];
  const account = allAccounts.find((item) => item.id === form.accountId);
  const all = categoriesFor(usable.categories.groups, form.type);
  // A transaction changed keeps its category even when it is archived: the pill is named from the transaction
  const picked: CategoryOption | undefined =
    all.find((category) => category.id === form.categoryId) ??
    (editing?.categoryId === form.categoryId
      ? { id: editing.categoryId, name: editing.categoryName, group: '' }
      : undefined);
  const shown = pills(
    all,
    usable.suggestions,
    form.type,
    isDesktop ? PILLS_DESKTOP : PILLS_PHONE,
    picked,
  );

  const change = (next: Partial<FormState>) => {
    setForm({ ...form, ...next });
    save.reset();
  };

  const setType = (next: TransactionType) => {
    if (next === form.type) return;
    const accountId = accountFor(request, usable, next);
    // The amount, the day and the note stay; the category is of the other kind
    change({
      type: next,
      accountId,
      categoryId: lastCategory(
        usable.suggestions,
        categoriesFor(usable.categories.groups, next),
        accountId,
        next,
      ),
      categoryByHand: false,
    });
    setErrors({ ...errors, category: undefined });
  };

  const setAccount = (accountId: string) => {
    // A category picked for the person follows the account; one they picked stays (owner, 2026-11-01)
    change(
      form.categoryByHand
        ? { accountId }
        : { accountId, categoryId: lastCategory(usable.suggestions, all, accountId, form.type) },
    );
  };

  const setAmount = (amount: string) => {
    change({ amount });
    setErrors({ ...errors, amount: undefined });
  };

  const submit = () => {
    const amount = evaluate(form.amount);
    const next: FormErrors = {};
    if (!form.amount) next.amount = t('transactions.errors.amount');
    else if (amount === null || amount <= 0)
      next.amount = t(
        isSum(form.amount) ? 'transactions.errors.sumZero' : 'transactions.errors.amountZero',
      );
    if (!form.categoryId) next.category = t('transactions.errors.category');
    setErrors(next);
    if (next.amount || next.category || amount === null || !form.categoryId) return;

    // Save works a sum out on the way, as = does
    if (isSum(form.amount)) setForm({ ...form, amount: String(amount) });
    save.mutate(
      {
        id: editing?.id,
        body: {
          type: form.type,
          date: form.date,
          accountId: form.accountId,
          categoryId: form.categoryId,
          amount,
          note: form.note.trim() || null,
        },
      },
      {
        onSuccess: (saved) => {
          onSaved(saved, editing !== undefined);
        },
      },
    );
  };

  const heading = editing ? undefined : (
    <SegmentedControl
      aria-label={t('transactions.form.type')}
      value={form.type}
      onChange={(value) => {
        setType(value === 'Income' ? 'Income' : 'Expense');
      }}
      data={TYPES.map((item) => ({ value: item, label: t(`transactions.types.${item}`) }))}
      fullWidth
      radius="xl"
      withItemsBorders={false}
      data-type={form.type}
      classNames={{
        root: classes.switch,
        indicator: classes.switchIndicator,
        label: classes.switchLabel,
      }}
    />
  );

  const actions = editing && (
    <ActionIcon
      variant="subtle"
      color="gray"
      size={44}
      radius="xl"
      aria-label={t(`transactions.form.deleteLabel.${type}`)}
      onClick={onDelete}
    >
      <IconTrash size={20} stroke={1.7} />
    </ActionIcon>
  );

  const footer = isDesktop ? (
    <>
      {editing && (
        <Button
          variant="subtle"
          radius="xl"
          color="var(--mantine-color-error)"
          leftSection={<IconTrash size={16} stroke={1.7} />}
          onClick={onDelete}
        >
          {t('transactions.form.delete')}
        </Button>
      )}
      <span className={classes.spacer} />
      <Button variant="default" radius="xl" onClick={onClose}>
        {t('transactions.form.cancel')}
      </Button>
      <Button radius="xl" loading={save.isPending} onClick={submit}>
        {editing ? t('transactions.form.saveChanges') : t(`transactions.form.save${type}`)}
      </Button>
    </>
  ) : (
    <AmountKeys
      value={form.amount}
      saving={save.isPending}
      onKey={(key) => {
        setAmount(pressKey(form.amount, key));
      }}
      onSave={submit}
    />
  );

  return (
    <ResponsiveDialog
      opened={opened}
      onClose={onClose}
      title={title}
      heading={heading}
      actions={actions}
      footer={footer}
      size={520}
      full
    >
      <div className={classes.form}>
        {save.isError && (
          <p className={classes.banner} role="alert">
            <IconAlertCircle size={20} stroke={1.7} aria-hidden />
            {t('transactions.errors.save')}
          </p>
        )}
        <WeekStrip
          value={form.date}
          onChange={(date) => {
            change({ date });
          }}
          week={form.week}
          onWeekChange={(week) => {
            change({ week });
          }}
        />
        {account && (
          <AccountField value={account} accounts={usable.overview.accounts} onChange={setAccount} />
        )}
        <AmountDisplay
          value={form.amount}
          onChange={setAmount}
          type={form.type}
          currency={account?.currency ?? 'UAH'}
          withKeys={!isDesktop}
          error={errors.amount}
          onEnter={submit}
          focusFirst={isDesktop}
        />
        <CategoryField
          value={form.categoryId}
          onChange={(categoryId) => {
            change({ categoryId, categoryByHand: true });
            setErrors({ ...errors, category: undefined });
          }}
          pills={shown}
          all={all}
          often={mostUsed(all, usable.suggestions, form.type)}
          error={errors.category}
        />
        <div className={classes.block}>
          <div className={classes.blockHead}>
            <label className={classes.label} htmlFor={noteId}>
              {t('transactions.form.note')}
            </label>
          </div>
          <TextInput
            id={noteId}
            value={form.note}
            maxLength={NOTE_MAX_LENGTH}
            placeholder={t('transactions.form.notePlaceholder')}
            autoComplete="off"
            onChange={(event) => {
              change({ note: event.currentTarget.value });
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                submit();
              }
            }}
          />
        </div>
      </div>
    </ResponsiveDialog>
  );
}
