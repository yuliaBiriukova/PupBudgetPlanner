import { Skeleton, UnstyledButton } from '@mantine/core';
import { IconArrowRight, IconLock } from '@tabler/icons-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { formatMoney } from '../../shared/format/money';
import { cx } from '../../shared/ui/cx';
import { FAMILY, useWhose } from '../../features/family/whose';
import whoseClasses from '../../features/family/Whose.module.css';
import { LineWhose } from '../../features/family/WhoseLens';
import { byDay, useDayTitle } from '../../features/transactions/receiptDays';
import { scrollParentOf } from '../../features/transactions/scrollParent';
import { SignedAmount } from '../../features/transactions/SignedAmount';
import classes from '../../features/transactions/TransactionsPage.module.css';
import {
  isExchange,
  type DayTotal,
  type Transaction,
} from '../../features/transactions/transactionsApi';
import proto from './FamilyPrivacy.module.css';
import { isKept, usePrivacy } from './privacy';

interface ReceiptsProps {
  items: Transaction[];
  /** Each day's totals in `currency`: the foot of its receipt, even when only part of its lines has loaded. */
  days: ReadonlyMap<string, DayTotal>;
  currency?: string;
  /** One picked account: a transfer is money out of it or into it. */
  account?: string;
  /** The transaction just saved, while its line is lit. */
  fresh?: string;
  onOpen: (transaction: Transaction) => void;
  /** There is more to load: it loads as the end comes near. */
  hasMore: boolean;
  loadingMore: boolean;
  onMore: () => void;
}

/**
 * Every day as a till receipt (F-020, variant 4's slips): the day on top, a line per transaction with a dotted leader
 * to its amount (the account and note under it), what the day cost at the foot. A line of yours opens the form;
 * someone else's is only to look at, and in the family's money it starts with their initial (F-024).
 */
export function Receipts({
  items,
  days,
  currency,
  account,
  fresh,
  onOpen,
  hasMore,
  loadingMore,
  onMore,
}: ReceiptsProps) {
  const { t } = useTranslation();
  const dayTitle = useDayTitle();

  return (
    <>
      <div className={classes.slips}>
        {byDay(items).map(([day, lines]) => (
          <Receipt
            key={day}
            title={dayTitle(day)}
            lines={lines}
            total={days.get(day)}
            currency={currency}
            account={account}
            fresh={fresh}
            onOpen={onOpen}
            more={hasMore ? Math.max(0, (days.get(day)?.count ?? 0) - lines.length) : 0}
          />
        ))}
      </div>
      {loadingMore ? (
        <div
          className={classes.loadingMore}
          role="status"
          aria-label={t('transactions.list.loadingMore')}
        >
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={52} radius="md" />
          ))}
        </div>
      ) : (
        hasMore && <Sentinel onSeen={onMore} />
      )}
    </>
  );
}

function Receipt({
  title,
  lines,
  total,
  currency,
  account,
  fresh,
  onOpen,
  more,
}: {
  title: string;
  lines: Transaction[];
  total?: DayTotal;
  currency?: string;
  account?: string;
  fresh?: string;
  onOpen: (transaction: Transaction) => void;
  more: number;
}) {
  const { t } = useTranslation();
  const headingId = useId();
  const whose = useWhose();
  const { privacy } = usePrivacy();

  return (
    <section className={classes.paper} aria-labelledby={headingId}>
      <h2 className={classes.receiptDay} id={headingId}>
        {title}
      </h2>
      <div className={classes.rule} role="presentation" />
      <ul className={classes.lines}>
        {lines.map((item) => (
          <li key={item.id}>
            <Line
              mine={whose.isMine(item.ownerId)}
              fresh={item.id === fresh}
              onOpen={() => {
                onOpen(item);
              }}
            >
              <span className={classes.lineName}>
                {whose.who === FAMILY && !whose.isMine(item.ownerId) && (
                  <LineWhose name={whose.nameOf(item.ownerId) ?? ''} />
                )}
                {item.type === 'Transfer'
                  ? t(
                      isExchange(item)
                        ? 'transactions.list.Exchange'
                        : 'transactions.list.Transfer',
                    )
                  : item.categoryName}
                {whose.isMine(item.ownerId) && isKept(privacy, item) && (
                  <IconLock
                    size={16}
                    stroke={1.7}
                    className={proto.lineMark}
                    aria-label="Kept from the family"
                  />
                )}
              </span>
              <span className={classes.leader} aria-hidden="true" />
              <span className={classes.lineAmount}>
                <SignedAmount transaction={item} account={account} />
              </span>
              <span className={classes.lineNote}>
                {item.type === 'Transfer' ? (
                  // Where the money went, then the note (F-019)
                  <>
                    <span>{item.accountName}</span>
                    <IconArrowRight size={16} stroke={1.7} aria-label={t('transactions.list.to')} />
                    <span>
                      {item.note ? `${item.toAccountName ?? ''}, ${item.note}` : item.toAccountName}
                    </span>
                  </>
                ) : (
                  <span>{item.note ? `${item.accountName}, ${item.note}` : item.accountName}</span>
                )}
              </span>
            </Line>
          </li>
        ))}
      </ul>
      {more > 0 && (
        <p className={classes.stillLoading}>
          {t('transactions.list.moreLoading', { count: more })}
        </p>
      )}
      {total && currency && (total.spent > 0 || total.received > 0) && (
        <>
          <div className={classes.rule} role="presentation" />
          {total.spent > 0 && (
            <div className={classes.foot}>
              <span>{t('transactions.list.total')}</span>
              <span className={classes.footTotal}>−{formatMoney(total.spent, currency)}</span>
            </div>
          )}
          {total.received > 0 && (
            <div className={cx(classes.foot, classes.footReceived)}>
              <span>{t('transactions.list.received')}</span>
              <span>+{formatMoney(total.received, currency)}</span>
            </div>
          )}
        </>
      )}
    </section>
  );
}

/** Loads the next page once the end of the list comes within 240 px of the screen. */
function Sentinel({ onSeen }: { onSeen: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useRef(onSeen);
  useEffect(() => {
    seen.current = onSeen;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) seen.current();
      },
      { root: scrollParentOf(el), rootMargin: '0px 0px 240px 0px' },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, []);

  return <div ref={ref} className={classes.sentinel} aria-hidden="true" />;
}

/** A line: your own opens the form; someone else's is only to look at (F-024). */
function Line({
  mine,
  fresh,
  onOpen,
  children,
}: {
  mine: boolean;
  fresh: boolean;
  onOpen: () => void;
  children: ReactNode;
}) {
  if (!mine) return <div className={cx(classes.line, whoseClasses.still)}>{children}</div>;
  return (
    <UnstyledButton className={classes.line} data-fresh={fresh || undefined} onClick={onOpen}>
      {children}
    </UnstyledButton>
  );
}
