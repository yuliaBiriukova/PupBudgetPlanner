import { Button, SegmentedControl, Skeleton, Title, UnstyledButton } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconAlertCircle,
  IconChevronDown,
  IconInfoCircle,
  IconPlus,
  IconRefresh,
  IconRestore,
  IconTrash,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../../shared/format/date';
import { formatMoney } from '../../shared/format/money';
import { useCurrencyTitle } from '../../shared/i18n/currencyNames';
import { cx } from '../../shared/ui/cx';
import { AccountCard, AddCard } from './AccountCard';
import { AccountDialog, type AccountDialogMode } from './AccountDialog';
import type { FormPreset } from './accountForm';
import {
  groupAccounts,
  readGroupBy,
  writeGroupBy,
  type AccountGroup,
  type GroupBy,
} from './accountGroups';
import classes from './Accounts.module.css';
import {
  AccountCopyError,
  accountsQuery,
  accountsTotalQuery,
  useArchiveAccount,
  type Account,
  type AccountsOverview,
  type AccountsTotal,
} from './accountsApi';
import { CountUp } from '../../shared/ui/CountUp';
import { useTransactionForm, type LastChange } from '../transactions/transactionForm';
import { DeleteAccountDialog } from './DeleteAccountDialog';
import { TotalRates } from './TotalRates';

/**
 * An account just added or restored: its card gets a ring and its currency's total counts up by `amount`. After a
 * delete (I-011) `amount` is minus the deleted balance, so the total counts down; after a transaction (F-018) it is
 * what the transaction changed.
 */
interface FreshAccount {
  id: string;
  currency: string;
  amount: number;
}

/** The accounts that just changed: one, or both sides of a transfer (F-019). */
type Fresh = FreshAccount[];

/** What the fresh accounts in `currency` changed together; nothing when none is in it. */
function changedIn(fresh: Fresh | undefined, currency: string): number | undefined {
  const inCurrency = fresh?.filter((account) => account.currency === currency) ?? [];
  return inCurrency.length > 0
    ? inCurrency.reduce((sum, account) => sum + account.amount, 0)
    : undefined;
}

/** Where a total counts from: what it was before `changed`; nothing to count when nothing changed in it. */
function fromBefore(total: number, changed: number | undefined): number | undefined {
  return changed === undefined ? undefined : total - changed;
}

/** The currency "In total" starts with until the API names the person's own (F-016): the hryvnia. */
const REPORT_CURRENCY = 'UAH';

/** How long the ring shows (AccountCard.module.css). */
const FRESH_MS = 1700;

/**
 * Accounts (F-014, final prototype variant 10): every account as a card, grouped by currency or by source, with
 * "In total" per currency on top and the archived accounts folded under the list.
 */
