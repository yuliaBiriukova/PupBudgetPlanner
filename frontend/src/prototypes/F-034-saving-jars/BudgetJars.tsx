import { Button, TextInput, UnstyledButton } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPigMoney, IconPlus, IconWand } from '@tabler/icons-react';
import { useId, useState } from 'react';
import { monthName, thisMonth, type MonthLines } from '../../features/budget/budget';
import budget from '../../features/budget/Budget.module.css';
import { Bar } from '../../features/budget/parts';
import { formatMoney, parseAmount } from '../../shared/format/money';
import { cx } from '../../shared/ui/cx';
import pills from '../../shared/ui/Pills.module.css';
import { ResponsiveDialog } from '../../shared/ui/ResponsiveDialog';
import { accountsFor } from './jarHelpers';
import { JarIcon } from './JarParts';
import { JarAccountField, type AccountOption } from './MoveFields';
import {
  monthName as jarMonth,
  MONTH_INCOME,
  savedIn,
  setAsideThisMonth,
  splitByPlan,
  type Jar,
} from './jars';
import classes from './Jars.module.css';
import { useJarWorld } from './worldContext';

const money = (value: number) => formatMoney(value, 'UAH');

/** The month's two kinds of saved money (F-034): what's left of the budgets, and income minus expenses. */
function savedWays(lines: MonthLines) {
  const leftOfBudgets = lines.groups.reduce((sum, g) => sum + Math.max(0, g.left ?? 0), 0);
  return { leftOfBudgets, net: MONTH_INCOME - lines.total.spent };
}

/**
 * The month's jars on the Budget page, a card like a group's: its head what is still to go of everything planned for
 * jars, then a row per jar in the plan (set aside of planned, its bar), + to plan another. A row opens its plan.
 */
export function JarsPlan({
  month,
  total,
  lines,
}: {
  month: string;
  total: number;
  lines: MonthLines;
}) {
  const world = useJarWorld();
  const [open, setOpen] = useState<{ jar?: Jar } | null>(null);
  const planned = world.jars.filter((j) => !j.closed && world.plan[j.id] !== undefined);
  const sum = planned.reduce((s, j) => s + (world.plan[j.id] ?? 0), 0);
  const aside = planned.reduce(
    (s, j) => s + Math.min(world.plan[j.id] ?? 0, setAsideThisMonth(j.id, world.moves)),
    0,
  );
  const unplanned = world.jars.filter(
    (j) => !j.closed && j.currency === 'UAH' && world.plan[j.id] === undefined,
  );

  return (
    <section id="budget-jars" className={budget.group} aria-label="Jars">
      <div className={cx(budget.row, budget.groupHead)}>
        <span className={budget.rowTop}>
          <span className={budget.groupName}>Jars</span>
          <span className={budget.amount}>
            <span className={budget.num}>
              {sum - aside > 0 ? `${money(sum - aside)} to go` : 'All set aside'}
            </span>
          </span>
        </span>
        <Bar spent={aside} budget={sum} thick />
        <span className={budget.rowSub}>
          {money(aside)} of {money(sum)} set aside
        </span>
      </div>
      <div className={budget.groupBody}>
        {planned.map((jar) => {
          const plan = world.plan[jar.id] ?? 0;
          const done = setAsideThisMonth(jar.id, world.moves);
          return (
            <UnstyledButton
              key={jar.id}
              className={budget.row}
              aria-haspopup="dialog"
              onClick={() => {
                setOpen({ jar });
              }}
            >
              <span className={budget.rowTop}>
                <span>{jar.name}</span>
                <span className={budget.amount}>
                  <span className={budget.num}>
                    {plan - done > 0 ? `${money(plan - done)} to go` : 'Set aside'}
                  </span>
                </span>
              </span>
              <Bar spent={Math.min(done, plan)} budget={plan} />
              <span className={budget.rowSub}>
                {money(done)} of {money(plan)} set aside
              </span>
            </UnstyledButton>
          );
        })}
        {unplanned.length > 0 && (
          <UnstyledButton
            className={budget.more}
            aria-haspopup="dialog"
            onClick={() => {
              setOpen({});
            }}
          >
            <IconPlus size={16} stroke={1.7} aria-hidden />
            Plan a jar for {monthName(month).split(' ')[0]}
          </UnstyledButton>
        )}
        <SavedCard month={month} lines={lines} />
      </div>
      {open && (
        <PlanJarDialog
          key={open.jar?.id ?? 'new'}
          jar={open.jar}
          choices={unplanned}
          month={month}
          room={total - lines.planned - sum + (open.jar ? (world.plan[open.jar.id] ?? 0) : 0)}
          total={total}
          onClose={() => {
            setOpen(null);
          }}
        />
      )}
    </section>
  );
}

/**
 * A jar's line in the month's plan: how much to set aside this month. With a goal and a date the pace is offered.
 * The groups' budgets and the jars may not be bigger than the month's total (Q-015): Save is blocked with a red line.
 */
