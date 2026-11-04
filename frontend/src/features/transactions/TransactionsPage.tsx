import { Button, Skeleton, UnstyledButton, VisuallyHidden } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconAlertCircle, IconChevronUp, IconPlus, IconRefresh, IconX } from '@tabler/icons-react';
import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { useTranslation } from 'react-i18next';
import { DESKTOP_QUERY } from '../../app/shell/sections';
import { cx } from '../../shared/ui/cx';
import { accountsQuery } from '../accounts/accountsApi';
import { categoriesQuery } from '../categories/categoriesApi';
import {
  cleared,
  filterCount,
  listQueryOf,
  periodName,
  stepped,
  summaryQueryOf,
  withCategory,
  withPeriod,
  withKnown,
  withType,
  type Filters,
} from './filters';
import { useDayTitle } from './receiptDays';
import { Receipts } from './Receipts';
import { scrollParentOf } from './scrollParent';
import { SpendingCalendar } from './SpendingCalendar';
import { MiniFigures, TotalsSlip } from './TotalsSlip';
import { TransactionFilters } from './TransactionFilters';
import { useTransactionForm } from './transactionForm';
import classes from './TransactionsPage.module.css';
import { transactionPagesQuery, transactionSummaryQuery } from './transactionsApi';
import { useTransactionFilters } from './useTransactionFilters';
import { WhereItWent } from './WhereItWent';

/** How long a saved line stays lit (TransactionsPage.module.css). */
const FRESH_MS = 2400;

/** The desktop's two columns: the calendar and the categories on the left, the receipts on the right. */
const WIDE_QUERY = '(min-width: 64em)';

/**
 * Transactions (F-020, variant 8): the period's totals on a dark slip, a folding calendar and "Where it went", then
 * every day as a till receipt, newest first, loading more on scroll. Filters (period, account, type, category, a
 * day) are the page's address. A line opens the form to change or delete it.
 */
