import { Button, SegmentedControl, Textarea, TextInput, UnstyledButton } from '@mantine/core';
import { MonthPickerInput } from '@mantine/dates';
import { useMediaQuery } from '@mantine/hooks';
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
import { useQuery } from '@tanstack/react-query';
import { useId, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { DESKTOP_QUERY } from '../../app/shell/sections';
import { formatDate } from '../../shared/format/date';
import {
  currencySign,
  formatMoney,
  formatRate,
  parseAmount,
  wholeAmount,
} from '../../shared/format/money';
import { CurrencyPicker } from '../../shared/ui/CurrencyPicker';
import { cx } from '../../shared/ui/cx';
import pills from '../../shared/ui/Pills.module.css';
import { ResponsiveDialog } from '../../shared/ui/ResponsiveDialog';
import { yourCurrencies } from '../accounts/accountGroups';
import { accountsQuery } from '../accounts/accountsApi';
import { evaluate } from '../transactions/amount';
import { AmountDisplay } from '../transactions/AmountDisplay';
import { today } from '../transactions/days';
import { nbuRate } from '../transactions/exchange';
import { ratesQuery } from '../transactions/transactionsApi';
import {
  accountsFor,
  JAR_COLORS,
  JAR_ICON_NAMES,
  JAR_ICONS,
  jarStyle,
  perMonth,
  progress,
  reached,
  thisMonth,
} from './jars';
import {
  JarRefused,
  jarsQuery,
  useCloseJar,
  useMoveJarMoney,
  useSaveJar,
  type Jar,
  type JarColor,
  type JarHistoryLine,
  type JarIconName,
} from './jarsApi';
import classes from './Jars.module.css';
import { monthLong, monthYear, useGoalText } from './jarTexts';
import { JarAccountField, JarField, type AccountOption } from './MoveFields';

export function JarIcon({ jar, size = 20 }: { jar: Pick<Jar, 'icon' | 'color'>; size?: number }) {
  const Glyph = JAR_ICONS[jar.icon];
  return (
    <span className={classes.icon} style={jarStyle(jar.color)} aria-hidden>
      <Glyph size={size} stroke={1.7} />
    </span>
  );
}

/** The budget's 6 px bar (F-033), in the jar's colour; full once the goal is reached. */
export function JarBar({ jar, fresh }: { jar: Jar; fresh?: boolean }) {
  if (jar.goal === null) return <div className={classes.bar} data-none aria-hidden />;
  return (
    <div
      className={classes.bar}
      data-fresh={fresh ? true : undefined}
      style={
        {
          ...jarStyle(jar.color),
          '--fill': `${String(progress(jar, jar.saved) * 100)}%`,
        } as CSSProperties
      }
      aria-hidden
    >
      <span />
    </div>
  );
}

/** One line of the history in words: where the money came from or went to. */
function useHistoryText() {
  const { t } = useTranslation();
  return (line: JarHistoryLine, jar: Jar) => {
    switch (line.kind) {
      case 'PutIn':
        return line.accountCurrency === jar.currency
          ? t('jars.history.putIn', { account: line.accountName })
          : t('jars.history.putInConverted', {
              account: line.accountName,
              amount: formatMoney(line.accountAmount, line.accountCurrency),
            });
      case 'TakeOut':
        return t('jars.history.takeOut', { account: line.accountName });
      case 'MovedOut':
        return t('jars.history.movedOut', { jar: line.otherJarName ?? '' });
      case 'MovedIn':
        return t('jars.history.movedIn', { jar: line.otherJarName ?? '' });
      default:
        return t('jars.history.saved', { month: line.month ? monthLong(line.month) : '' });
    }
  };
}

/** The jars as they are now, kept fresh by the query. */
function useJar(id: string | undefined): Jar | undefined {
  const jars = useQuery(jarsQuery);
  return id === undefined ? undefined : jars.data?.find((jar) => jar.id === id);
}

/**
 * A jar opened: what is saved, the goal and its bar, the month's pace and plan, the note, where the money lies and its
 * history (folded); Put in and Take out pinned at the bottom, or Take out and Close jar once the goal is reached. The
 * pencil opens its edit form.
 */
export function JarDialog({
  jarId,
  fresh,
  onClose,
  onMove,
  onEdit,
  onCloseJar,
}: {
  jarId: string | undefined;
  fresh?: string;
  onClose: () => void;
  onMove: (jar: Jar, kind: 'in' | 'out') => void;
  onEdit: (jar: Jar) => void;
  /** Asks before the jar is closed. */
  onCloseJar: (jar: Jar) => void;
}) {
  const { t } = useTranslation();
  const goalText = useGoalText();
  const historyText = useHistoryText();
  const [shownId, setShownId] = useState(jarId);
  const [historyOpen, setHistoryOpen] = useState(false);
  if (jarId && jarId !== shownId) {
    setShownId(jarId);
    setHistoryOpen(false);
  }
  const jar = useJar(shownId);
  const whereId = useId();
  const listId = useId();
  if (!jar) return null;
  const pace = perMonth(jar, jar.saved);
  const done = reached(jar, jar.saved);
  const money = (amount: number) => formatMoney(amount, jar.currency);

  return (
    <ResponsiveDialog
      opened={jarId !== undefined}
      onClose={onClose}
      title={jar.name}
      heading={
        <span className={classes.dialogHeading}>
          <JarIcon jar={jar} />
          <span className={classes.dialogName}>{jar.name}</span>
        </span>
      }
      actions={
        <UnstyledButton
          className={classes.iconButton}
          aria-label={t('jars.window.edit', { name: jar.name })}
          onClick={() => {
            onEdit(jar);
          }}
        >
          <IconPencil size={20} stroke={1.7} />
        </UnstyledButton>
      }
      footer={
        <div className={classes.footer}>
          <Button
            variant="quiet"
            leftSection={<IconMinus size={20} stroke={1.7} />}
            disabled={jar.saved <= 0}
            onClick={() => {
              onMove(jar, 'out');
            }}
          >
            {t('jars.window.takeOut')}
          </Button>
          {done ? (
            <Button
              leftSection={<IconCheck size={20} stroke={1.7} />}
              onClick={() => {
                onCloseJar(jar);
              }}
            >
              {t('jars.window.close')}
            </Button>
          ) : (
            <Button
              leftSection={<IconPlus size={20} stroke={1.7} />}
              onClick={() => {
                onMove(jar, 'in');
              }}
            >
              {t('jars.window.putIn')}
            </Button>
          )}
        </div>
      }
    >
      <div className={classes.dialogBody}>
        <div>
          <p className={classes.label}>{t('jars.window.saved')}</p>
          <p className={cx(classes.hero, classes.num)}>{money(jar.saved)}</p>
          <JarBar jar={jar} fresh={fresh === jar.id} />
          <p className={classes.goalLine}>
            <span className={done ? classes.reached : undefined}>
              {done && <IconCheck size={16} stroke={1.7} aria-hidden />}
              {goalText(jar)}
            </span>
            {jar.goal !== null && !done && (
              <span className={classes.num}>
                {t('jars.window.toGo', { amount: money(jar.goal - jar.saved) })}
              </span>
            )}
          </p>
          {pace !== null && jar.by !== null && (
            <p className={classes.pace}>
              {t('jars.window.pace', { amount: money(pace), month: monthYear(jar.by) })}
            </p>
          )}
          {jar.plannedThisMonth !== null && (
            <p className={classes.pace}>
              {t('jars.window.plan', {
                month: monthLong(thisMonth()),
                done: money(jar.setAsideThisMonth),
                planned: money(jar.plannedThisMonth),
              })}
            </p>
          )}
          {jar.note && <p className={classes.note}>{jar.note}</p>}
        </div>

        {jar.places.length > 0 && (
          <section aria-labelledby={whereId}>
            <h3 id={whereId} className={classes.subhead}>
              {t('jars.window.where')}
            </h3>
            <ul className={classes.rows}>
              {jar.places.map((place) => (
                <li key={place.accountId} className={classes.row}>
                  <span className={classes.rowMain}>{place.accountName}</span>
                  <span className={classes.num}>{money(place.amount)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {jar.history.length > 0 && (
          <section>
            <h3 className={classes.foldHeading}>
              <UnstyledButton
                className={classes.fold}
                aria-expanded={historyOpen}
                aria-controls={listId}
                onClick={() => {
                  setHistoryOpen(!historyOpen);
                }}
              >
                <IconHistory size={20} stroke={1.7} aria-hidden />
                <span className={classes.foldTitle}>{t('jars.window.history')}</span>
                <span className={classes.foldCount}>{jar.history.length}</span>
                <IconChevronDown
                  size={20}
                  stroke={1.7}
                  className={classes.foldChevron}
                  aria-hidden
                />
              </UnstyledButton>
            </h3>
            <ul id={listId} className={classes.rows} hidden={!historyOpen}>
              {jar.history.map((line) => (
                <li key={line.id} className={classes.row}>
                  <span className={classes.rowMain}>
                    {historyText(line, jar)}
                    <span className={classes.rowDate}>{formatDate(line.date)}</span>
                  </span>
                  <span className={cx(classes.num, line.amount > 0 ? classes.in : undefined)}>
                    {line.amount > 0 ? '+' : '−'}
                    {money(Math.abs(line.amount))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </ResponsiveDialog>
  );
}

type MoveKind = 'in' | 'out' | 'move';

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
  /** After the money moved: the jar whose bar fills. */
  onDone?: (jarId: string) => void;
}) {
  const { t } = useTranslation();
  const isDesktop = useMediaQuery(DESKTOP_QUERY, false, { getInitialValueInEffect: false });
  const [shown, setShown] = useState(target);
  const [kind, setKind] = useState<MoveKind>(target?.kind ?? 'in');
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
  const accounts = useQuery(accountsQuery);
  const jars = useQuery(jarsQuery);
  const rates = useQuery(ratesQuery(today()));
  const move = useMoveJarMoney();
  const jar = (shown && jars.data?.find((item) => item.id === shown.jar.id)) ?? shown?.jar;
  if (!shown || !jar) return null;
  const money = (amount: number, currency = jar.currency) => formatMoney(amount, currency);
  const dayRates = rates.data?.rates ?? {};

  // Putting in: every account with money, the jar's currency first; taking out or moving: where the jar's money lies
  const own = (accounts.data?.accounts ?? []).filter((account) => account.archivedAt === null);
  const options: (AccountOption & { amount: number })[] =
    kind === 'in'
      ? accountsFor(jar, own, dayRates).map(({ account, free }) => ({
          account,
          amount: free,
          money:
            free < 0
              ? t('jars.move.spent', { amount: money(-free, account.currency) })
              : t('jars.move.free', { amount: money(free, account.currency) }),
          short: free < 0,
        }))
      : jar.places.flatMap((place) => {
          const account = own.find((a) => a.id === place.accountId);
          return account && place.amount > 0
            ? [
                {
                  account,
                  amount: place.amount,
                  money: t('jars.move.inJar', { amount: money(place.amount) }),
                },
              ]
            : [];
        });
  const picked = options.find((o) => o.account.id === accountId) ?? options[0];
  const others = (jars.data ?? []).filter((j) => j.id !== jar.id && j.currency === jar.currency);
  const to = others.find((j) => j.id === toId) ?? others[0];
  // The amount is typed in the account's currency when money comes in from another currency
  const typedIn = kind === 'in' && picked ? picked.account.currency : jar.currency;
  const converting = typedIn !== jar.currency;
  const rate = converting ? nbuRate(typedIn, jar.currency, dayRates) : 1;
  const amount = evaluate(text);
  const intoJar =
    amount === null
      ? null
      : rate === null
        ? null
        : converting
          ? wholeAmount(amount * rate)
          : amount;
  const problem =
    amount === null || amount <= 0
      ? t('jars.move.typeAmount')
      : kind !== 'in' && picked && amount > picked.amount
        ? t('jars.move.onlyOn', { amount: money(picked.amount), account: picked.account.name })
        : converting && rate === null
          ? t('jars.move.noRate')
          : null;
  const warning =
    kind === 'in' && picked && amount !== null && amount > picked.amount
      ? picked.amount <= 0
        ? t('jars.move.noFree', {
            account: picked.account.name,
            amount: money(-picked.amount, typedIn),
          })
        : t('jars.move.someFree', {
            account: picked.account.name,
            amount: money(picked.amount, typedIn),
          })
      : null;

  const save = () => {
    setTried(true);
    if (problem || !picked || amount === null || intoJar === null) return;
    if (kind === 'move' && !to) return;
    move.mutate(
      {
        jarId: jar.id,
        action: kind === 'in' ? 'In' : kind === 'out' ? 'Out' : 'Move',
        accountId: picked.account.id,
        amount,
        toJarId: kind === 'move' ? to?.id : undefined,
      },
      {
        onSuccess: () => {
          notifications.show({
            message:
              kind === 'in'
                ? t('jars.move.doneIn', { amount: money(intoJar), jar: jar.name })
                : kind === 'out'
                  ? t('jars.move.doneOut', { amount: money(amount), jar: jar.name })
                  : t('jars.move.doneMove', {
                      amount: money(amount),
                      from: jar.name,
                      to: to?.name ?? '',
                    }),
          });
          onClose();
          onDone?.(kind === 'move' && to ? to.id : jar.id);
        },
        onError: (error) => {
          notifications.show({
            color: 'red',
            message: error instanceof JarRefused ? error.message : t('jars.move.error'),
          });
        },
      },
    );
  };

  return (
    <ResponsiveDialog
      opened={target !== undefined}
      onClose={onClose}
      size={520}
      title={
        kind === 'in'
          ? t('jars.move.titleIn', { jar: jar.name })
          : kind === 'out'
            ? t('jars.move.titleOut', { jar: jar.name })
            : t('jars.move.titleMove')
      }
      footer={
        <div className={classes.footer}>
          <Button variant="quiet" onClick={onClose}>
            {t('jars.cancel')}
          </Button>
          <Button onClick={save} loading={move.isPending}>
            {kind === 'in'
              ? t('jars.move.saveIn')
              : kind === 'out'
                ? t('jars.move.saveOut')
                : t('jars.move.saveMove')}
            {intoJar !== null && intoJar > 0 ? ` ${money(intoJar)}` : ''}
          </Button>
        </div>
      }
    >
      <div className={classes.form}>
        <SegmentedControl
          aria-label={t('jars.move.kinds')}
          fullWidth
          value={kind}
          onChange={(value) => {
            setKind(value === 'out' ? 'out' : value === 'move' ? 'move' : 'in');
            setAccountId(undefined);
          }}
          data={[
            { value: 'in', label: t('jars.move.kindIn') },
            { value: 'out', label: t('jars.move.kindOut'), disabled: jar.saved <= 0 },
            {
              value: 'move',
              label: t('jars.move.kindMove'),
              disabled: jar.saved <= 0 || others.length === 0,
            },
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
          {converting && rate !== null && intoJar !== null && intoJar > 0 && (
            <p className={classes.rateLine}>
              {t('jars.move.rateLine', { amount: money(intoJar), jar: jar.name })}{' '}
              <span className={classes.num}>{formatRate(typedIn, rate, jar.currency)}</span>
            </p>
          )}
        </AmountDisplay>
        {/* A missing amount only turns the display red, as in the transaction form (F-018); a limit is said */}
        {tried && problem && amount !== null && amount > 0 && (
          <p className={classes.fieldError}>{problem}</p>
        )}
        {picked && (
          <JarAccountField
            label={
              kind === 'in'
                ? t('jars.move.from')
                : kind === 'out'
                  ? t('jars.move.backTo')
                  : t('jars.move.moneyOn')
            }
            value={picked}
            options={options}
            onChange={setAccountId}
          />
        )}
        {kind === 'move' && to && (
          <JarField value={to} jars={others} savedOf={(j) => money(j.saved)} onChange={setToId} />
        )}
        {warning && <p className={classes.warning}>{warning}</p>}
        <p className={classes.hint}>
          {kind === 'move'
            ? t('jars.move.hintMove', { account: picked?.account.name ?? '' })
            : t('jars.move.hint', { account: picked?.account.name ?? '' })}
        </p>
      </div>
    </ResponsiveDialog>
  );
}

/**
 * New jar, or a jar edited (its pencil): name, icon and colour, currency (the app's one list), the goal and a month,
 * both optional, and a note. A jar with money in it keeps its currency. Editing, Close jar sits at the end.
 */
export function JarFormDialog({
  jar,
  onClose,
  onCloseJar,
}: {
  /** The jar to edit; none for a new one. */
  jar?: Jar;
  onClose: () => void;
  /** Asks before the jar is closed. */
  onCloseJar?: (jar: Jar) => void;
}) {
  const { t } = useTranslation();
  const accounts = useQuery(accountsQuery);
  const save = useSaveJar();
  const [name, setName] = useState(jar?.name ?? '');
  const [icon, setIcon] = useState<JarIconName>(jar?.icon ?? 'Plane');
  const [color, setColor] = useState<JarColor>(jar?.color ?? 'Blue');
  const [currency, setCurrency] = useState(jar?.currency ?? 'UAH');
  const [goal, setGoal] = useState(jar?.goal == null ? '' : String(jar.goal));
  // The month picked, as its first day (the picker's value); none for a jar without a date
  const [by, setBy] = useState<string | null>(jar?.by ? `${jar.by}-01` : null);
  const [note, setNote] = useState(jar?.note ?? '');
  const [tried, setTried] = useState(false);
  const iconsId = useId();
  const colorsId = useId();
  const hasMoney = jar !== undefined && (jar.saved !== 0 || jar.history.length > 0);
  const goalAmount = parseAmount(goal);
  const goalProblem = goal.trim() !== '' && (goalAmount === null || goalAmount <= 0);

  const submit = () => {
    setTried(true);
    if (!name.trim() || goalProblem) return;
    save.mutate(
      {
        id: jar?.id,
        request: {
          name: name.trim(),
          icon,
          color,
          currency,
          goal: goalAmount,
          by: by ? by.slice(0, 7) : null,
          note: note.trim() || null,
        },
      },
      {
        onSuccess: (saved) => {
          notifications.show({
            message: jar ? t('jars.form.saved') : t('jars.form.added', { name: saved.name }),
          });
          onClose();
        },
        onError: (error) => {
          notifications.show({
            color: 'red',
            message: error instanceof JarRefused ? error.message : t('jars.form.error'),
          });
        },
      },
    );
  };

  return (
    <ResponsiveDialog
      opened
      onClose={onClose}
      title={jar ? t('jars.form.editTitle', { name: jar.name }) : t('jars.form.newTitle')}
      footer={
        <div className={classes.footer}>
          <Button variant="quiet" onClick={onClose}>
            {t('jars.cancel')}
          </Button>
          <Button onClick={submit} loading={save.isPending}>
            {jar ? t('jars.form.save') : t('jars.form.add')}
          </Button>
        </div>
      }
    >
      <div className={classes.form}>
        <TextInput
          label={t('jars.form.name')}
          placeholder={t('jars.form.namePlaceholder')}
          value={name}
          maxLength={40}
          onChange={(event) => {
            setName(event.currentTarget.value);
          }}
          error={tried && !name.trim() ? t('jars.form.nameMissing') : undefined}
          data-autofocus
        />
        <div>
          <p id={iconsId} className={classes.fieldLabel}>
            {t('jars.form.icon')}
          </p>
          <div className={pills.pills} role="radiogroup" aria-labelledby={iconsId}>
            {JAR_ICON_NAMES.map((key) => {
              const Glyph = JAR_ICONS[key];
              return (
                <UnstyledButton
                  key={key}
                  role="radio"
                  aria-checked={icon === key}
                  aria-label={t(`jars.icons.${key}`)}
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
            {t('jars.form.colour')}
          </p>
          <div className={pills.pills} role="radiogroup" aria-labelledby={colorsId}>
            {JAR_COLORS.map((value) => (
              <UnstyledButton
                key={value}
                role="radio"
                aria-checked={color === value}
                aria-label={t(`jars.colours.${value}`)}
                title={t(`jars.colours.${value}`)}
                className={cx(pills.pill, classes.iconPill)}
                style={jarStyle(value)}
                onClick={() => {
                  setColor(value);
                }}
              >
                <span className={classes.swatch} />
              </UnstyledButton>
            ))}
          </div>
        </div>
        {/* The app's one currency list (F-016), as in the account form */}
        <CurrencyPicker
          label={t('jars.form.currency')}
          sheetTitle={t('jars.form.currency')}
          value={currency}
          onChange={setCurrency}
          currencies={accounts.data?.currencies ?? [currency]}
          yours={accounts.data ? yourCurrencies(accounts.data) : []}
          hint={hasMoney ? t('jars.form.currencyFixed') : undefined}
          disabled={hasMoney}
        />
        <div className={classes.twoFields}>
          <TextInput
            label={t('jars.form.goal')}
            value={goal}
            onChange={(event) => {
              setGoal(event.currentTarget.value);
            }}
            inputMode="decimal"
            rightSection={currencySign(currency)}
            error={tried && goalProblem ? t('jars.form.goalWrong') : undefined}
          />
          <MonthPickerInput
            label={t('jars.form.by')}
            placeholder={t('jars.form.byPlaceholder')}
            value={by}
            valueFormat="MMM YYYY"
            minDate={`${thisMonth()}-01`}
            clearable
            onChange={setBy}
            rightSection={by ? undefined : <IconCalendar size={20} stroke={1.7} aria-hidden />}
            rightSectionPointerEvents={by ? undefined : 'none'}
          />
        </div>
        <Textarea
          label={t('jars.form.note')}
          autosize
          minRows={1}
          maxLength={200}
          value={note}
          onChange={(event) => {
            setNote(event.currentTarget.value);
          }}
        />
        {jar && (
          <div className={classes.formEnd}>
            <div>
              <p className={classes.subhead}>{t('jars.form.closeTitle')}</p>
              <p className={classes.hint}>
                {t('jars.form.closeText')}
                {jar.saved > 0 && ` ${t('jars.form.closeFree')}`}
              </p>
            </div>
            <Button
              variant="danger-quiet"
              onClick={() => {
                onCloseJar?.(jar);
              }}
            >
              {t('jars.window.close')}
            </Button>
          </div>
        )}
      </div>
    </ResponsiveDialog>
  );
}

/**
 * Closing a jar asks first (DESIGN_RULES §6): it leaves the list and its money becomes free. Says how much becomes
 * free; "Keep it" is the way out, as in the app's other confirmations.
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
  const { t } = useTranslation();
  const close = useCloseJar();
  const [shown, setShown] = useState(jar);
  if (jar && jar !== shown) setShown(jar);
  if (!shown) return null;
  return (
    <ResponsiveDialog
      opened={jar !== undefined}
      onClose={onClose}
      title={t('jars.close.title', { name: shown.name })}
      footer={
        <div className={classes.footer}>
          <Button variant="quiet" onClick={onClose}>
            {t('jars.close.keep')}
          </Button>
          <Button
            loading={close.isPending}
            onClick={() => {
              close.mutate(shown.id, {
                onSuccess: () => {
                  notifications.show({ message: t('jars.close.done', { name: shown.name }) });
                  onClose();
                  onClosed();
                },
                onError: () => {
                  notifications.show({ color: 'red', message: t('jars.close.error') });
                },
              });
            }}
          >
            {t('jars.window.close')}
          </Button>
        </div>
      }
    >
      <p className={classes.confirmText}>
        {shown.saved > 0
          ? `${t('jars.close.free', { amount: formatMoney(shown.saved, shown.currency) })} `
          : ''}
        {t('jars.close.text')}
      </p>
    </ResponsiveDialog>
  );
}
