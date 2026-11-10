import { ActionIcon, Button, SegmentedControl, Skeleton, UnstyledButton } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconAlertCircle, IconRefresh, IconTrash } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { DESKTOP_QUERY } from '../../app/shell/sections';
import { usePopupHistory } from '../../shared/ui/popupHistory';
import { ResponsiveDialog } from '../../shared/ui/ResponsiveDialog';
import { accountsQuery, type Account, type AccountsOverview } from '../accounts/accountsApi';
import { categoriesQuery, type CategoriesOverview } from '../categories/categoriesApi';
import { AccountField } from './AccountField';
import { evaluate, isSum, pressKey } from './amount';
import { AmountDisplay } from './AmountDisplay';
import { AmountKeys } from './AmountKeys';
import { CategoryField } from './CategoryField';
import { mondayOf, today } from './days';
import { DeleteTransactionDialog } from './DeleteTransactionDialog';
import { NoteField } from './NoteField';
import { suggestedToAmount } from './exchange';
import {
  categoriesFor,
  defaultAccount,
  defaultTo,
  lastCategory,
  mostUsed,
  pills,
  PILLS_DESKTOP,
  PILLS_PHONE,
  type CategoryOption,
} from './formDefaults';
import { RateLine } from './RateLine';
import { scrollParentOf } from './scrollParent';
import classes from './TransactionForm.module.css';
import {
  isExchange,
  ratesQuery,
  suggestionsQuery,
  useSaveTransaction,
  type BalanceChange,
  type SavedTransaction,
  type Transaction,
  type TransactionSuggestions,
  type TransactionType,
} from './transactionsApi';
import { TransferAccounts } from './TransferAccounts';
import { useKeysSwipe } from './useKeysSwipe';
import { WeekStrip } from './WeekStrip';

/**
 * What the form opens for: a new transaction (from an account's card, with that account; on the day the Transactions
 * page shows, I-025; on the type picked with the phone's +, I-030), or a change.
 */
export type FormRequest =
  | { kind: 'add'; accountId?: string; date?: string; type?: TransactionType }
  | { kind: 'edit'; transaction: Transaction };

const TYPES: readonly TransactionType[] = ['Expense', 'Income', 'Transfer'];

/** On the phone the Note field scrolls up to this far under the sheet's title while the note is typed (I-017). */
const NOTE_TOP_GAP = 16;

interface FormState {
  type: TransactionType;
  /** `YYYY-MM-DD`; today unless picked. */
  date: string;
  /** The Monday of the week the strip shows. */
  week: string;
  /** The account; a transfer's From. */
  accountId: string;
  categoryId: string | null;
  /** Picked by the person: it stays when the account changes. One picked for them follows the account. */
  categoryByHand: boolean;
  /** The amount field: an amount or a sum (`amount.ts`). */
  amount: string;
  /** A transfer's To (F-019); none when there is no other account. */
  toAccountId: string | null;
  /** What an exchange's To got, as typed; the NBU's suggestion stands until `toByHand`. */
  toAmount: string;
  toByHand: boolean;
  /** On the phone, the display of an exchange the keys type into. */
  keys: 'amount' | 'to';
  note: string;
}

interface FormErrors {
  amount?: string;
  category?: string;
  to?: string;
  toAmount?: string;
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
 * Quick add (F-018, final prototype variant 7): one form for an expense, an income or a transfer (F-019), and for
 * changing one. In order the day, the account (From and To for a transfer), the amount (two for an exchange), the
 * category and the note. On the phone a full sheet with the app's own keys under the scrolling form, folded until the
 * amount is tapped (I-028); on the desktop a dialog where the amount is typed, with Cancel and Save.
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
  const allAccounts = data ? [...data.overview.accounts, ...data.overview.archived] : [];

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
          account={allAccounts.find((account) => account.id === editing.accountId)}
          toAccount={allAccounts.find((account) => account.id === editing.toAccountId)}
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
      toAccountId: transaction.toAccountId ?? null,
      // An exchange keeps what the bank gave; one currency's To is the amount itself
      toAmount: isExchange(transaction) ? String(transaction.toAmount ?? '') : '',
      toByHand: isExchange(transaction),
      keys: 'amount',
      note: transaction.note ?? '',
    };
  }
  const type = request.type ?? 'Expense';
  const accountId = accountFor(request, data, type);
  const date = request.date ?? today();
  const transfer = type === 'Transfer';
  return {
    type,
    date,
    week: mondayOf(date),
    accountId,
    // As switching to the type in the form picks them (`setType`)
    categoryId: transfer
      ? null
      : lastCategory(
          data.suggestions,
          categoriesFor(data.categories.groups, type),
          accountId,
          type,
        ),
    categoryByHand: false,
    amount: '',
    toAccountId: transfer ? defaultTo(data.overview.accounts, data.suggestions, accountId) : null,
    toAmount: '',
    toByHand: false,
    keys: 'amount',
    note: '',
  };
}

