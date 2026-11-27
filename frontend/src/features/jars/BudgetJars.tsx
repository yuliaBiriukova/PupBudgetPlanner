import { Button, TextInput, UnstyledButton } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPigMoney, IconPlus, IconWand } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { currencySign, formatMoney, parseAmount } from '../../shared/format/money';
import { cx } from '../../shared/ui/cx';
import pills from '../../shared/ui/Pills.module.css';
import { ResponsiveDialog } from '../../shared/ui/ResponsiveDialog';
import { accountsQuery } from '../accounts/accountsApi';
import {
  budgetText,
  monthName,
  newOverflows,
  parseBudget,
  thisMonth,
  withBudget,
  type MonthLines,
  type Plan,
} from '../budget/budget';
import budget from '../budget/Budget.module.css';
import {
  BudgetRefused,
  useSetBudget,
  type BudgetJar,
  type MonthBudgetData,
} from '../budget/budgetApi';
import { Bar } from '../budget/parts';
import { JarIcon } from './JarParts';
import { monthYear } from './jarTexts';
import { accountsFor, perMonth, splitByPlan } from './jars';
import { JarRefused, jarsQuery, usePutSavedMoney, type Jar, type SavedMoneyWay } from './jarsApi';
import classes from './Jars.module.css';
import { JarAccountField, type AccountOption } from './MoveFields';

/**
 * The month's jars on the Budget page (F-034), a card like a group's after the groups with something planned or spent:
 * its head what is still to go of everything planned for jars, then a row per jar in the plan (set aside of planned,
 * its bar), + to plan another, and the month's saved money at its end. A row opens its plan. Nothing for someone
 * without jars.
 */
export function JarsPlan({
  data,
  lines,
  plan,
}: {
  data: MonthBudgetData;
  lines: MonthLines;
  plan: Plan;
}) {
  const { t } = useTranslation();
  const jars = useQuery(jarsQuery);
  // The split's account fields need the accounts: loaded with the card (for someone with jars), not when it opens
  useQuery({ ...accountsQuery, enabled: (jars.data?.length ?? 0) > 0 });
  const [open, setOpen] = useState<{ jarId?: string } | null>(null);
  const money = (value: number) => formatMoney(value, data.currency);
  const name = monthName(data.month);
  // Only jars in the month's currency can be planned: the plan's amounts are in it
  const unplanned = (jars.data ?? []).filter(
    (jar) => jar.currency === data.currency && !data.jars.some((line) => line.id === jar.id),
  );
  if (data.jars.length === 0 && unplanned.length === 0) return null;
  const sum = lines.jarsPlanned;
  const aside = data.jars.reduce((s, jar) => s + Math.min(jar.planned, jar.setAside), 0);

  return (
    <section id="budget-jars" className={budget.group} aria-label={t('jars.budget.title')}>
      <div className={cx(budget.row, budget.groupHead)}>
        <span className={budget.rowTop}>
          <span className={budget.groupName}>{t('jars.budget.title')}</span>
          {sum > 0 && (
            <span className={budget.amount}>
              <span className={budget.num}>
                {sum - aside > 0
                  ? t('jars.budget.toGo', { amount: money(sum - aside) })
                  : t('jars.budget.allSet')}
              </span>
            </span>
          )}
        </span>
        {sum > 0 && (
          <>
            <Bar spent={aside} budget={sum} thick />
            <span className={budget.rowSub}>
              {t('jars.budget.of', { done: money(aside), planned: money(sum) })}
            </span>
          </>
        )}
      </div>
      <div className={budget.groupBody}>
        {data.jars.map((jar) => (
          <UnstyledButton
            key={jar.id}
            className={budget.row}
            aria-haspopup="dialog"
            data-testid="budget-jar-row"
            onClick={() => {
              setOpen({ jarId: jar.id });
            }}
          >
            <span className={budget.rowTop}>
              <span>{jar.name}</span>
              <span className={budget.amount}>
                <span className={budget.num}>
                  {jar.planned - jar.setAside > 0
                    ? t('jars.budget.toGo', { amount: money(jar.planned - jar.setAside) })
                    : t('jars.budget.done')}
                </span>
              </span>
            </span>
            <Bar spent={Math.min(jar.setAside, jar.planned)} budget={jar.planned} />
            <span className={budget.rowSub}>
              {t('jars.budget.of', { done: money(jar.setAside), planned: money(jar.planned) })}
            </span>
          </UnstyledButton>
        ))}
        {unplanned.length > 0 && (
          <UnstyledButton
            className={budget.more}
            aria-haspopup="dialog"
            onClick={() => {
              setOpen({});
            }}
          >
            <IconPlus size={16} stroke={1.7} aria-hidden />
            {t('jars.budget.planJar', { month: name })}
          </UnstyledButton>
        )}
        <SavedCard data={data} jars={jars.data ?? []} />
      </div>
      {open && (
        <PlanJarDialog
          key={open.jarId ?? 'new'}
          line={data.jars.find((jar) => jar.id === open.jarId)}
          jar={(jars.data ?? []).find((jar) => jar.id === open.jarId)}
          choices={unplanned}
          data={data}
          lines={lines}
          plan={plan}
          onClose={() => {
            setOpen(null);
          }}
        />
      )}
    </section>
  );
}

