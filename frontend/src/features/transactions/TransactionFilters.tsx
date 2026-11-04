import { Button, UnstyledButton } from '@mantine/core';
import { IconAdjustmentsHorizontal, IconChevronDown, IconWallet, IconX } from '@tabler/icons-react';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '../../shared/ui/BottomSheet';
import { cx } from '../../shared/ui/cx';
import type { Account } from '../accounts/accountsApi';
import { cleared, filterCount, type Filters } from './filters';
import { Picker } from './Picker';
import pills from '../../shared/ui/Pills.module.css';
import formClasses from './TransactionForm.module.css';
import classes from './TransactionsPage.module.css';
import type { CategoryTotal, TransactionType } from './transactionsApi';
import { WhereItWent } from './WhereItWent';

const TYPES: readonly TransactionType[] = ['Expense', 'Income', 'Transfer'];

interface TransactionFiltersProps {
  filters: Filters;
  /** The accounts in use, then the archived ones. */
  accounts: Account[];
  /** The picked category's name, when it is picked. */
  categoryName?: string;
  categories: CategoryTotal[];
  currency: string;
  /** How many transactions the filters find: the sheet's button says it. */
  count?: number;
  onAccount: (accountId: string | undefined) => void;
  onType: (type: TransactionType | undefined) => void;
  onCategory: (categoryId: string | undefined) => void;
  onChange: (filters: Filters) => void;
  /** The phone's sheet closed: its picks go into the address. */
  onSettle: () => void;
  /**
   * `desktop`: Account and Type, a picked category as a chip with ×; `tablet`: Account, Type and By category;
   * `phone`: one Filters button and the picked ones as chips.
   */
  layout: 'desktop' | 'tablet' | 'phone';
}

/** The filters besides the period (F-020, variant 8): account, type and category. */
export function TransactionFilters(props: TransactionFiltersProps) {
  return props.layout === 'phone' ? <PhoneFilters {...props} /> : <WideFilters {...props} />;
}

function accountLine(account: Account, cash: string, archived: string) {
  const source =
    account.source === 'Cash'
      ? cash
      : account.source === 'Bank'
        ? (account.bankName ?? '')
        : (account.sourceName ?? '');
  return [source, account.currency, account.archivedAt ? archived : null]
    .filter(Boolean)
    .join(', ');
}

/** The account and type lists, a dropdown under their button. */
function ListPicker({
  label,
  value,
  on,
  icon,
  children,
  width,
}: {
  label: string;
  value: string;
  on: boolean;
  icon?: ReactNode;
  children: (close: () => void) => ReactNode;
  width?: number;
}) {
  const [open, setOpen] = useState(false);
  const close = () => {
    setOpen(false);
  };
  return (
    <Picker
      opened={open}
      onClose={close}
      title={label}
      width={width ?? 300}
      listHeight={344}
      target={
        <UnstyledButton
          className={classes.select}
          data-on={on || undefined}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={`${label}: ${value}`}
          onClick={() => {
            setOpen(!open);
          }}
        >
          {icon}
          <span>{value}</span>
          <IconChevronDown size={16} stroke={1.7} aria-hidden />
        </UnstyledButton>
      }
    >
      {children(close)}
    </Picker>
  );
}

function WideFilters({
  filters,
  accounts,
  categoryName,
  categories,
  currency,
  onAccount,
  onType,
  onCategory,
  layout,
}: TransactionFiltersProps) {
  const { t } = useTranslation();
  const account = accounts.find((item) => item.id === filters.accountId);
  const item = (
    pressed: boolean,
    onClick: () => void,
    name: string,
    sub?: string,
    first?: boolean,
  ) => (
    <UnstyledButton
      className={formClasses.listItem}
      aria-pressed={pressed}
      data-autofocus={pressed || (first && undefined)}
      onClick={onClick}
    >
      <span className={formClasses.listName}>{name}</span>
      {sub && <span className={formClasses.balance}>{sub}</span>}
    </UnstyledButton>
  );

  return (
    <div className={classes.controls} role="group" aria-label={t('transactions.filters.label')}>
      <ListPicker
        label={t('transactions.filters.account')}
        value={account?.name ?? t('transactions.filters.allAccounts')}
        on={!!account}
        icon={<IconWallet size={16} stroke={1.7} aria-hidden />}
        width={320}
      >
        {(close) => (
          <ul className={formClasses.list}>
            <li>
              {item(
                !filters.accountId,
                () => {
                  onAccount(undefined);
                  close();
                },
                t('transactions.filters.allAccounts'),
              )}
            </li>
            {accounts.map((option) => (
              <li key={option.id}>
                {item(
                  option.id === filters.accountId,
                  () => {
                    onAccount(option.id);
                    close();
                  },
                  option.name,
                  accountLine(option, t('accounts.cash'), t('transactions.filters.archived')),
                )}
              </li>
            ))}
          </ul>
        )}
      </ListPicker>
      <ListPicker
        label={t('transactions.filters.type')}
        value={
          filters.type
            ? t(`transactions.filters.${filters.type}`)
            : t('transactions.filters.allTypes')
        }
        on={!!filters.type}
        width={240}
      >
        {(close) => (
          <ul className={formClasses.list}>
            {[undefined, ...TYPES].map((type) => (
              <li key={type ?? 'all'}>
                {item(
                  filters.type === type,
                  () => {
                    onType(type);
                    close();
                  },
                  type ? t(`transactions.filters.${type}`) : t('transactions.filters.allTypes'),
                )}
              </li>
            ))}
          </ul>
        )}
      </ListPicker>
      {layout === 'tablet' && filters.type !== 'Transfer' && (
        <ListPicker
          label={t(
            filters.type === 'Income' ? 'transactions.where.received' : 'transactions.where.spent',
          )}
          value={categoryName ?? t('transactions.filters.byCategory')}
          on={!!filters.categoryId}
          width={360}
        >
          {(close) => (
            <div className={classes.dropdownBars}>
              <WhereItWent
                categories={categories}
                currency={currency}
                income={filters.type === 'Income'}
                picked={filters.categoryId}
                onPick={(categoryId) => {
                  onCategory(categoryId);
                  close();
                }}
                place="menu"
              />
            </div>
          )}
        </ListPicker>
      )}
      {layout === 'desktop' && categoryName && (
        <UnstyledButton
          className={classes.select}
          data-on
          aria-label={t('transactions.filters.showingOnly', { name: categoryName })}
          onClick={() => {
            onCategory(undefined);
          }}
        >
          <span>{categoryName}</span>
          <IconX size={16} stroke={1.7} aria-hidden />
        </UnstyledButton>
      )}
    </div>
  );
}

