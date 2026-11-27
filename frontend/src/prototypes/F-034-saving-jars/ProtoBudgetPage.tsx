import { Button, Skeleton, UnstyledButton } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconPlus, IconRefresh, IconTrash } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import tx from '../../features/transactions/TransactionsPage.module.css';
import { cx } from '../../shared/ui/cx';
import { FitColumn } from '../../shared/ui/FitColumn';
import {
  linesOf,
  moneyIn,
  monthName,
  planOf,
  thisMonth,
  type GroupLine,
  type Line,
} from '../../features/budget/budget';
import {
  monthBudgetQuery,
  useStartMonth,
  type BudgetTarget,
  type MonthBudgetData,
} from '../../features/budget/budgetApi';
import classes from '../../features/budget/Budget.module.css';
import {
  DeletePlanDialog,
  EditBudgetDialog,
  NewBudgetDialog,
} from '../../features/budget/BudgetDialogs';
import { Bar } from '../../features/budget/parts';
import { OutsidePlan, PlanSplit } from '../../features/budget/MonthColumn';
import { SlipWithBar } from '../../features/budget/BudgetSlip';
import { useBudgetMonth } from '../../features/budget/useBudgetMonth';
import { ReminderCard } from '../../features/budget/Reminder';
import { JarsPlan } from './BudgetJars';

/** The desktop's two columns (Budget.module.css, 64em): the month on the left, the groups on the right. */
const WIDE_QUERY = '(min-width: 64em)';

/** What a dialog is open for: one budget, or a new one in a group. */
type Open = BudgetTarget | { kind: 'new'; groupId: string; categoryId?: string };

/**
 * F-034 prototype: a copy of features/budget/BudgetPage.tsx with the month's jars after the groups that have
 * something planned or spent; the saved money is at the end of the jars' card, so the month's column stays as it is.
 *
 * The Budget page (F-033, final prototype): what's left of the month big with its bar, the groups and categories with
 * their budgets, spent and left, each line opening its own dialog; a month not planned offers to start from the last
 * planned one. Past months can be opened and changed; next month is the furthest it goes.
 */
export function ProtoBudgetPage() {
  const { t } = useTranslation();
  const [month, setMonth] = useBudgetMonth();
  const query = useQuery(monthBudgetQuery(month));

  return (
    <div className={classes.page}>
      {/* Every state has the slip (owner's review of PR #115); a planned month's is in PlannedMonth, with Change total */}
      {!query.data?.planned && (
        <SlipWithBar
          month={month}
          lines={query.data && linesOf(query.data)}
          loading={query.isPending}
          ratesMissing={query.data?.ratesMissing ?? false}
          onMonth={setMonth}
        />
      )}
      {query.isPending ? (
        <div
          className={classes.columns}
          role="status"
          aria-busy="true"
          aria-label={t('budget.loading')}
        >
          <div className={classes.groups}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} height={64} radius="md" />
            ))}
          </div>
        </div>
      ) : query.isError ? (
        <div className={tx.errorBanner} role="alert">
          <IconAlertCircle size={20} stroke={1.7} aria-hidden />
          <div>
            <p>{t('budget.error')}</p>
            <UnstyledButton
              className={tx.textLink}
              onClick={() => {
                void query.refetch();
              }}
            >
              <IconRefresh size={20} stroke={1.7} aria-hidden />
              {t('budget.retry')}
            </UnstyledButton>
          </div>
        </div>
      ) : query.data.planned ? (
        <PlannedMonth data={query.data} onMonth={setMonth} />
      ) : (
        <NotPlanned data={query.data} />
      )}
    </div>
  );
}

