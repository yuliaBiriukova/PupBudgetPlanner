import { Button, Skeleton, Title, UnstyledButton } from '@mantine/core';
import { IconAlertCircle, IconInfoCircle, IconPlus, IconRefresh } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { dayName, longDay, today } from './days';
import { SignedAmount } from './SignedAmount';
import { useTransactionForm } from './transactionForm';
import classes from './Transactions.module.css';
import { latestTransactionsQuery, type Transaction } from './transactionsApi';

/** How long a saved row stays lit (Transactions.module.css). */
const FRESH_MS = 2400;

/**
 * Transactions (F-018): until F-020 brings the full list with filters, the latest transactions by day, newest first.
 * A row opens the form to change or delete it.
 */
export function TransactionsPage() {
  const { t } = useTranslation();
  const latest = useQuery(latestTransactionsQuery);
  const form = useTransactionForm();
  const fresh = useFresh(form.lastChange?.key, form.lastChange?.transactionId);

  const head = (
    <header className={classes.head}>
      <Title order={1} className={classes.title}>
        {t('nav.transactions')}
      </Title>
    </header>
  );

  if (latest.isPending) {
    return (
      <>
        {head}
        <div
          className={classes.latest}
          role="status"
          aria-busy="true"
          aria-label={t('transactions.list.loading')}
        >
          <Skeleton height={16} width={120} radius="sm" my={16} />
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={52} radius="md" mb={8} />
          ))}
        </div>
      </>
    );
  }

  if (latest.isError) {
    return (
      <>
        {head}
        <div className={classes.errorBanner} role="alert">
          <IconAlertCircle size={20} stroke={1.7} aria-hidden />
          <div>
            <p>{t('transactions.list.error')}</p>
            <UnstyledButton
              className={classes.textLink}
              onClick={() => {
                void latest.refetch();
              }}
            >
              <IconRefresh size={20} stroke={1.7} aria-hidden />
              {t('transactions.list.retry')}
            </UnstyledButton>
          </div>
        </div>
      </>
    );
  }

  if (latest.data.length === 0) {
    return (
      <>
        {head}
        <div className={classes.empty}>
          <h2 className={classes.emptyTitle}>{t('transactions.list.emptyTitle')}</h2>
          <p className={classes.emptyText}>{t('transactions.list.emptyText')}</p>
          <Button
            radius="xl"
            mt={18}
            leftSection={<IconPlus size={20} stroke={1.8} />}
            onClick={() => {
              form.add();
            }}
          >
            {t('shell.addTransaction')}
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      {head}
      <div className={classes.latest}>
        <p className={classes.note}>
          <IconInfoCircle size={16} stroke={1.7} aria-hidden />
          {t('transactions.list.note')}
        </p>
        {byDay(latest.data).map(([day, items]) => (
          <Day key={day} day={day} items={items} fresh={fresh} onOpen={form.edit} />
        ))}
      </div>
    </>
  );
}

/** The transaction just saved, while its row is lit; changes made before the page opened light nothing. */
function useFresh(key: number | undefined, transactionId: string | undefined) {
  const seen = useRef(key);
  const [fresh, setFresh] = useState<string>();

  useEffect(() => {
    if (key === seen.current) return;
    seen.current = key;
    setFresh(transactionId);
    const timer = window.setTimeout(() => {
      setFresh(undefined);
    }, FRESH_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [key, transactionId]);

  return fresh;
}

/** The transactions grouped by day, in the order the API sends them (newest first). */
function byDay(items: Transaction[]): [string, Transaction[]][] {
  const days = new Map<string, Transaction[]>();
  for (const item of items) days.set(item.date, [...(days.get(item.date) ?? []), item]);
  return [...days];
}

interface DayProps {
  day: string;
  items: Transaction[];
  fresh?: string;
  onOpen: (transaction: Transaction) => void;
}

function Day({ day, items, fresh, onOpen }: DayProps) {
  const { t } = useTranslation();
  const headingId = useId();
  const name = dayName(day, today());
  const short = dayjs(day).format('D MMM');

  return (
    <section aria-labelledby={headingId}>
      <h2 className={classes.day} id={headingId}>
        {name === 'other' ? longDay(day) : t(`transactions.list.${name}`, { date: short })}
      </h2>
      <ul className={classes.rows}>
        {items.map((item) => (
          <li key={item.id}>
            <UnstyledButton
              className={classes.row}
              data-fresh={item.id === fresh || undefined}
              onClick={() => {
                onOpen(item);
              }}
            >
              <span className={classes.main}>
                <span className={classes.category}>{item.categoryName}</span>
                <span className={classes.sub}>
                  {item.note ? `${item.accountName}, ${item.note}` : item.accountName}
                </span>
              </span>
              <SignedAmount transaction={item} />
            </UnstyledButton>
          </li>
        ))}
      </ul>
    </section>
  );
}