export function TransactionsPage() {
  const { t } = useTranslation();
  const address = useTransactionFilters();
  const { setFilters, settle } = address;
  const form = useTransactionForm();
  const fresh = useFresh(form.lastChange?.key, form.lastChange?.transactionId);
  const wide = useMediaQuery(WIDE_QUERY, false, { getInitialValueInEffect: false });
  const tablet = useMediaQuery(DESKTOP_QUERY, false, { getInitialValueInEffect: false });
  const dayTitle = useDayTitle();

  const accounts = useQuery(accountsQuery);
  const categories = useQuery(categoriesQuery);
  const allAccounts = [...(accounts.data?.accounts ?? []), ...(accounts.data?.archived ?? [])];
  const filters = withKnown(
    address.filters,
    accounts.data && allAccounts.map((account) => account.id),
    categories.data?.groups.flatMap((group) => group.categories.map((category) => category.id)),
  );

  const summary = useQuery({
    ...transactionSummaryQuery(summaryQueryOf(filters)),
    placeholderData: keepPreviousData,
  });
  const pages = useInfiniteQuery({
    ...transactionPagesQuery(listQueryOf(filters)),
    placeholderData: keepPreviousData,
  });
  const slip = useRef<HTMLElement>(null);
  const miniOn = useMiniBar(slip, !wide);

  const picked = filterCount(filters) > 0;
  const month = filters.period.kind === 'month' ? filters.period.month : undefined;
  const noTransactions =
    accounts.isSuccess && allAccounts.every((account) => account.transactionCount === 0);
  const kindOf = (categoryId: string) =>
    categories.data?.groups.find((group) =>
      group.categories.some((category) => category.id === categoryId),
    )?.kind;
  const categoryName = filters.categoryId
    ? (summary.data?.categories.find((category) => category.categoryId === filters.categoryId)
        ?.name ??
      categories.data?.groups
        .flatMap((group) => group.categories)
        .find((category) => category.id === filters.categoryId)?.name)
    : undefined;

  const set = (next: Filters) => {
    setFilters(next);
  };
  const filterProps = {
    filters,
    accounts: allAccounts,
    categoryName,
    categories: summary.data?.categories ?? [],
    currency: summary.data?.currency ?? 'UAH',
    count: summary.data?.count,
    onAccount: (accountId: string | undefined) => {
      set({ ...filters, accountId });
    },
    onType: (type: Filters['type']) => {
      set(withType(filters, type, kindOf));
    },
    onCategory: (categoryId: string | undefined) => {
      set(withCategory(filters, categoryId));
    },
    onChange: set,
    onSettle: settle,
  };

  const periodLabel = periodName(filters.period, t('transactions.totals.allTime'));
  const items = pages.data?.pages.flatMap((page) => page.items) ?? [];
  const dayTotals = new Map((summary.data?.days ?? []).map((day) => [day.date, day]));

  let list;
  if (pages.isPending) {
    list = (
      <div role="status" aria-busy="true" aria-label={t('transactions.list.loading')}>
        <Skeleton height={16} width={140} radius="sm" my={16} />
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} height={52} radius="md" mb={8} />
        ))}
      </div>
    );
  } else if (pages.isError) {
    list = (
      <div className={classes.errorBanner} role="alert">
        <IconAlertCircle size={20} stroke={1.7} aria-hidden />
        <div>
          <p>{t('transactions.list.error')}</p>
          <UnstyledButton
            className={classes.textLink}
            onClick={() => {
              void pages.refetch();
            }}
          >
            <IconRefresh size={20} stroke={1.7} aria-hidden />
            {t('transactions.list.retry')}
          </UnstyledButton>
        </div>
      </div>
    );
  } else if (items.length === 0 && noTransactions) {
    list = (
      <Empty title={t('transactions.list.emptyTitle')} text={t('transactions.list.emptyText')}>
        <Button
          radius="xl"
          className={classes.emptyButton}
          leftSection={<IconPlus size={20} stroke={1.8} />}
          onClick={() => {
            form.add();
          }}
        >
          {t('shell.addTransaction')}
        </Button>
      </Empty>
    );
  } else if (items.length === 0 && filters.day) {
    const day = dayTitle(filters.day);
    list = (
      <Empty
        title={t('transactions.list.nothingOnDayTitle')}
        text={t(
          picked ? 'transactions.list.nothingOnDayFiltered' : 'transactions.list.nothingOnDay',
          {
            day,
          },
        )}
      />
    );
  } else if (items.length === 0) {
    list = picked ? (
      <Empty
        title={t('transactions.list.nothingTitle')}
        text={
          filters.period.kind === 'all'
            ? t('transactions.list.nothingTextAll')
            : t('transactions.list.nothingText', { period: periodLabel })
        }
      >
        <Button
          variant="default"
          radius="xl"
          className={classes.emptyButton}
          leftSection={<IconX size={20} stroke={1.7} />}
          onClick={() => {
            set(cleared(filters));
          }}
        >
          {t('transactions.list.clearFilters')}
        </Button>
      </Empty>
    ) : (
      <Empty
        title={t('transactions.list.nothingInPeriodTitle', { period: periodLabel })}
        text={t('transactions.list.nothingInPeriodText', { period: periodLabel })}
      />
    );
  } else {
    const previous = stepped(filters.period, -1);
    list = (
      <div className={cx(pages.isPlaceholderData && classes.stale)}>
        <Receipts
          items={items}
          days={dayTotals}
          currency={summary.data?.currency}
          account={filters.accountId}
          fresh={fresh}
          onOpen={form.edit}
          hasMore={pages.hasNextPage}
          loadingMore={pages.isFetchingNextPage}
          onMore={() => {
            if (!pages.isFetchingNextPage) void pages.fetchNextPage();
          }}
        />
        {!pages.hasNextPage && !filters.day && (
          <>
            <p className={classes.listEnd}>
              {month
                ? t('transactions.list.endOfMonth', { period: periodLabel })
                : t('transactions.list.endOfAll')}
            </p>
            {month && previous && (
              <div className={classes.listEndButton}>
                <Button
                  variant="default"
                  radius="xl"
                  onClick={() => {
                    set(withPeriod(filters, previous));
                  }}
                >
                  {t('transactions.list.showMonth', {
                    month: periodName(previous, ''),
                  })}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  const calendar = month && (
    <SpendingCalendar
      month={month}
      days={summary.data?.days ?? []}
      currency={summary.data?.currency ?? 'UAH'}
      picked={filters.day}
      onPick={(day) => {
        set({ ...filters, day });
      }}
      openAtFirst={wide}
    />
  );
  const bars = wide && filters.type !== 'Transfer' && (
    <WhereItWent
      categories={summary.data?.categories ?? []}
      currency={summary.data?.currency ?? 'UAH'}
      income={filters.type === 'Income'}
      picked={filters.categoryId}
      onPick={filterProps.onCategory}
      place="column"
    />
  );
  const layout = wide ? 'desktop' : tablet ? 'tablet' : 'phone';
  const controls = <TransactionFilters {...filterProps} layout={layout} />;

  return (
    <>
      <VisuallyHidden>
        <h1>{t('nav.transactions')}</h1>
      </VisuallyHidden>
      {!wide && (
        <div className={classes.miniWrap} data-on={miniOn || undefined}>
          <UnstyledButton
            className={classes.mini}
            tabIndex={miniOn ? 0 : -1}
            aria-hidden={!miniOn}
            onClick={() => {
              scrollParentOf(slip.current)?.scrollTo({
                top: 0,
                behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
                  ? 'auto'
                  : 'smooth',
              });
            }}
          >
            <span className={classes.miniMonth}>
              {month ? dayjs(`${month}-01`).format('MMMM') : periodLabel}
            </span>
            <MiniFigures summary={summary.data} />
            <IconChevronUp size={20} stroke={1.7} aria-hidden />
            <VisuallyHidden>{t('transactions.totals.backToTop')}</VisuallyHidden>
          </UnstyledButton>
        </div>
      )}
      <TotalsSlip
        ref={slip}
        period={filters.period}
        onPeriod={(period) => {
          set(withPeriod(filters, period));
        }}
        onSettle={settle}
        summary={summary.data}
        summaryError={summary.isError}
        onRetry={() => {
          void summary.refetch();
        }}
        picked={picked}
        swipe={!tablet}
        onAdd={() => {
          // With one account in use picked, the form opens with it, as from its card (F-018)
          const account = accounts.data?.accounts.find((item) => item.id === filters.accountId);
          form.add(account ? { accountId: account.id } : undefined);
        }}
      />
      {!wide && controls}
      <div className={classes.columns} data-one={(!calendar && !bars) || undefined}>
        <FitColumn fit={wide}>
          {calendar}
          {bars}
        </FitColumn>
        <div className={classes.right}>
          {wide && controls}
          {filters.day && month && (
            <div className={classes.dayLine}>
              <p>{t('transactions.list.onlyDay', { day: dayTitle(filters.day) })}</p>
              <UnstyledButton
                className={classes.textLink}
                onClick={() => {
                  set({ ...filters, day: undefined });
                }}
              >
                {t('transactions.list.showAllOf', { month: dayjs(`${month}-01`).format('MMMM') })}
              </UnstyledButton>
            </div>
          )}
          {list}
        </div>
      </div>
    </>
  );
}

function Empty({ title, text, children }: { title: string; text: string; children?: ReactNode }) {
  return (
    <div className={classes.empty}>
      <h2 className={classes.emptyTitle}>{title}</h2>
      <p className={classes.emptyText}>{text}</p>
      {children}
    </div>
  );
}

/** The transaction just saved, while its line is lit; changes made before the page opened light nothing. */
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

/** Below the desktop: whether the big totals have scrolled away, so the slim bar shows. */
function useMiniBar(slip: RefObject<HTMLElement | null>, on: boolean) {
  const [away, setAway] = useState(false);
  useEffect(() => {
    const el = slip.current;
    if (!on || !el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setAway(!!entry && !entry.isIntersecting);
      },
      { root: scrollParentOf(el), rootMargin: '-48px 0px 0px 0px' },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, [slip, on]);
  return on && away;
}

/** The room the fitted column keeps under it and over it once it sticks. */
const COLUMN_GAP_PX = 16;

/**
 * The desktop's left column: sticky, and ending 16 px above the window's bottom at every scroll position, so the whole
 * of "Where it went" is on screen and its list scrolls inside it (variant 8, owner's review).
 */
function FitColumn({ fit, children }: { fit: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!fit) {
      el.style.maxHeight = '';
      return;
    }
    const main = scrollParentOf(el);
    if (!main) return;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = main.getBoundingClientRect();
        const top = Math.max(el.getBoundingClientRect().top, box.top + COLUMN_GAP_PX);
        el.style.maxHeight = `${String(Math.round(box.bottom - top - COLUMN_GAP_PX))}px`;
      });
    };
    measure();
    main.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      cancelAnimationFrame(frame);
      main.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    };
  }, [fit]);

  return (
    <div className={classes.left} ref={ref}>
      {children}
    </div>
  );
}