/** A month never planned: start from the last planned one, or empty. */
function NotPlanned({ data }: { data: MonthBudgetData }) {
  const { t } = useTranslation();
  const start = useStartMonth();
  const name = monthName(data.month);
  const from = data.startFrom && monthName(data.startFrom);
  const startWith = (copyLast: boolean) => {
    start.mutate(
      { month: data.month, copyLast },
      {
        onSuccess: () => {
          if (from)
            notifications.show({ message: t('budget.empty.started', { month: name, from }) });
        },
        onError: () => notifications.show({ color: 'red', message: t('budget.empty.error') }),
      },
    );
  };
  return (
    <div className={classes.empty}>
      <h2 className={classes.emptyTitle}>{t('budget.empty.title', { month: name })}</h2>
      <p className={classes.emptyText}>
        {from ? t('budget.empty.textFrom', { from }) : t('budget.empty.text')}
      </p>
      <div className={classes.emptyButtons}>
        {from && (
          <Button
            loading={start.isPending && start.variables.copyLast}
            onClick={() => {
              startWith(true);
            }}
          >
            {t('budget.empty.startFrom', { from })}
          </Button>
        )}
        <Button
          variant={from ? 'quiet' : 'filled'}
          loading={start.isPending && !start.variables.copyLast}
          onClick={() => {
            startWith(false);
          }}
        >
          {t('budget.empty.startEmpty')}
        </Button>
      </div>
    </div>
  );
}