/**
 * A jar's line in the month's plan: how much to set aside this month. With a goal and a date the pace is offered. The
 * groups' budgets and the jars may not be bigger than the month's total (Q-015): Save is blocked with a red line.
 */
function PlanJarDialog({
  line,
  jar,
  choices,
  data,
  lines,
  plan,
  onClose,
}: {
  /** The jar's line when it is in the plan already. */
  line?: BudgetJar;
  jar?: Jar;
  choices: Jar[];
  data: MonthBudgetData;
  lines: MonthLines;
  plan: Plan;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const save = useSetBudget(data.month);
  const [pickedId, setPickedId] = useState(line?.id ?? choices[0]?.id);
  const picked = line ? jar : choices.find((j) => j.id === pickedId);
  const [text, setText] = useState(budgetText(line?.planned));
  const [tried, setTried] = useState(false);
  const choicesId = useId();
  const money = (value: number) => formatMoney(value, data.currency);
  const name = monthName(data.month);
  const id = line?.id ?? pickedId;
  const amount = parseBudget(text);
  const issues = id ? newOverflows(plan, withBudget(plan, { kind: 'jar', id }, amount), data) : [];
  const total = data.total ?? 0;
  const room = total - lines.planned - lines.jarsPlanned + (line?.planned ?? 0);
  const pace = picked ? perMonth(picked, picked.saved, data.month) : null;
  const setAside = line?.setAside ?? 0;
  const title = line
    ? t('jars.budget.planTitle', { jar: line.name, month: name })
    : t('jars.budget.planJar', { month: name });

  const submit = (value: number | null) => {
    if (!id) return;
    save.mutate(
      { target: { kind: 'jar', id }, amount: value },
      {
        onSuccess: () => {
          notifications.show({
            message:
              value === null
                ? t('jars.budget.removed', { jar: line?.name ?? '', month: name })
                : t('jars.budget.planned', {
                    jar: picked?.name ?? line?.name ?? '',
                    amount: money(value),
                    month: name,
                  }),
          });
          onClose();
        },
        onError: (error) => {
          notifications.show({
            color: 'red',
            message: error instanceof BudgetRefused ? error.message : t('jars.budget.error'),
          });
        },
      },
    );
  };

  return (
    <ResponsiveDialog
      opened
      onClose={onClose}
      title={title}
      footer={
        <div className={classes.footer}>
          {line ? (
            <Button
              variant="quiet"
              loading={save.isPending && save.variables.amount === null}
              onClick={() => {
                submit(null);
              }}
            >
              {t('jars.budget.remove')}
            </Button>
          ) : (
            <Button variant="quiet" onClick={onClose}>
              {t('jars.cancel')}
            </Button>
          )}
          <Button
            loading={save.isPending && save.variables.amount !== null}
            onClick={() => {
              setTried(true);
              if (amount === null || amount <= 0 || issues.length > 0) return;
              submit(amount);
            }}
          >
            {t('jars.budget.save')}
          </Button>
        </div>
      }
    >
      <div className={classes.form}>
        {!line && (
          <div>
            <p id={choicesId} className={classes.fieldLabel}>
              {t('jars.budget.jar')}
            </p>
            <div className={pills.pills} role="radiogroup" aria-labelledby={choicesId}>
              {choices.map((j) => (
                <UnstyledButton
                  key={j.id}
                  role="radio"
                  aria-checked={pickedId === j.id}
                  className={pills.pill}
                  onClick={() => {
                    setPickedId(j.id);
                  }}
                >
                  {j.name}
                </UnstyledButton>
              ))}
            </div>
          </div>
        )}
        <TextInput
          label={t('jars.budget.amountLabel', { month: name })}
          value={text}
          onChange={(event) => {
            setText(budgetText(parseBudget(event.currentTarget.value)));
          }}
          inputMode="numeric"
          rightSection={currencySign(data.currency)}
          error={
            tried && (amount === null || amount <= 0)
              ? t('jars.budget.typeAmount')
              : tried && issues.length > 0 && amount !== null
                ? t('jars.budget.over', {
                    over: money(amount - room),
                    month: name,
                    total: money(total),
                  })
                : undefined
          }
          data-autofocus
        />
        {pace !== null && pace > 0 && picked?.by && (
          <Button
            variant="quiet"
            leftSection={<IconWand size={16} stroke={1.7} />}
            className={classes.startButton}
            onClick={() => {
              setText(budgetText(pace));
            }}
          >
            {t('jars.budget.pace', { amount: money(pace), month: monthYear(picked.by) })}
          </Button>
        )}
        <ul className={budget.facts}>
          <li>
            {t('jars.budget.setAside')} <strong>{money(setAside)}</strong>
          </li>
          {data.total != null && (
            <li>
              {t('jars.budget.room', { month: name })} <strong>{money(Math.max(0, room))}</strong>
            </li>
          )}
        </ul>
      </div>
    </ResponsiveDialog>
  );
}

/**
 * The month's saved money at the end of the Jars card (owner, 2026-11-17): its two ways side by side and Put into jars.
 * A month that is over says what was saved (also what the reminder on the 1st offers); this month what is saved so far.
 */
function SavedCard({ data, jars }: { data: MonthBudgetData; jars: Jar[] }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const money = (value: number) => formatMoney(value, data.currency);
  const name = monthName(data.month);
  const over = data.month < thisMonth();
  const jarsIn = jars.filter((jar) => jar.currency === data.currency);
  return (
    <section className={classes.saved} aria-label={t('jars.saved.label')}>
      <h2 className={classes.savedTitle}>
        {over ? t('jars.saved.overTitle', { month: name }) : t('jars.saved.title', { month: name })}
      </h2>
      <p className={classes.savedText}>{over ? t('jars.saved.overText') : t('jars.saved.text')}</p>
      <div className={classes.savedWays}>
        <div className={classes.savedWay}>
          <strong className={classes.num}>{money(data.saved.leftOfBudgets)}</strong>
          <span>{t('jars.saved.leftOfBudgets')}</span>
        </div>
        <div className={classes.savedWay}>
          <strong className={classes.num}>{money(data.saved.net)}</strong>
          <span>{t('jars.saved.net')}</span>
        </div>
      </div>
      {data.saved.intoJars > 0 && (
        <p className={classes.savedText}>
          {t('jars.saved.already', { amount: money(data.saved.intoJars) })}
        </p>
      )}
      {jarsIn.length > 0 && (
        <Button
          className={classes.savedButton}
          leftSection={<IconPigMoney size={20} stroke={1.7} />}
          onClick={() => {
            setOpen(true);
          }}
        >
          {t('jars.saved.put')}
        </Button>
      )}
      {open && (
        <SplitDialog
          data={data}
          jars={jarsIn}
          onClose={() => {
            setOpen(false);
          }}
        />
      )}
    </section>
  );
}

/**
 * Split the saved money across jars: which amount (left of the budgets, or income minus expenses), then an amount per
 * jar typed or filled by this month's plan, each from an account (the most free money first); what isn't given out
 * stays free. Together the amounts may not be more than the saved money not given out before.
 */
function SplitDialog({
  data,
  jars,
  onClose,
}: {
  data: MonthBudgetData;
  /** The open jars in the month's currency. */
  jars: Jar[];
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const accounts = useQuery(accountsQuery);
  const put = usePutSavedMoney();
  const [way, setWay] = useState<SavedMoneyWay>('LeftOfBudgets');
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [from, setFrom] = useState<Record<string, string>>({});
  const [tried, setTried] = useState(false);
  const waysId = useId();
  const money = (value: number) => formatMoney(value, data.currency);
  const name = monthName(data.month);
  const wayAmount = way === 'Net' ? data.saved.net : data.saved.leftOfBudgets;
  const saved = Math.max(0, wayAmount - data.saved.intoJars);
  // The planned jars first, in the plan's order; then the others
  const planned = data.jars.filter((line) => !line.isClosed);
  const ordered = [
    ...planned.flatMap((line) => jars.filter((jar) => jar.id === line.id)),
    ...jars.filter((jar) => !planned.some((line) => line.id === jar.id)),
  ];
  const amounts = Object.fromEntries(
    ordered.map((jar) => [jar.id, parseAmount(texts[jar.id] ?? '') ?? 0]),
  );
  const given = Object.values(amounts).reduce((s, a) => s + Math.max(0, a), 0);
  const tooMuch = given > saved;
  const own = (accounts.data?.accounts ?? []).filter((account) => account.archivedAt === null);
  const optionsOf = (jar: Jar): AccountOption[] =>
    accountsFor(jar, own)
      .filter((option) => option.account.currency === jar.currency)
      .map(({ account, free }) => ({
        account,
        money:
          free < 0
            ? t('jars.move.spent', { amount: money(-free) })
            : t('jars.move.free', { amount: money(free) }),
        short: free < 0,
      }));

  const fill = () => {
    const split = splitByPlan(saved, planned);
    setTexts(
      Object.fromEntries(
        ordered.map((jar) => [jar.id, split[jar.id] ? String(split[jar.id]) : '']),
      ),
    );
  };
  const submit = () => {
    setTried(true);
    if (tooMuch || given <= 0) return;
    const parts = ordered.flatMap((jar) => {
      const amount = amounts[jar.id] ?? 0;
      const accountId = from[jar.id] ?? optionsOf(jar)[0]?.account.id;
      return amount > 0 && accountId ? [{ jarId: jar.id, accountId, amount }] : [];
    });
    if (parts.length === 0) return;
    put.mutate(
      { month: data.month, way, parts },
      {
        onSuccess: () => {
          notifications.show({
            message: t('jars.split.done', { given: money(given), free: money(saved - given) }),
          });
          onClose();
        },
        onError: (error) => {
          notifications.show({
            color: 'red',
            message: error instanceof JarRefused ? error.message : t('jars.split.error'),
          });
        },
      },
    );
  };

  return (
    <ResponsiveDialog
      opened
      onClose={onClose}
      title={t('jars.split.title', { month: name })}
      size={560}
      footer={
        <div className={cx(classes.form, classes.splitFooter)}>
          <div className={classes.splitTotals}>
            <span>
              {t('jars.split.into')}{' '}
              <strong className={cx(classes.num, tooMuch && classes.over)}>{money(given)}</strong>
            </span>
            <span>
              {t('jars.split.free')}{' '}
              <strong className={classes.num}>{money(Math.max(0, saved - given))}</strong>
            </span>
          </div>
          <div className={classes.footer}>
            <Button variant="quiet" onClick={onClose}>
              {t('jars.cancel')}
            </Button>
            <Button onClick={submit} loading={put.isPending || accounts.isPending}>
              {given > 0
                ? t('jars.split.putAmount', { amount: money(given) })
                : t('jars.saved.put')}
            </Button>
          </div>
        </div>
      }
    >
      <div className={classes.form}>
        <div>
          <p id={waysId} className={classes.fieldLabel}>
            {t('jars.split.way')}
          </p>
          <div className={classes.savedWays} role="radiogroup" aria-labelledby={waysId}>
            {(
              [
                ['LeftOfBudgets', data.saved.leftOfBudgets, t('jars.saved.leftOfBudgets')],
                ['Net', data.saved.net, t('jars.saved.net')],
              ] as const
            ).map(([value, amount, label]) => (
              <UnstyledButton
                key={value}
                role="radio"
                aria-checked={way === value}
                className={cx(pills.pill, classes.wayPill)}
                onClick={() => {
                  setWay(value);
                }}
              >
                <span className={cx(classes.wayAmount, classes.num)}>{money(amount)}</span>
                <span className={classes.pillCaption}>{label}</span>
              </UnstyledButton>
            ))}
          </div>
          {data.saved.intoJars > 0 && (
            <p className={classes.hint}>
              {t('jars.saved.already', { amount: money(data.saved.intoJars) })}
            </p>
          )}
        </div>
        {planned.length > 0 && (
          <Button
            variant="quiet"
            leftSection={<IconWand size={16} stroke={1.7} />}
            className={classes.startButton}
            onClick={fill}
          >
            {t('jars.split.fill', { month: name })}
          </Button>
        )}
        <ul className={classes.splitRows}>
          {ordered.map((jar) => {
            const line = planned.find((l) => l.id === jar.id);
            const toGo = line ? Math.max(0, line.planned - line.setAside) : null;
            const fields = optionsOf(jar);
            return (
              <li key={jar.id} className={classes.splitRow}>
                <JarIcon jar={jar} />
                <span className={classes.splitName}>
                  <span>{jar.name}</span>
                  <small>
                    {toGo === null
                      ? t('jars.split.notPlanned')
                      : toGo > 0
                        ? t('jars.split.toGo', { amount: money(toGo) })
                        : t('jars.split.planDone')}
                  </small>
                </span>
                <TextInput
                  aria-label={t('jars.split.intoJar', { jar: jar.name })}
                  value={texts[jar.id] ?? ''}
                  placeholder="0"
                  inputMode="numeric"
                  rightSection={currencySign(data.currency)}
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    setTexts((now) => ({ ...now, [jar.id]: value }));
                  }}
                />
                {/* Only once an amount is typed (owner, 2026-11-27) */}
                {(amounts[jar.id] ?? 0) > 0 && fields[0] && (
                  <JarAccountField
                    inline
                    label={t('jars.move.from')}
                    value={fields.find((f) => f.account.id === from[jar.id]) ?? fields[0]}
                    options={fields}
                    onChange={(id) => {
                      setFrom((now) => ({ ...now, [jar.id]: id }));
                    }}
                  />
                )}
              </li>
            );
          })}
        </ul>
        {tried && tooMuch && (
          <p className={classes.warning}>
            {t('jars.split.tooMuch', { over: money(given - saved), saved: money(saved) })}
          </p>
        )}
        <p className={classes.hint}>{t('jars.split.hint', { month: name })}</p>
      </div>
    </ResponsiveDialog>
  );
}