export function AccountsPage() {
  const { t } = useTranslation();
  const accounts = useQuery(accountsQuery);
  const [groupBy, setGroupBy] = useState<GroupBy>(readGroupBy);
  const [dialog, setDialog] = useState<{ mode: AccountDialogMode; opened: boolean; key: number }>();
  const [fresh, setFresh] = useState<Fresh>();
  const [deleting, setDeleting] = useState<Account>();
  const transactionForm = useTransactionForm();
  useFreshAfterTransaction(transactionForm.lastChange, accounts.data, setFresh);

  useEffect(() => {
    if (!fresh) return;
    const timer = window.setTimeout(() => {
      setFresh(undefined);
    }, FRESH_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [fresh]);

  const openForm = (mode: AccountDialogMode) => {
    setDialog({ mode, opened: true, key: (dialog?.key ?? 0) + 1 });
  };
  const closeForm = () => {
    if (dialog) setDialog({ ...dialog, opened: false });
  };
  // The form needs the person's banks and sources: it opens once the accounts are loaded
  const addButton = (
    <Button
      className={classes.addButton}
      leftSection={<IconPlus size={20} stroke={1.7} />}
      disabled={!accounts.isSuccess}
      onClick={() => {
        openForm({ kind: 'new', preset: {} });
      }}
    >
      {t('accounts.add')}
    </Button>
  );
  const head = (withButton: boolean) => (
    <header className={classes.head}>
      <Title order={1} className={classes.title}>
        {t('nav.accounts')}
      </Title>
      {withButton && addButton}
    </header>
  );

  if (accounts.isPending) {
    return (
      <>
        {head(true)}
        <div
          className={classes.groups}
          role="status"
          aria-busy="true"
          aria-label={t('accounts.loading')}
        >
          <Skeleton height={18} width={140} radius="sm" mb={14} />
          <div className={classes.cards}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height={108} radius="md" />
            ))}
          </div>
        </div>
      </>
    );
  }

  if (accounts.isError) {
    return (
      <>
        {head(true)}
        <div className={classes.errorBanner} role="alert">
          <IconAlertCircle size={20} stroke={1.7} aria-hidden />
          <div>
            <p>{t('accounts.errors.load')}</p>
            <UnstyledButton
              className={classes.textLink}
              style={{ color: 'inherit' }}
              onClick={() => {
                void accounts.refetch();
              }}
            >
              <IconRefresh size={20} stroke={1.7} aria-hidden />
              {t('accounts.errors.retry')}
            </UnstyledButton>
          </div>
        </div>
      </>
    );
  }

  const overview = accounts.data;
  const empty = overview.accounts.length === 0;

  return (
    <>
      {empty ? (
        <>
          {head(false)}
          <div className={classes.emptyBox}>
            <h2 className={classes.emptyTitle}>{t('accounts.empty.title')}</h2>
            <p className={classes.dim}>{t('accounts.empty.text')}</p>
            <Button
              mt={18}
              leftSection={<IconPlus size={20} stroke={1.7} />}
              onClick={() => {
                openForm({ kind: 'new', preset: {} });
              }}
            >
              {t('accounts.empty.button')}
            </Button>
          </div>
        </>
      ) : (
        <>
          {head(true)}
          <div className={classes.toolbar}>
            <span className={classes.groupByLabel} aria-hidden="true">
              {t('accounts.groupBy')}
            </span>
            <SegmentedControl
              aria-label={t('accounts.groupByLabel')}
              value={groupBy}
              onChange={(value) => {
                const next = value === 'source' ? 'source' : 'currency';
                setGroupBy(next);
                writeGroupBy(next);
              }}
              data={[
                { value: 'currency', label: t('accounts.byCurrency') },
                { value: 'source', label: t('accounts.bySource') },
              ]}
              className={classes.switch}
            />
          </div>
          <Totals overview={overview} fresh={fresh} />
          <div className={classes.groups}>
            {groupAccounts(overview, groupBy).map((group) => (
              <Group
                key={group.id}
                group={group}
                groupBy={groupBy}
                fresh={fresh}
                onOpen={(account) => {
                  openForm({ kind: 'edit', account });
                }}
                onAdd={(preset) => {
                  openForm({ kind: 'new', preset });
                }}
                onAddTransaction={(account) => {
                  transactionForm.add({ accountId: account.id });
                }}
              />
            ))}
          </div>
        </>
      )}

      <Archived
        accounts={overview.archived}
        onRestored={(account) => {
          setFresh([{ id: account.id, currency: account.currency, amount: account.balance }]);
        }}
        onDelete={setDeleting}
      />

      <DeleteAccountDialog
        account={deleting}
        onClose={() => {
          setDeleting(undefined);
        }}
        onDeleted={(account) => {
          setDeleting(undefined);
          notifications.show({ message: t('accounts.delete.done', { name: account.name }) });
        }}
      />

      {dialog && (
        <AccountDialog
          key={dialog.key}
          mode={dialog.mode}
          opened={dialog.opened}
          overview={overview}
          onClose={closeForm}
          onSaved={(saved, added) => {
            closeForm();
            notifications.show({
              message: added
                ? t('accounts.form.added', { name: saved.name })
                : t('accounts.form.saved'),
            });
            if (added)
              setFresh([{ id: saved.id, currency: saved.currency, amount: saved.balance }]);
          }}
          onArchived={(account) => {
            closeForm();
            notifications.show({ message: t('accounts.archive.done', { name: account.name }) });
          }}
          onDeleted={(account) => {
            closeForm();
            notifications.show({ message: t('accounts.delete.done', { name: account.name }) });
            setFresh([{ id: account.id, currency: account.currency, amount: -account.balance }]);
          }}
        />
      )}
    </>
  );
}

/**
 * After a transaction was saved or deleted (F-018): once the page has the new balances, the cards of the accounts it
 * changed get their ring (both of a transfer, F-019) and the totals count by what changed. An archived account has no
 * card. A change made before the page opened lights nothing.
 */
function useFreshAfterTransaction(
  change: LastChange | undefined,
  overview: AccountsOverview | undefined,
  setFresh: (fresh: Fresh) => void,
) {
  const [waiting, setWaiting] = useState<LastChange>();
  const [seen, setSeen] = useState(change?.key);
  if (change && change.key !== seen) {
    setSeen(change.key);
    setWaiting(change);
  }

  if (!waiting || !overview) return;
  const changed = waiting.balances.flatMap((balance) => {
    const account = overview.accounts.find((item) => item.id === balance.accountId);
    return account ? [{ account, balance }] : [];
  });
  if (
    changed.length > 0 &&
    changed.every(({ account, balance }) => account.balance === balance.after)
  ) {
    setWaiting(undefined);
    setFresh(
      changed.map(({ account, balance }) => ({
        id: account.id,
        currency: account.currency,
        amount: balance.after - balance.before,
      })),
    );
  }
}