function PlannedMonth({
  data,
  onMonth,
}: {
  data: MonthBudgetData;
  onMonth: (month: string) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState<Open | null>(null);
  const [deleting, setDeleting] = useState(false);
  const lines = linesOf(data);
  const plan = planOf(data);
  // Every group open (owner's second review of PR #115: no accordions); those with nothing planned or spent last
  const quiet = (g: GroupLine) => g.budget == null && g.spent === 0;
  const groups = [
    ...lines.groups.filter((g) => !quiet(g)),
    ...lines.groups.filter((g) => quiet(g)),
  ];
  const isThisMonth = data.month === thisMonth();
  const wide = useMediaQuery(WIDE_QUERY, false, { getInitialValueInEffect: false });
  const close = () => {
    setOpen(null);
  };
  const panels = (
    <>
      <PlanSplit lines={lines} />
      <OutsidePlan
        lines={lines}
        onNew={(groupId, categoryId) => {
          setOpen({ kind: 'new', groupId, categoryId });
        }}
      />
    </>
  );
  const deleteButton = (
    <UnstyledButton
      className={classes.more}
      aria-haspopup="dialog"
      onClick={() => {
        setDeleting(true);
      }}
    >
      <IconTrash size={16} stroke={1.7} aria-hidden />
      {t('budget.deletePlan.action', { month: monthName(data.month) })}
    </UnstyledButton>
  );

  return (
    <>
      <SlipWithBar
        month={data.month}
        lines={lines}
        ratesMissing={data.ratesMissing}
        onMonth={onMonth}
        onEditTotal={() => {
          setOpen({ kind: 'total' });
        }}
      />
      <div className={classes.columns}>
        {/* The desktop: the month's column sticks under the slim bar and fits the window, as Transactions' (FitColumn);
          only the spending outside the plan scrolls in it, as Transactions' "Where it went" (owner's review of PR #115) */}
        {wide && (
          <FitColumn fit className={classes.left}>
            {panels}
            <div className={classes.wideOnly}>
              {isThisMonth && <ReminderCard />}
              {deleteButton}
            </div>
          </FitColumn>
        )}
        <div className={classes.groups}>
          {groups
            .filter((g) => !quiet(g))
            .map((group) => (
              <Group key={group.id} group={group} currency={data.currency} onOpen={setOpen} />
            ))}
          <JarsPlan month={data.month} total={data.total ?? 0} lines={lines} />
          {groups.filter(quiet).map((group) => (
            <Group key={group.id} group={group} currency={data.currency} onOpen={setOpen} />
          ))}
          {/* The phone and tablet: after the groups, so it doesn't push them down */}
          {/* The two panels after the groups on the phone and tablet too (owner's review of PR #115) */}
          {!wide && (
            <div className={classes.narrowOnly}>
              {panels}
              {isThisMonth && <ReminderCard />}
              {deleteButton}
            </div>
          )}
        </div>
        <DeletePlanDialog
          month={data.month}
          opened={deleting}
          onClose={() => {
            setDeleting(false);
          }}
        />
        {open?.kind === 'new' && (
          <NewBudgetDialog
            key={`${open.groupId}-${open.categoryId ?? ''}`}
            groupId={open.groupId}
            categoryId={open.categoryId}
            data={data}
            lines={lines}
            plan={plan}
            onClose={close}
          />
        )}
        {open && open.kind !== 'new' && (
          <EditBudgetDialog
            key={JSON.stringify(open)}
            target={open}
            data={data}
            lines={lines}
            plan={plan}
            onClose={close}
          />
        )}
      </div>
    </>
  );
}

/**
 * A group (owner's reviews of PR #115): a card whose head is a line like a category's (left or over, a bar, "… of …")
 * but bigger, opening the group's dialog; then its categories with a budget, and + to add one more. A category without
 * a budget isn't listed: it comes in with + and goes out with Remove budget. Groups don't fold.
 */
function Group({
  group,
  currency,
  onOpen,
}: {
  group: GroupLine;
  currency: string;
  onOpen: (open: Open) => void;
}) {
  const { t } = useTranslation();
  const rows = group.categories.filter((c) => c.budget != null);
  const withoutBudget = group.categories.some((c) => c.budget == null);
  return (
    <section className={classes.group} aria-label={group.name} id={`budget-group-${group.id}`}>
      <LineButton
        line={group}
        currency={currency}
        name={<span className={classes.groupName}>{group.name}</span>}
        sumOnly={group.own == null && group.budget != null}
        head
        onClick={() => {
          onOpen({ kind: 'group', id: group.id });
        }}
      />
      {(rows.length > 0 || withoutBudget) && (
        <div className={classes.groupBody}>
          {rows.map((category) => (
            <LineButton
              key={category.id}
              line={category}
              currency={currency}
              name={<span>{category.name}</span>}
              testId="budget-row"
              onClick={() => {
                onOpen({ kind: 'category', id: category.id });
              }}
            />
          ))}
          {withoutBudget && (
            <UnstyledButton
              className={classes.more}
              aria-haspopup="dialog"
              onClick={() => {
                onOpen({ kind: 'new', groupId: group.id });
              }}
            >
              <IconPlus size={16} stroke={1.7} aria-hidden />
              {t(rows.length > 0 ? 'budget.line.another' : 'budget.line.first', {
                group: group.name,
              })}
            </UnstyledButton>
          )}
        </div>
      )}
    </section>
  );
}

/** One budget's line: its name and left (or over), its bar, and "… of …" (or no budget). */
function LineButton({
  line,
  currency,
  name,
  sumOnly,
  head,
  testId,
  onClick,
}: {
  line: Line;
  currency: string;
  name: ReactNode;
  sumOnly?: boolean;
  /** A group's head: bigger, its bar thick. */
  head?: boolean;
  testId?: string;
  onClick: () => void;
}) {
  const { t } = useTranslation();
  const money = moneyIn(currency);
  return (
    <UnstyledButton
      className={cx(classes.row, head ? classes.groupHead : '')}
      aria-haspopup="dialog"
      data-testid={testId}
      onClick={onClick}
    >
      <span className={classes.rowTop}>
        {name}
        <Amount line={line} currency={currency} sumOnly={sumOnly} />
      </span>
      <Bar spent={line.spent} budget={line.budget} thick={head} />
      <span className={classes.rowSub}>
        {line.budget != null
          ? t('budget.line.of', { spent: money(line.spent), budget: money(line.budget) })
          : t('budget.line.noBudget')}
      </span>
    </UnstyledButton>
  );
}

/** Left (or over, red) on a line's right; without a budget what it spent, quiet. */
function Amount({ line, currency, sumOnly }: { line: Line; currency: string; sumOnly?: boolean }) {
  const { t } = useTranslation();
  const money = moneyIn(currency);
  if (line.left == null)
    return (
      <span className={cx(classes.amount, classes.dim, classes.num)}>
        {line.spent !== 0
          ? t('budget.amount.spent', { amount: money(line.spent) })
          : t('budget.amount.nothingSpent')}
      </span>
    );
  return (
    <span className={classes.amount}>
      <span className={cx(classes.num, line.left < 0 ? classes.over : '')}>
        {line.left < 0
          ? t('budget.amount.over', { amount: money(-line.left) })
          : t('budget.amount.left', { amount: money(line.left) })}
      </span>
      {sumOnly && <span className={classes.sumNote}>{t('budget.line.sumNote')}</span>}
    </span>
  );
}