function PlanJarDialog({
  jar,
  choices,
  month,
  room,
  total,
  onClose,
}: {
  jar?: Jar;
  choices: Jar[];
  month: string;
  room: number;
  total: number;
  onClose: () => void;
}) {
  const world = useJarWorld();
  const [pickedId, setPickedId] = useState(jar?.id ?? choices[0]?.id);
  const picked = jar ?? choices.find((j) => j.id === pickedId);
  const [text, setText] = useState(jar ? String(world.plan[jar.id] ?? '') : '');
  const [tried, setTried] = useState(false);
  const choicesId = useId();
  const amount = parseAmount(text);
  const over = amount !== null && amount > room;
  const name = monthName(month).split(' ')[0] ?? '';
  if (!picked) return null;
  const saved = savedIn(picked, world.moves);
  const pace =
    picked.goal !== null && picked.by !== null
      ? Math.ceil(
          Math.max(0, picked.goal - saved) /
            Math.max(
              1,
              (Number(picked.by.slice(0, 4)) - Number(month.slice(0, 4))) * 12 +
                Number(picked.by.slice(5)) -
                Number(month.slice(5)) +
                1,
            ),
        )
      : null;

  const save = () => {
    setTried(true);
    if (amount === null || amount <= 0 || over) return;
    world.setPlan(picked.id, amount);
    notifications.show({ message: `${picked.name}: ${money(amount)} in ${name}'s plan` });
    onClose();
  };

  return (
    <ResponsiveDialog
      opened
      onClose={onClose}
      title={jar ? `${jar.name} in ${name}'s plan` : `Plan a jar for ${name}`}
      footer={
        <div className={classes.footer}>
          {jar ? (
            <Button
              variant="quiet"
              onClick={() => {
                world.setPlan(jar.id, null);
                notifications.show({ message: `${jar.name} taken out of ${name}'s plan` });
                onClose();
              }}
            >
              Remove from plan
            </Button>
          ) : (
            <Button variant="quiet" onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button onClick={save}>Save</Button>
        </div>
      }
    >
      <div className={classes.form}>
        {!jar && (
          <div>
            <p id={choicesId} className={classes.fieldLabel}>
              Jar
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
          label={`To set aside in ${name}`}
          value={text}
          onChange={(event) => {
            setText(event.currentTarget.value);
          }}
          inputMode="numeric"
          rightSection="₴"
          error={
            tried && (amount === null || amount <= 0)
              ? 'Enter an amount like 5000.'
              : (tried || over) && over
                ? `${money(amount - room)} over ${name}'s total of ${money(total)}: the groups' budgets and the jars may not be more than it.`
                : undefined
          }
          data-autofocus
        />
        {pace !== null && pace > 0 && (
          <Button
            variant="quiet"
            leftSection={<IconWand size={16} stroke={1.7} />}
            style={{ alignSelf: 'flex-start' }}
            onClick={() => {
              setText(String(pace));
            }}
          >
            {money(pace)} a month makes it by {jarMonth(picked.by ?? '')}
          </Button>
        )}
        <ul className={budget.facts}>
          <li>
            Set aside this month:{' '}
            <strong>{money(setAsideThisMonth(picked.id, world.moves))}</strong>
          </li>
          <li>
            Room left in {name}'s total: <strong>{money(Math.max(0, room))}</strong>
          </li>
        </ul>
      </div>
    </ResponsiveDialog>
  );
}

/**
 * Saved money (F-034), at the end of the jars' card (owner, 2026-11-17: in the month's column it left too little room
 * for the spending outside the plan): the month's two ways of counting it side by side and Put into jars. A month that is over says
 * what was saved (this is also what the reminder on the 1st offers); this month says what is saved so far.
 */
function SavedCard({ month, lines }: { month: string; lines: MonthLines }) {
  const [open, setOpen] = useState(false);
  const { leftOfBudgets, net } = savedWays(lines);
  const name = monthName(month).split(' ')[0] ?? '';
  const over = month < thisMonth();
  return (
    <section className={classes.saved} aria-label="Saved money">
      <h2 className={classes.savedTitle}>{over ? `${name} is over` : `Saved in ${name} so far`}</h2>
      <p className={classes.savedText}>
        {over
          ? 'Put what was saved into jars, or keep it free to spend.'
          : 'Put some of it into jars now, or wait for the month to end.'}
      </p>
      <div className={classes.savedWays}>
        <div className={classes.savedWay}>
          <strong className={classes.num}>{money(leftOfBudgets)}</strong>
          <span>left of the budgets</span>
        </div>
        <div className={classes.savedWay}>
          <strong className={classes.num}>{money(net)}</strong>
          <span>income minus expenses</span>
        </div>
      </div>
      <Button
        className={classes.savedButton}
        leftSection={<IconPigMoney size={20} stroke={1.7} />}
        onClick={() => {
          setOpen(true);
        }}
      >
        Put into jars
      </Button>
      {open && (
        <SplitDialog
          month={month}
          ways={{ leftOfBudgets, net }}
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
 * stays free. Together the amounts may not be more than the saved money.
 */
function SplitDialog({
  month,
  ways,
  onClose,
}: {
  month: string;
  ways: { leftOfBudgets: number; net: number };
  onClose: () => void;
}) {
  const world = useJarWorld();
  const [way, setWay] = useState<'left' | 'net'>('left');
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [from, setFrom] = useState<Record<string, string>>({});
  const [tried, setTried] = useState(false);
  const waysId = useId();
  const name = monthName(month).split(' ')[0] ?? '';
  const saved = way === 'left' ? ways.leftOfBudgets : ways.net;
  // The planned jars first, in the plan's order; then the others in hryvnias
  const jars = [
    ...Object.keys(world.plan).flatMap((id) => world.jars.filter((j) => j.id === id && !j.closed)),
    ...world.jars.filter(
      (j) => !j.closed && j.currency === 'UAH' && world.plan[j.id] === undefined,
    ),
  ];
  const amounts = Object.fromEntries(jars.map((j) => [j.id, parseAmount(texts[j.id] ?? '') ?? 0]));
  const given = Object.values(amounts).reduce((s, a) => s + a, 0);
  const tooMuch = given > saved;

  const fill = () => {
    const split = splitByPlan(saved, world.plan, world.moves);
    setTexts(Object.fromEntries(jars.map((j) => [j.id, split[j.id] ? String(split[j.id]) : ''])));
  };
  const save = () => {
    setTried(true);
    if (tooMuch || given <= 0) return;
    for (const jar of jars) {
      const amount = amounts[jar.id] ?? 0;
      if (amount <= 0) continue;
      const account = from[jar.id] ?? accountsFor(jar, world.moves)[0]?.account.id;
      if (account) world.move(jar.id, account, amount, `${name}'s saved money`);
    }
    notifications.show({
      message: `${money(given)} put into jars, ${money(saved - given)} stays free`,
    });
    onClose();
  };

  return (
    <ResponsiveDialog
      opened
      onClose={onClose}
      title={`${name}'s saved money into jars`}
      size={560}
      footer={
        <div className={classes.form} style={{ gap: 12 }}>
          <div className={classes.splitTotals}>
            <span>
              Into jars{' '}
              <strong className={cx(classes.num, tooMuch && classes.over)}>{money(given)}</strong>
            </span>
            <span>
              Stays free{' '}
              <strong className={classes.num}>{money(Math.max(0, saved - given))}</strong>
            </span>
          </div>
          <div className={classes.footer}>
            <Button variant="quiet" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={save}>
              {given > 0 ? `Put ${money(given)} into jars` : 'Put into jars'}
            </Button>
          </div>
        </div>
      }
    >
      <div className={classes.form}>
        <div>
          <p id={waysId} className={classes.fieldLabel}>
            Saved money
          </p>
          <div className={classes.savedWays} role="radiogroup" aria-labelledby={waysId}>
            {(
              [
                ['left', ways.leftOfBudgets, 'left of the budgets'],
                ['net', ways.net, 'income minus expenses'],
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
        </div>
        <Button
          variant="quiet"
          leftSection={<IconWand size={16} stroke={1.7} />}
          style={{ alignSelf: 'flex-start' }}
          onClick={fill}
        >
          Fill by {name}'s plan
        </Button>
        <ul className={classes.splitRows}>
          {jars.map((jar) => {
            const plan = world.plan[jar.id];
            const toGo =
              plan === undefined
                ? null
                : Math.max(0, plan - setAsideThisMonth(jar.id, world.moves));
            const options = accountsFor(jar, world.moves).filter(
              (o) => o.account.currency === jar.currency,
            );
            // The move dialog's account field (owner, 2026-11-27): each account's free money on its right
            const fields: AccountOption[] = options.map(({ account, free }) => ({
              account,
              money: free < 0 ? `Jars short by ${money(-free)}` : `${money(free)} free`,
              short: free < 0,
            }));
            return (
              <li key={jar.id} className={classes.splitRow}>
                <JarIcon jar={jar} />
                <span className={classes.splitName}>
                  <span>{jar.name}</span>
                  <small>
                    {toGo === null
                      ? 'Not in the plan'
                      : toGo > 0
                        ? `${money(toGo)} to go in the plan`
                        : 'Plan done'}
                  </small>
                </span>
                <TextInput
                  aria-label={`Into ${jar.name}`}
                  value={texts[jar.id] ?? ''}
                  placeholder="0"
                  inputMode="numeric"
                  rightSection="₴"
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    setTexts((now) => ({ ...now, [jar.id]: value }));
                  }}
                />
                {fields[0] && (
                  <JarAccountField
                    inline
                    label="From"
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
            {money(given - saved)} more than the {money(saved)} saved: lower an amount.
          </p>
        )}
        <p className={classes.hint}>
          Money put into jars isn't spent: it stays on the account, set aside for the jar. {name}'s
          spending and budgets don't change.
        </p>
      </div>
    </ResponsiveDialog>
  );
}