/**
 * "In total": everything in the report currency at today's NBU rates first, with the rates and their date (F-017),
 * then each currency's total over the accounts in use. With the report currency only, its total is all there is.
 */
function Totals({ overview, fresh }: { overview: AccountsOverview; fresh?: Fresh }) {
  const { t } = useTranslation();
  const title = useCurrencyTitle();
  const grand = useQuery(accountsTotalQuery);
  const currency = grand.data?.currency ?? REPORT_CURRENCY;
  const others = overview.totals.some((total) => total.currency !== currency);

  return (
    <div className={classes.totals} role="group" aria-label={t('accounts.totalsLabel')}>
      <div className={classes.grand}>
        <p className={classes.totalsLabel}>{t('accounts.inTotalIn', { currency })}</p>
        {grand.isPending ? (
          <Skeleton
            height={40}
            width={240}
            radius="sm"
            role="status"
            aria-label={t('accounts.rates.loading')}
          />
        ) : grand.data?.total == null ? (
          <p className={cx(classes.rates, classes.stale)}>
            <IconInfoCircle size={16} stroke={1.7} aria-hidden />
            {t('accounts.rates.missing')}
          </p>
        ) : (
          <>
            <span className={cx(classes.grandAmount, grand.data.total < 0 && classes.debt)}>
              <CountUp
                value={grand.data.total}
                currency={currency}
                from={freshFrom(grand.data, fresh)}
              />
            </span>
            <TotalRates total={grand.data} />
          </>
        )}
      </div>
      {others && (
        <div className={cx(classes.totalItems, classes.perCurrency)}>
          {overview.totals.map((total) => (
            <div key={total.currency} className={classes.totalItem}>
              <span className={classes.totalWhat}>{title(total.currency)}</span>
              <span className={cx(classes.totalAmount, total.total < 0 && classes.debt)}>
                <CountUp
                  value={total.total}
                  currency={total.currency}
                  from={fromBefore(total.total, changedIn(fresh, total.currency))}
                />
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Where the grand total counts from after an account is added, restored or deleted, or a transaction changed it: less
 * what the fresh accounts changed, each at its rate. Nothing when a rate isn't there.
 */
function freshFrom(grand: AccountsTotal, fresh?: Fresh): number | undefined {
  if (!fresh || fresh.length === 0 || grand.total === null) return undefined;
  const to = hryvniasFor(grand, grand.currency);
  let changed = 0;
  for (const account of fresh) {
    const from = hryvniasFor(grand, account.currency);
    if (from === undefined || to === undefined) return undefined;
    changed += (account.amount * from) / to;
  }
  return grand.total - changed;
}

/** Hryvnias for one unit, as the NBU gives the rates (F-016); the hryvnia's own is 1. */
function hryvniasFor(grand: AccountsTotal, currency: string): number | undefined {
  return currency === 'UAH' ? 1 : grand.rates.find((item) => item.currency === currency)?.rate;
}

interface GroupProps {
  group: AccountGroup;
  groupBy: GroupBy;
  fresh?: Fresh;
  onOpen: (account: Account) => void;
  onAdd: (preset: FormPreset) => void;
  /** The + on a card: a transaction from that account (F-018). */
  onAddTransaction: (account: Account) => void;
}

/** One group of cards: its heading (and total, by currency), the cards, and the ghost card that adds to it. */
function Group({ group, groupBy, fresh, onOpen, onAdd, onAddTransaction }: GroupProps) {
  const { t } = useTranslation();
  const currencyTitle = useCurrencyTitle();
  const headingId = useId();
  const { key, accounts } = group;
  const count = t('accounts.count', { count: accounts.length });

  const [title, caption, addName, preset]: [string, string, string, FormPreset] =
    key.by === 'currency'
      ? [
          currencyTitle(key.currency),
          t('accounts.caption', { what: key.currency, count }),
          key.currency,
          { currency: key.currency },
        ]
      : key.by === 'cash'
        ? [t('accounts.cash'), count, t('accounts.cashWord'), { source: 'Cash' }]
        : key.by === 'bank'
          ? [
              key.bank,
              t('accounts.caption', { what: t('accounts.bank'), count }),
              key.bank,
              { source: 'Bank', bank: key.bank },
            ]
          : [key.name, count, key.name, { source: `own:${key.sourceId}` }];

  const sourceOf = (account: Account) =>
    account.source === 'Cash'
      ? t('accounts.cash')
      : account.source === 'Bank'
        ? (account.bankName ?? '')
        : (account.sourceName ?? '');

  return (
    <section className={classes.group} aria-labelledby={headingId}>
      <div className={classes.groupHead}>
        <div className={classes.groupTitle}>
          <h2 id={headingId}>{title}</h2>
          <span className={classes.caption}>{caption}</span>
        </div>
        {key.by === 'currency' && (
          <span className={cx(classes.groupTotal, key.total < 0 && classes.debt)}>
            <CountUp
              value={key.total}
              currency={key.currency}
              from={fromBefore(key.total, changedIn(fresh, key.currency))}
            />
          </span>
        )}
      </div>
      <ul className={classes.cards}>
        {accounts.map((account) => (
          <li key={account.id}>
            <AccountCard
              name={account.name}
              meta={groupBy === 'currency' ? sourceOf(account) : undefined}
              code={groupBy === 'source' ? account.currency : undefined}
              balance={account.balance}
              currency={account.currency}
              cardStyle={account.cardStyle}
              isNew={fresh?.some((item) => item.id === account.id)}
              className={classes.card}
              onClick={() => {
                onOpen(account);
              }}
              addLabel={t('accounts.addTransaction', { name: account.name })}
              onAdd={() => {
                onAddTransaction(account);
              }}
            />
          </li>
        ))}
        <li>
          <AddCard
            label={t('accounts.addTo', { name: addName })}
            className={classes.ghost}
            onClick={() => {
              onAdd(preset);
            }}
          />
        </li>
      </ul>
    </section>
  );
}

/** Archived accounts, folded under the list; each can be restored or deleted for good (I-011). */
function Archived({
  accounts,
  onRestored,
  onDelete,
}: {
  accounts: Account[];
  onRestored: (account: Account) => void;
  onDelete: (account: Account) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const restore = useArchiveAccount();
  const listId = useId();

  if (accounts.length === 0) return null;

  const sourceOf = (account: Account) =>
    account.source === 'Cash'
      ? t('accounts.cash')
      : account.source === 'Bank'
        ? (account.bankName ?? '')
        : (account.sourceName ?? '');

  return (
    <>
      <h2 className={classes.disclosureHeading}>
        <UnstyledButton
          className={classes.disclosure}
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => {
            setOpen(!open);
          }}
        >
          <span className={classes.disclosureTitle}>{t('accounts.archived.title')}</span>
          <span className={classes.disclosureCount}>{accounts.length}</span>
          <IconChevronDown size={20} stroke={1.7} className={classes.chevron} aria-hidden />
        </UnstyledButton>
      </h2>
      <div id={listId} hidden={!open}>
        <p className={classes.archivedText}>{t('accounts.archived.text')}</p>
        <ul className={classes.archivedList}>
          {accounts.map((account) => (
            <li key={account.id} className={classes.archivedRow}>
              <span>{account.name}</span>
              <span className={classes.archivedMeta}>
                {t('accounts.archived.meta', {
                  source: sourceOf(account),
                  date: formatDate(account.archivedAt ?? ''),
                })}
                {account.balance !== 0 && (
                  <>
                    {', '}
                    <span className={classes.num}>
                      {t('accounts.archived.left', {
                        amount: formatMoney(account.balance, account.currency),
                      })}
                    </span>
                  </>
                )}
              </span>
              <span className={classes.archivedActions}>
                <Button
                  variant="quiet"
                  leftSection={<IconRestore size={20} stroke={1.7} />}
                  aria-label={t('accounts.archived.restoreLabel', { name: account.name })}
                  loading={restore.isPending && restore.variables.id === account.id}
                  onClick={() => {
                    restore.mutate(
                      { id: account.id, restore: true },
                      {
                        onSuccess: () => {
                          notifications.show({
                            message: t('accounts.archived.restored', { name: account.name }),
                          });
                          onRestored(account);
                        },
                        onError: (error) => {
                          if (error instanceof AccountCopyError)
                            notifications.show({
                              color: 'red',
                              message: t('accounts.archived.copy', { name: account.name }),
                            });
                        },
                      },
                    );
                  }}
                >
                  {t('accounts.archived.restore')}
                </Button>
                {/* An archived account with transactions keeps only Restore (I-011) */}
                {account.transactionCount === 0 && (
                  <Button
                    variant="danger-quiet"
                    leftSection={<IconTrash size={20} stroke={1.7} />}
                    aria-label={t('accounts.archived.deleteLabel', { name: account.name })}
                    onClick={() => {
                      onDelete(account);
                    }}
                  >
                    {t('accounts.archived.delete')}
                  </Button>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