/** The account a card's + opened the form with stays for every type; otherwise the last one used for the type. */
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
  // On the phone, while the note is typed the phone's keyboard is up (I-017)
  const [typingNote, setTypingNote] = useState(false);
  const noteTyped = typingNote && !isDesktop;
  // The earlier notes listed under it: only then the form makes them room (B-009)
  const [noteListed, setNoteListed] = useState(false);
  const roomForList = noteTyped && noteListed;
  const noteBlock = useRef<HTMLDivElement>(null);
  const noteRoom = useRef<HTMLDivElement>(null);

  // The app's keys on the phone start folded and come up on a tap on the amount; Back (a history step of their own over
  // the sheet's), a swipe down on them and a tap on the Note fold them, and nothing typed is lost (I-028)
  const [keysUp, setKeysUp] = useState(false);
  const keysShown = keysUp && !isDesktop;
  const showKeys = () => {
    setTypingNote(false);
    setKeysUp(true);
  };
  const keysFolded = () => {
    setKeysUp(false);
    // The caret leaves the amount with them: nothing types into it now
    const active = document.activeElement;
    if (active instanceof HTMLInputElement && active.getAttribute('inputmode') === 'none')
      active.blur();
  };
  const { setKeys, foldAway } = useKeysSwipe(keysFolded);
  usePopupHistory(opened && keysShown, () => {
    foldAway(keysFolded);
  });

  // While the earlier notes are listed, the form scrolls the Note field to its top, so the list under it has the room
  // down to Save: the room under the form is what the field needs to get there. With no list there is no room, only an
  // empty gap, so the form stays where it is and the field is just kept in sight (B-009). Both follow the sheet as the
  // phone's keyboard comes and goes
  useEffect(() => {
    const block = noteBlock.current;
    const room = roomForList ? noteRoom.current : null;
    const scroller = scrollParentOf(block);
    if (!noteTyped || !block || !scroller) return;
    let frame = 0;
    const fit = () => {
      if (room)
        room.style.height = `${String(Math.max(0, scroller.clientHeight - block.offsetHeight - NOTE_TOP_GAP))}px`;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const top = block.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
        const below = top + block.offsetHeight - scroller.clientHeight;
        if (room) scroller.scrollTop += top - NOTE_TOP_GAP;
        else if (top < 0) scroller.scrollTop += top - NOTE_TOP_GAP;
        else if (below > 0) scroller.scrollTop += below + NOTE_TOP_GAP;
      });
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(scroller);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [noteTyped, roomForList]);

  // The data arrived after the dialog opened: the form starts now
  if (!form && usable) setForm(initialState(request, usable));

  const allAccounts: Account[] = usable
    ? [...usable.overview.accounts, ...usable.overview.archived]
    : [];
  const account = allAccounts.find((item) => item.id === form?.accountId);
  const toAccount =
    form?.type === 'Transfer'
      ? allAccounts.find((item) => item.id === form.toAccountId)
      : undefined;
  const exchange = !!account && !!toAccount && account.currency !== toAccount.currency;
  // The NBU rates of the picked day, for an exchange's second amount
  const rates = useQuery({ ...ratesQuery(form?.date ?? today()), enabled: opened && exchange });

  // While the data loads, the title already names the type the form opens on (I-030)
  const type =
    form?.type ?? editing?.type ?? (request.kind === 'add' ? request.type : undefined) ?? 'Expense';
  const word = editing && (exchange || isExchange(editing)) ? 'Exchange' : type;
  const title = editing ? t(`transactions.edit.${word}`) : t(`transactions.add.${type}`);

  if (!form || !usable) {
    let body: ReactNode;
    if (data && !usable) {
      body = (
        <div className={classes.empty}>
          <p>{t('transactions.form.noAccounts')}</p>
          <Button component={Link} to="/accounts" onClick={onClose}>
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

  const transfer = form.type === 'Transfer';
  const all = categoriesFor(usable.categories.groups, form.type);
  // A transaction changed keeps its category even when it is archived: the pill is named from the transaction
  const picked: CategoryOption | undefined =
    all.find((category) => category.id === form.categoryId) ??
    (editing?.categoryId && editing.categoryName && editing.categoryId === form.categoryId
      ? { id: editing.categoryId, name: editing.categoryName, group: '' }
      : undefined);
  const shown = pills(
    all,
    usable.suggestions,
    form.type,
    isDesktop ? PILLS_DESKTOP : PILLS_PHONE,
    picked,
  );

  // An exchange's second amount: what the person typed, else the NBU's suggestion for the amount
  const suggested =
    exchange && rates.data
      ? suggestedToAmount(
          evaluate(form.amount),
          account.currency,
          toAccount.currency,
          rates.data.rates,
        )
      : null;
  const toText = form.toByHand ? form.toAmount : suggested === null ? '' : String(suggested);
  const keysOn = exchange && form.keys === 'to' ? 'to' : 'amount';
  const saveLabel = editing
    ? t('transactions.form.saveChanges')
    : t(`transactions.form.save${type}`);

  const change = (next: Partial<FormState>) => {
    setForm({ ...form, ...next });
    save.reset();
  };

  const setType = (next: TransactionType) => {
    if (next === form.type) return;
    const accountId = accountFor(request, usable, next);
    // The amount, the day and the note stay; the category is of the other kind, a transfer has none
    change({
      type: next,
      accountId,
      categoryId:
        next === 'Transfer'
          ? null
          : lastCategory(
              usable.suggestions,
              categoriesFor(usable.categories.groups, next),
              accountId,
              next,
            ),
      categoryByHand: false,
      toAccountId:
        next === 'Transfer'
          ? defaultTo(usable.overview.accounts, usable.suggestions, accountId)
          : null,
      toAmount: '',
      toByHand: false,
      keys: 'amount',
    });
    setErrors({ ...errors, category: undefined, to: undefined, toAmount: undefined });
  };

  const setAccount = (accountId: string) => {
    if (transfer) {
      // Picking the To account as From swaps the two; the To amount is suggested again for the new pair
      change({
        accountId,
        toAccountId: accountId === form.toAccountId ? form.accountId : form.toAccountId,
        toAmount: '',
        toByHand: false,
      });
      setErrors({ ...errors, toAmount: undefined });
      return;
    }
    // A category picked for the person follows the account; one they picked stays (owner, 2026-11-01)
    change(
      form.categoryByHand
        ? { accountId }
        : { accountId, categoryId: lastCategory(usable.suggestions, all, accountId, form.type) },
    );
  };

  const setTo = (toAccountId: string) => {
    change({ toAccountId, toAmount: '', toByHand: false });
    setErrors({ ...errors, to: undefined, toAmount: undefined });
  };

  // The amounts go with their accounts: 100 USD → 4 490 ₴ becomes 4 490 ₴ → 100 USD
  const swap = () => {
    if (!form.toAccountId) return;
    change({
      accountId: form.toAccountId,
      toAccountId: form.accountId,
      ...(exchange
        ? form.toByHand
          ? { amount: form.toAmount, toAmount: form.amount }
          : { amount: toText, toAmount: '' }
        : {}),
      keys: 'amount',
    });
    setErrors({});
  };

  const setAmount = (amount: string) => {
    change({ amount });
    setErrors({ ...errors, amount: undefined });
  };

  const setToAmount = (toAmount: string) => {
    change({ toAmount, toByHand: true });
    setErrors({ ...errors, toAmount: undefined });
  };

  const submit = () => {
    const amount = evaluate(form.amount);
    const typedTo = form.toByHand ? evaluate(form.toAmount) : suggested;
    const next: FormErrors = {};
    if (!form.amount) next.amount = t('transactions.errors.amount');
    else if (amount === null || amount <= 0)
      next.amount = t(
        isSum(form.amount) ? 'transactions.errors.sumZero' : 'transactions.errors.amountZero',
      );
    if (!transfer && !form.categoryId) next.category = t('transactions.errors.category');
    if (transfer && !toAccount) next.to = t('transactions.errors.to');
    if (exchange && (typedTo === null || typedTo <= 0))
      next.toAmount =
        form.toByHand && isSum(form.toAmount)
          ? t('transactions.errors.sumZero')
          : t('transactions.errors.toAmount', { account: toAccount.name });
    setErrors(next);
    if (next.amount || next.category || next.to || next.toAmount || amount === null) return;

    // Save works a sum out on the way, as = does
    if (isSum(form.amount) || (form.toByHand && isSum(form.toAmount)))
      setForm({
        ...form,
        amount: String(amount),
        toAmount: form.toByHand && typedTo !== null ? String(typedTo) : form.toAmount,
      });
    save.mutate(
      {
        id: editing?.id,
        body: {
          type: form.type,
          date: form.date,
          accountId: form.accountId,
          categoryId: transfer ? null : form.categoryId,
          amount,
          note: form.note.trim() || null,
          // Between accounts in one currency the API takes the amount itself as what To got
          ...(transfer && { toAccountId: form.toAccountId, toAmount: exchange ? typedTo : null }),
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
        setType(TYPES.find((item) => item === value) ?? 'Expense');
      }}
      data={TYPES.map((item) => ({ value: item, label: t(`transactions.types.${item}`) }))}
      fullWidth
      data-type={form.type}
      className={classes.typeSwitch}
    />
  );

  const actions = editing && (
    <ActionIcon
      variant="subtle"
      color="gray"
      aria-label={t(`transactions.form.deleteLabel.${word}`)}
      onClick={() => {
        // Kept, the transaction's form comes back with its keys folded
        setKeysUp(false);
        onDelete();
      }}
    >
      <IconTrash size={20} stroke={1.7} />
    </ActionIcon>
  );

  const footer = isDesktop ? (
    <>
      {editing && (
        <Button
          variant="danger-quiet"
          leftSection={<IconTrash size={20} stroke={1.7} />}
          onClick={onDelete}
        >
          {t('transactions.form.delete')}
        </Button>
      )}
      <span className={classes.spacer} />
      <Button variant="quiet" onClick={onClose}>
        {t('transactions.form.cancel')}
      </Button>
      <Button loading={save.isPending} onClick={submit}>
        {saveLabel}
      </Button>
    </>
  ) : keysShown ? (
    <AmountKeys
      value={keysOn === 'to' ? toText : form.amount}
      saving={save.isPending}
      onKey={(key) => {
        if (keysOn === 'to') {
          // The first key on a suggested amount replaces it
          setToAmount(pressKey(form.toByHand ? form.toAmount : '', key));
        } else setAmount(pressKey(form.amount, key));
      }}
      onSave={submit}
      keysRef={setKeys}
    />
  ) : (
    // The keys folded: Save alone (as while the note is typed, I-017)
    <Button className={classes.saveAlone} loading={save.isPending} onClick={submit}>
      {saveLabel}
    </Button>
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
        {account &&
          (transfer ? (
            <TransferAccounts
              from={account}
              to={toAccount}
              accounts={usable.overview.accounts}
              onFrom={setAccount}
              onTo={setTo}
              onSwap={swap}
              error={errors.to}
            />
          ) : (
            <AccountField
              value={account}
              accounts={usable.overview.accounts}
              onChange={setAccount}
            />
          ))}
        <AmountDisplay
          value={form.amount}
          onChange={setAmount}
          type={form.type}
          currency={account?.currency ?? 'UAH'}
          withKeys={!isDesktop}
          error={errors.amount}
          onEnter={submit}
          focusFirst={isDesktop}
          label={
            exchange ? t('transactions.form.fromAccount', { account: account.name }) : undefined
          }
          target={keysShown && exchange && keysOn === 'amount'}
          onTarget={() => {
            showKeys();
            if (form.keys !== 'amount') change({ keys: 'amount' });
          }}
        />
        {exchange && (
          <AmountDisplay
            value={toText}
            onChange={setToAmount}
            type={form.type}
            currency={toAccount.currency}
            withKeys={!isDesktop}
            error={errors.toAmount}
            onEnter={submit}
            label={t('transactions.form.toAccount', { account: toAccount.name })}
            secondary
            target={keysShown && keysOn === 'to'}
            onTarget={() => {
              showKeys();
              if (form.keys !== 'to') change({ keys: 'to' });
            }}
            selectOnFocus={!form.toByHand}
          >
            <RateLine
              from={account.currency}
              to={toAccount.currency}
              toName={toAccount.name}
              date={form.date}
              amount={evaluate(form.amount)}
              toAmount={form.toByHand ? evaluate(form.toAmount) : suggested}
              byHand={form.toByHand}
              rates={rates.data}
              loading={rates.isPending}
              onUseNbu={() => {
                change({ toAmount: '', toByHand: false });
                setErrors({ ...errors, toAmount: undefined });
              }}
            />
          </AmountDisplay>
        )}
        {!transfer && (
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
        )}
        <div className={classes.block} ref={noteBlock}>
          <div className={classes.blockHead}>
            <label className={classes.label} htmlFor={noteId}>
              {t('transactions.form.note')}
            </label>
          </div>
          <NoteField
            id={noteId}
            value={form.note}
            onChange={(note) => {
              change({ note });
            }}
            type={form.type}
            placeholder={t(
              transfer
                ? 'transactions.form.notePlaceholderTransfer'
                : 'transactions.form.notePlaceholder',
            )}
            onEnter={submit}
            onFocus={() => {
              setTypingNote(true);
              setKeysUp(false);
            }}
            onListed={setNoteListed}
            inSheet={!isDesktop}
          />
        </div>
      </div>
      {roomForList && <div ref={noteRoom} data-note-room aria-hidden="true" />}
    </ResponsiveDialog>
  );
}