/**
 * The phone (PocketGuard's pattern): one Filters button with how many are on, each picked filter as a chip with its
 * own ×, and one sheet with Account and Type as pills and the category bars. Picks apply at once; "Show 5
 * transactions" closes the sheet.
 */
function PhoneFilters({
  filters,
  accounts,
  categoryName,
  categories,
  currency,
  count,
  onAccount,
  onType,
  onCategory,
  onChange,
  onSettle,
}: TransactionFiltersProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const on = filterCount(filters);
  const account = accounts.find((item) => item.id === filters.accountId);
  const close = () => {
    setOpen(false);
    onSettle();
  };

  const chip = (text: string, clearLabel: string, clear: () => void) => (
    <span className={classes.chip}>
      <span>{text}</span>
      <UnstyledButton className={classes.chipClear} aria-label={clearLabel} onClick={clear}>
        <IconX size={16} stroke={1.7} aria-hidden />
      </UnstyledButton>
    </span>
  );
  const pill = (pressed: boolean, text: string, onClick: () => void, type?: TransactionType) => (
    <UnstyledButton
      className={cx(pills.pill, classes.typePill)}
      aria-pressed={pressed}
      data-type={type}
      onClick={onClick}
    >
      {text}
    </UnstyledButton>
  );

  return (
    <div className={classes.controls} role="group" aria-label={t('transactions.filters.label')}>
      <UnstyledButton
        className={cx(classes.select, classes.filtersButton)}
        data-on={on > 0 || undefined}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setOpen(true);
        }}
      >
        <IconAdjustmentsHorizontal size={20} stroke={1.7} aria-hidden />
        <span>{t('transactions.filters.button')}</span>
        {on > 0 && (
          <span className={classes.count} aria-label={t('transactions.filters.on', { count: on })}>
            {on}
          </span>
        )}
      </UnstyledButton>
      {account &&
        chip(account.name, t('transactions.filters.clearAccount', { name: account.name }), () => {
          onAccount(undefined);
        })}
      {filters.type &&
        chip(
          t(`transactions.filters.${filters.type}`),
          t('transactions.filters.clearType', { name: t(`transactions.filters.${filters.type}`) }),
          () => {
            onType(undefined);
          },
        )}
      {categoryName &&
        chip(categoryName, t('transactions.filters.clearCategory', { name: categoryName }), () => {
          onCategory(undefined);
        })}
      <BottomSheet
        opened={open}
        onClose={close}
        title={t('transactions.filters.label')}
        tall
        footer={
          <div className={classes.sheetFooter}>
            <Button
              variant="quiet"
              disabled={on === 0}
              onClick={() => {
                onChange(cleared(filters));
              }}
            >
              {t('transactions.filters.clearAll')}
            </Button>
            <Button onClick={close}>
              {count === 0
                ? t('transactions.filters.nothing')
                : t('transactions.filters.show', { count: count ?? 0 })}
            </Button>
          </div>
        }
      >
        <div className={classes.sheet}>
          <section className={classes.sheetSection} aria-label={t('transactions.filters.account')}>
            <h3 aria-hidden="true">{t('transactions.filters.account')}</h3>
            <div className={pills.pills}>
              {pill(!filters.accountId, t('transactions.filters.allAccounts'), () => {
                onAccount(undefined);
              })}
              {accounts.map((option) => (
                <span key={option.id}>
                  {pill(option.id === filters.accountId, option.name, () => {
                    onAccount(option.id);
                  })}
                </span>
              ))}
            </div>
          </section>
          <section className={classes.sheetSection} aria-label={t('transactions.filters.type')}>
            <h3 aria-hidden="true">{t('transactions.filters.type')}</h3>
            <div className={pills.pills}>
              {pill(!filters.type, t('transactions.filters.allTypes'), () => {
                onType(undefined);
              })}
              {TYPES.map((type) => (
                <span key={type}>
                  {pill(
                    filters.type === type,
                    t(`transactions.filters.${type}`),
                    () => {
                      onType(type);
                    },
                    type,
                  )}
                </span>
              ))}
            </div>
          </section>
          {filters.type !== 'Transfer' && categories.length > 0 && (
            <section
              className={classes.sheetSection}
              aria-label={t('transactions.filters.category')}
            >
              <h3 aria-hidden="true">{t('transactions.filters.category')}</h3>
              <WhereItWent
                categories={categories}
                currency={currency}
                income={filters.type === 'Income'}
                picked={filters.categoryId}
                onPick={onCategory}
                place="menu"
              />
            </section>
          )}
        </div>
      </BottomSheet>
    </div>
  );
}
