import { Button, SegmentedControl, Textarea, TextInput, UnstyledButton } from '@mantine/core';
import { MonthPickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import {
  IconCalendar,
  IconCheck,
  IconChevronDown,
  IconHistory,
  IconMinus,
  IconPencil,
  IconPlus,
} from '@tabler/icons-react';
import { useId, useState, type CSSProperties } from 'react';
import { formatDate } from '../../shared/format/date';
import { currencySign, formatMoney, formatRate, parseAmount } from '../../shared/format/money';
import { CurrencyPicker } from '../../shared/ui/CurrencyPicker';
import { cx } from '../../shared/ui/cx';
import pills from '../../shared/ui/Pills.module.css';
import { ResponsiveDialog } from '../../shared/ui/ResponsiveDialog';
import {
  accountOf,
  JAR_COLORS,
  placesOf,
  progress,
  reached,
  savedIn,
  setAsideThisMonth,
  TODAY,
  type Jar,
  type JarColor,
  type JarIconName,
} from './jars';
import {
  accountsFor,
  convert,
  goalText,
  JAR_ICONS,
  jarStyle,
  paceText,
  rateOf,
} from './jarHelpers';
import { JarAccountField, JarField, type AccountOption } from './MoveFields';
import { yourCurrencies } from '../../features/accounts/accountGroups';
import { OVERVIEW } from '../../features/accounts/accountsTestData';
import { AmountDisplay } from '../../features/transactions/AmountDisplay';
import { evaluate } from '../../features/transactions/amount';
import { DESKTOP_QUERY } from '../../app/shell/sections';
import { useMediaQuery } from '@mantine/hooks';
import classes from './Jars.module.css';
import { useJarWorld } from './worldContext';

export function JarIcon({ jar, size = 20 }: { jar: Jar; size?: number }) {
  const Glyph = JAR_ICONS[jar.icon];
  return (
    <span className={classes.icon} style={jarStyle(jar.color)} aria-hidden>
      <Glyph size={size} stroke={1.7} />
    </span>
  );
}

/** The budget's 6 px bar (F-033), in the jar's colour; full and ticked once the goal is reached. */
export function JarBar({ jar, saved, fresh }: { jar: Jar; saved: number; fresh?: boolean }) {
  if (jar.goal === null) return <div className={classes.bar} data-none aria-hidden />;
  return (
    <div
      className={classes.bar}
      data-fresh={fresh ? true : undefined}
      style={
        {
          ...jarStyle(jar.color),
          '--fill': `${String(progress(jar, saved) * 100)}%`,
        } as CSSProperties
      }
      aria-hidden
    >
      <span />
    </div>
  );
}

/**
 * A jar opened: what is saved, the goal and its bar, the month's pace, where the money lies and its history; Put in
 * and Take out pinned at the bottom. A reached goal offers Close jar.
 */
export function JarDialog({
  jar,
  onClose,
  onMove,
  onEdit,
  onCloseJar,
}: {
  jar: Jar | undefined;
  onClose: () => void;
  onMove: (jar: Jar, kind: 'in' | 'out') => void;
  onEdit: (jar: Jar) => void;
  /** Asks before the jar is closed. */
  onCloseJar: (jar: Jar) => void;
}) {
  const world = useJarWorld();
  const [shown, setShown] = useState(jar);
  const [historyOpen, setHistoryOpen] = useState(false);
  if (jar && jar !== shown) {
    setShown(jar);
    setHistoryOpen(false);
  }
  const current = shown && world.jars.find((item) => item.id === shown.id);
  if (!current || current.closed) return null;
  const saved = savedIn(current, world.moves);
  const pace = paceText(current, saved);
  const done = reached(current, saved);
  const history = world.moves
    .filter((m) => m.jarId === current.id)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

  return (
    <ResponsiveDialog
      opened={jar !== undefined}
      onClose={onClose}
      title={current.name}
      heading={
        <span className={classes.dialogHeading}>
          <JarIcon jar={current} />
          <span className={classes.dialogName}>{current.name}</span>
        </span>
      }
      actions={
        <UnstyledButton
          className={classes.iconButton}
          aria-label={`Edit ${current.name}`}
          onClick={() => {
            onEdit(current);
          }}
        >
          <IconPencil size={20} stroke={1.7} />
        </UnstyledButton>
      }
      footer={
        done ? (
          <div className={classes.footer}>
            <Button
              variant="quiet"
              leftSection={<IconMinus size={20} stroke={1.7} />}
              onClick={() => {
                onMove(current, 'out');
              }}
            >
              Take out
            </Button>
            <Button
              leftSection={<IconCheck size={20} stroke={1.7} />}
              onClick={() => {
                onCloseJar(current);
              }}
            >
              Close jar
            </Button>
          </div>
        ) : (
          <div className={classes.footer}>
            <Button
              variant="quiet"
              leftSection={<IconMinus size={20} stroke={1.7} />}
              disabled={saved <= 0}
              onClick={() => {
                onMove(current, 'out');
              }}
            >
              Take out
            </Button>
            <Button
              leftSection={<IconPlus size={20} stroke={1.7} />}
              onClick={() => {
                onMove(current, 'in');
              }}
            >
              Put in
            </Button>
          </div>
        )
      }
    >
      <div className={classes.dialogBody}>
        <div>
          <p className={classes.label}>Saved</p>
          <p className={cx(classes.hero, classes.num)}>{formatMoney(saved, current.currency)}</p>
          <JarBar jar={current} saved={saved} fresh={world.fresh === current.id} />
          <p className={classes.goalLine}>
            <span className={done ? classes.reached : undefined}>
              {done && <IconCheck size={16} stroke={1.7} aria-hidden />}
              {goalText(current, saved)}
            </span>
            {current.goal !== null && !done && (
              <span className={classes.num}>
                {formatMoney(current.goal - saved, current.currency)} to go
              </span>
            )}
          </p>
          {pace && <p className={classes.pace}>{pace}</p>}
          {world.plan[current.id] !== undefined && (
            <p className={classes.pace}>
              November's plan:{' '}
              {formatMoney(setAsideThisMonth(current.id, world.moves), current.currency)} of{' '}
              {formatMoney(world.plan[current.id] ?? 0, current.currency)} set aside
            </p>
          )}
          {current.note && <p className={classes.note}>{current.note}</p>}
        </div>

        <section aria-labelledby="jar-where">
          <h3 id="jar-where" className={classes.subhead}>
            Where it lies
          </h3>
          <ul className={classes.rows}>
            {placesOf(current, world.moves).map(({ account, amount }) => (
              <li key={account.id} className={classes.row}>
                <span className={classes.rowMain}>{account.name}</span>
                <span className={classes.num}>{formatMoney(amount, current.currency)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className={classes.foldHeading}>
            <UnstyledButton
              className={classes.fold}
              aria-expanded={historyOpen}
              aria-controls="jar-history-list"
              onClick={() => {
                setHistoryOpen(!historyOpen);
              }}
            >
              <IconHistory size={20} stroke={1.7} aria-hidden />
              <span className={classes.foldTitle}>History</span>
              <span className={classes.foldCount}>{history.length}</span>
              <IconChevronDown size={20} stroke={1.7} className={classes.foldChevron} aria-hidden />
            </UnstyledButton>
          </h3>
          <ul id="jar-history-list" className={classes.rows} hidden={!historyOpen}>
            {history.map((m) => (
              <li key={m.id} className={classes.row}>
                <span className={classes.rowMain}>
                  {m.note ??
                    `${m.amount > 0 ? 'Put in from' : 'Taken out to'} ${accountOf(m.accountId)?.name ?? ''}`}
                  <span className={classes.rowDate}>{formatDate(m.date)}</span>
                </span>
                <span className={cx(classes.num, m.amount > 0 ? classes.in : undefined)}>
                  {m.amount > 0 ? '+' : '−'}
                  {formatMoney(Math.abs(m.amount), current.currency)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </ResponsiveDialog>
  );
}

/**
 * Put in / Take out / To a jar, with the quick-add form's own fields (owner, 2026-11-17): the calculator display for
 * the amount, the account field and list (each account's free money on its right, the most free first; accounts in
 * other currencies after the jar's own, converted at today's NBU rate), and a jar field the same way.
 */
export function MoveDialog({
  target,
  onClose,
  onDone,
}: {
  target: { jar: Jar; kind: 'in' | 'out' } | undefined;
  onClose: () => void;
  onDone?: () => void;
}) {
  const world = useJarWorld();
  const isDesktop = useMediaQuery(DESKTOP_QUERY, false, { getInitialValueInEffect: false });
  const [shown, setShown] = useState(target);
  const [kind, setKind] = useState<'in' | 'out' | 'move'>(target?.kind ?? 'in');
  const [toId, setToId] = useState<string>();
  const [text, setText] = useState('');
  const [accountId, setAccountId] = useState<string>();
  const [tried, setTried] = useState(false);
  if (target && target !== shown) {
    setShown(target);
    setKind(target.kind);
    setText('');
    setAccountId(undefined);
    setToId(undefined);
    setTried(false);
  }
  if (!shown) return null;
  const jar = shown.jar;
  const saved = savedIn(jar, world.moves);

  // Putting in: every account with money, the jar's currency first; taking out or moving: where the jar's money lies
  const options: (AccountOption & { amount: number })[] =
    kind === 'in'
      ? accountsFor(jar, world.moves).map(({ account, free }) => ({
          account,
          amount: free,
          money:
            free < 0
              ? `Jars short by ${formatMoney(-free, account.currency)}`
              : `${formatMoney(free, account.currency)} free`,
          short: free < 0,
        }))
      : placesOf(jar, world.moves).map(({ account, amount }) => ({
          account,
          amount,
          money: `${formatMoney(amount, jar.currency)} in the jar`,
        }));
  const picked = options.find((o) => o.account.id === accountId) ?? options[0];
  const others = world.jars.filter(
    (j) => !j.closed && j.id !== jar.id && j.currency === jar.currency,
  );
  const to = others.find((j) => j.id === toId) ?? others[0];
  // The amount is typed in the account's currency when money comes in from another currency
  const typedIn = kind === 'in' && picked ? picked.account.currency : jar.currency;
  const converting = typedIn !== jar.currency;
  const amount = evaluate(text);
  const intoJar = amount === null ? null : convert(amount, typedIn, jar.currency);
  const problem =
    amount === null || amount <= 0
      ? 'Enter an amount like 5000.'
      : kind !== 'in' && picked && amount > picked.amount
        ? `Only ${formatMoney(picked.amount, jar.currency)} of the jar lies on ${picked.account.name}.`
        : null;
  const warning =
    kind === 'in' && picked && amount !== null && amount > picked.amount
      ? picked.amount <= 0
        ? `${picked.account.name} has no free money: its jars are already short by ${formatMoney(-picked.amount, typedIn)}.`
        : `${picked.account.name} has ${formatMoney(picked.amount, typedIn)} free: the rest would be money already spent.`
      : null;

  const save = () => {
    setTried(true);
    if (problem || !picked || amount === null || intoJar === null) return;
    if (kind === 'move') {
      if (!to) return;
      world.move(jar.id, picked.account.id, -amount, `Moved to ${to.name}`);
      world.move(to.id, picked.account.id, amount, `Moved from ${jar.name}`);
      notifications.show({
        message: `${formatMoney(amount, jar.currency)} moved from ${jar.name} to ${to.name}`,
      });
    } else if (kind === 'in') {
      world.move(
        jar.id,
        picked.account.id,
        intoJar,
        converting
          ? `Put in from ${picked.account.name}, ${formatMoney(amount, typedIn)}`
          : undefined,
        converting ? amount : undefined,
      );
      notifications.show({ message: `${formatMoney(intoJar, jar.currency)} put into ${jar.name}` });
    } else {
      // Back to an account in another currency: at today's rate
      const back = convert(amount, jar.currency, picked.account.currency);
      world.move(
        jar.id,
        picked.account.id,
        -amount,
        undefined,
        picked.account.currency === jar.currency ? undefined : -back,
      );
      notifications.show({
        message: `${formatMoney(amount, jar.currency)} taken out of ${jar.name}`,
      });
    }
    onClose();
    onDone?.();
  };

  return (
    <ResponsiveDialog
      opened={target !== undefined}
      onClose={onClose}
      size={520}
      title={
        kind === 'in'
          ? `Put into ${jar.name}`
          : kind === 'out'
            ? `Take out of ${jar.name}`
            : `Move from ${jar.name}`
      }
      footer={
        <div className={classes.footer}>
          <Button variant="quiet" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>
            {kind === 'in' ? 'Put in' : kind === 'out' ? 'Take out' : 'Move'}
            {intoJar !== null && intoJar > 0 ? ` ${formatMoney(intoJar, jar.currency)}` : ''}
          </Button>
        </div>
      }
    >
      <div className={classes.form}>
        <SegmentedControl
          aria-label="Put in, take out or move to another jar"
          fullWidth
          value={kind}
          onChange={(value) => {
            setKind(value === 'out' ? 'out' : value === 'move' ? 'move' : 'in');
            setAccountId(undefined);
          }}
          data={[
            { value: 'in', label: 'Put in' },
            { value: 'out', label: 'Take out', disabled: saved <= 0 },
            { value: 'move', label: 'To a jar', disabled: saved <= 0 || others.length === 0 },
          ]}
        />
        <AmountDisplay
          value={text}
          onChange={setText}
          type="Transfer"
          currency={typedIn}
          withKeys={false}
          error={tried && problem ? problem : undefined}
          onEnter={save}
          focusFirst={isDesktop}
        >
          {converting && intoJar !== null && intoJar > 0 && (
            <p className={classes.rateLine}>
              {formatMoney(intoJar, jar.currency)} into {jar.name} at today’s NBU rate,{' '}
              <span className={classes.num}>
                {formatRate(typedIn, rateOf(typedIn, jar.currency), jar.currency)}
              </span>
            </p>
          )}
        </AmountDisplay>
        {/* A missing amount only turns the display red, as in the transaction form (F-018); a limit is said */}
        {tried && problem && amount !== null && amount > 0 && (
          <p className={classes.fieldError}>{problem}</p>
        )}
        {picked && (
          <JarAccountField
            label={kind === 'in' ? 'From' : kind === 'out' ? 'Back to' : 'The money on'}
            value={picked}
            options={options}
            onChange={setAccountId}
          />
        )}
        {kind === 'move' && to && (
          <JarField
            value={to}
            jars={others}
            savedOf={(j) => formatMoney(savedIn(j, world.moves), j.currency)}
            onChange={setToId}
          />
        )}
        {warning && <p className={classes.warning}>{warning}</p>}
        <p className={classes.hint}>
          {kind === 'move'
            ? `The money stays on ${picked?.account.name ?? 'the account'}: only its jar changes.`
            : `The money stays on ${picked?.account.name ?? 'the account'}: its balance doesn’t change, only what of it is free.`}
        </p>
      </div>
    </ResponsiveDialog>
  );
}

/**
 * New jar, or a jar edited (its pencil): name, icon and colour, currency, and the goal and date, both optional, and a
 * note. A jar with money in it keeps its currency. Editing, Close jar sits at the end of the form.
 */
export function NewJarDialog({
  opened,
  onClose,
  jar,
  onCloseJar,
}: {
  opened: boolean;
  onClose: () => void;
  /** The jar to edit; none for a new one. */
  jar?: Jar;
  /** Asks before the jar is closed. */
  onCloseJar?: (jar: Jar) => void;
}) {
  const world = useJarWorld();
  const [name, setName] = useState(jar?.name ?? '');
  const [icon, setIcon] = useState<JarIconName>(jar?.icon ?? 'plane');
  const [color, setColor] = useState<JarColor>(jar?.color ?? 'blue');
  const [currency, setCurrency] = useState(jar?.currency ?? 'UAH');
  const [goal, setGoal] = useState(jar?.goal == null ? '' : String(jar.goal));
  // The month picked, as its first day (the picker's value); none for a jar without a date
  const [by, setBy] = useState<string | null>(jar?.by ? `${jar.by}-01` : null);
  const [note, setNote] = useState(jar?.note ?? '');
  const hasMoney = jar !== undefined && savedIn(jar, world.moves) !== 0;
  const [tried, setTried] = useState(false);
  const iconsId = useId();
  const colorsId = useId();
  const preview: Jar = {
    id: 'new',
    name: name || 'New jar',
    icon,
    color,
    currency,
    goal: parseAmount(goal),
    by: by ? by.slice(0, 7) : null,
    note,
  };

  const save = () => {
    setTried(true);
    if (!name.trim()) return;
    if (jar) {
      world.updateJar({ ...preview, id: jar.id, name: name.trim() });
      notifications.show({ message: 'Jar saved' });
    } else {
      world.addJar({ ...preview, id: `jar-${String(world.jars.length + 1)}`, name: name.trim() });
      notifications.show({ message: `${name.trim()} added` });
    }
    onClose();
  };

  return (
    <ResponsiveDialog
      opened={opened}
      onClose={onClose}
      title={jar ? `Edit ${jar.name}` : 'New jar'}
      footer={
        <div className={classes.footer}>
          <Button variant="quiet" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>{jar ? 'Save' : 'Add jar'}</Button>
        </div>
      }
    >
      <div className={classes.form}>
        <TextInput
          label="Name"
          placeholder="Holiday in Lviv"
          value={name}
          onChange={(event) => {
            setName(event.currentTarget.value);
          }}
          error={tried && !name.trim() ? 'Give the jar a name.' : undefined}
          data-autofocus
        />
        <div>
          <p id={iconsId} className={classes.fieldLabel}>
            Icon
          </p>
          <div className={pills.pills} role="radiogroup" aria-labelledby={iconsId}>
            {(Object.keys(JAR_ICONS) as JarIconName[]).map((key) => {
              const Glyph = JAR_ICONS[key];
              return (
                <UnstyledButton
                  key={key}
                  role="radio"
                  aria-checked={icon === key}
                  aria-label={key}
                  className={cx(pills.pill, classes.iconPill)}
                  onClick={() => {
                    setIcon(key);
                  }}
                >
                  <Glyph size={20} stroke={1.7} />
                </UnstyledButton>
              );
            })}
          </div>
        </div>
        <div>
          <p id={colorsId} className={classes.fieldLabel}>
            Colour
          </p>
          <div className={pills.pills} role="radiogroup" aria-labelledby={colorsId}>
            {JAR_COLORS.map((c) => (
              <UnstyledButton
                key={c.value}
                role="radio"
                aria-checked={color === c.value}
                aria-label={c.name}
                title={c.name}
                className={cx(pills.pill, classes.iconPill)}
                style={jarStyle(c.value)}
                onClick={() => {
                  setColor(c.value);
                }}
              >
                <span className={classes.swatch} />
              </UnstyledButton>
            ))}
          </div>
        </div>
        {/* The app's one currency list (F-016), as in the account form */}
        <CurrencyPicker
          label="Currency"
          sheetTitle="Currency"
          value={currency}
          onChange={setCurrency}
          currencies={OVERVIEW.currencies}
          yours={yourCurrencies(OVERVIEW)}
          hint={hasMoney ? 'A jar with money in it keeps its currency.' : undefined}
          disabled={hasMoney}
        />
        <div className={classes.twoFields}>
          <TextInput
            label="Goal (optional)"
            value={goal}
            onChange={(event) => {
              setGoal(event.currentTarget.value);
            }}
            inputMode="decimal"
            rightSection={currencySign(currency)}
          />
          <MonthPickerInput
            label="By (optional)"
            placeholder="Pick a month"
            value={by}
            valueFormat="MMM YYYY"
            minDate={TODAY}
            clearable
            onChange={setBy}
            rightSection={by ? undefined : <IconCalendar size={20} stroke={1.7} aria-hidden />}
            rightSectionPointerEvents={by ? undefined : 'none'}
          />
        </div>
        <Textarea
          label="Note (optional)"
          autosize
          minRows={1}
          value={note}
          onChange={(event) => {
            setNote(event.currentTarget.value);
          }}
        />
        {jar && (
          <div className={classes.formEnd}>
            <div>
              <p className={classes.subhead}>Close jar</p>
              <p className={classes.hint}>
                For a goal that is reached or given up: the jar leaves the list, its history is
                kept.
                {savedIn(jar, world.moves) > 0 && ' Its money becomes free on its accounts.'}
              </p>
            </div>
            <Button
              variant="danger-quiet"
              onClick={() => {
                onCloseJar?.(jar);
              }}
            >
              Close jar
            </Button>
          </div>
        )}
      </div>
    </ResponsiveDialog>
  );
}

/**
 * Closing a jar asks first: it leaves the list and its money becomes free, and the prototype has no way back.
 * Says how much becomes free; "Keep it" is the way out, as in the app's other confirmations.
 */
export function CloseJarDialog({
  jar,
  onClose,
  onClosed,
}: {
  jar: Jar | undefined;
  onClose: () => void;
  /** After the jar is closed: the dialogs it was closed from go too. */
  onClosed: () => void;
}) {
  const world = useJarWorld();
  const [shown, setShown] = useState(jar);
  if (jar && jar !== shown) setShown(jar);
  if (!shown) return null;
  const saved = savedIn(shown, world.moves);
  return (
    <ResponsiveDialog
      opened={jar !== undefined}
      onClose={onClose}
      title={`Close ${shown.name}?`}
      footer={
        <div className={classes.footer}>
          <Button variant="quiet" onClick={onClose}>
            Keep it
          </Button>
          <Button
            onClick={() => {
              world.closeJar(shown.id);
              notifications.show({ message: `${shown.name} closed. Its history is kept.` });
              onClose();
              onClosed();
            }}
          >
            Close jar
          </Button>
        </div>
      }
    >
      <p className={classes.confirmText}>
        {saved > 0
          ? `The ${formatMoney(saved, shown.currency)} in it becomes free to spend on its accounts. `
          : ''}
        The jar leaves the list; its history is kept.
      </p>
    </ResponsiveDialog>
  );
}
