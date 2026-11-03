import { UnstyledButton, VisuallyHidden } from '@mantine/core';
import { IconCalendar, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { useMediaQuery } from '@mantine/hooks';
import dayjs from 'dayjs';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DESKTOP_QUERY } from '../../app/shell/sections';
import { formatMoney } from '../../shared/format/money';
import { foldDayOf, heatOf, monthGrid, shortAmount, weekGrid } from './calendar';
import { mondayOf, today, weekTitle } from './days';
import classes from './TransactionsPage.module.css';
import type { DayTotal } from './transactionsApi';

/** Where the calendar's open or closed is kept on the device (open point 7). */
export const CALENDAR_OPEN_KEY = 'pup.transactions.calendarOpen';

function storedOpen(): boolean | null {
  try {
    const value = localStorage.getItem(CALENDAR_OPEN_KEY);
    return value === null ? null : value === 'true';
  } catch {
    return null;
  }
}

interface SpendingCalendarProps {
  /** `2026-10`. */
  month: string;
  /** The month's days with transactions; empty while they load. */
  days: DayTotal[];
  currency: string;
  /** The day tapped: only its receipt shows. */
  picked?: string;
  onPick: (day: string | undefined) => void;
  /** At first open on the desktop (its own column), closed on the phone. */
  openAtFirst: boolean;
}

/**
 * The month as a calendar that folds (F-020, variant 8): each day as deep a red as what it cost, the amount in it,
 * a green dot on a day with income. Closed it shows one week (this week, or the picked day's); open, the whole month.
 * A tap on a day shows only that day's receipt, a tap on it again shows the month. The device remembers open or
 * closed.
 */
export function SpendingCalendar({
  month,
  days,
  currency,
  picked,
  onPick,
  openAtFirst,
}: SpendingCalendarProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const bodyId = useId();
  const [kept, setKept] = useState(storedOpen);
  const open = kept ?? openAtFirst;
  const wide = useMediaQuery(DESKTOP_QUERY, false, { getInitialValueInEffect: false });
  const now = today();

  const byDay = new Map(days.map((day) => [day.date, day]));
  const heat = heatOf(new Map(days.map((day) => [day.date, day.spent])));
  const monday = mondayOf(
    foldDayOf(
      month,
      picked,
      days.filter((day) => day.count > 0).map((day) => day.date),
      now,
    ),
  );
  const grid = open ? { ...monthGrid(month), tail: 0 } : weekGrid(month, monday);
  const sub = open ? null : (weekTitle(monday, now) ?? t('transactions.calendar.thisWeek'));
  const monthName = dayjs(`${month}-01`).format('MMMM');

  const toggle = () => {
    setKept(!open);
    try {
      localStorage.setItem(CALENDAR_OPEN_KEY, String(!open));
    } catch {
      // A private window: it just isn't remembered
    }
  };

  const label = (day: string, total?: DayTotal) => {
    const name = dayjs(day).format('dddd D MMMM');
    if (day > now) return name;
    const parts = [
      total?.spent
        ? t('transactions.calendar.spentOn', { amount: formatMoney(total.spent, currency) })
        : null,
      total?.received
        ? t('transactions.calendar.receivedOn', { amount: formatMoney(total.received, currency) })
        : null,
      total?.transfers ? t('transactions.calendar.transfersOn', { count: total.transfers }) : null,
    ].filter(Boolean);
    return `${name}: ${parts.length ? parts.join(', ') : t('transactions.calendar.nothingSpent')}`;
  };

  const weekdays = [1, 2, 3, 4, 5, 6, 0].map(
    (d) =>
      dayjs()
        .day(d)
        .format(wide ? 'ddd' : 'dd')[0],
  );
  const weekdayNames = [1, 2, 3, 4, 5, 6, 0].map((d) => dayjs().day(d).format('ddd'));

  return (
    <section className={classes.fold} aria-labelledby={titleId}>
      <UnstyledButton
        className={classes.foldHead}
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={toggle}
      >
        <span className={classes.foldTitle} id={titleId}>
          <IconCalendar size={20} stroke={1.7} aria-hidden />
          <span>{t('transactions.calendar.title')}</span>
          {sub && <span className={classes.foldSub}>{sub}</span>}
        </span>
        <VisuallyHidden>
          {t(open ? 'transactions.calendar.showWeek' : 'transactions.calendar.showMonth')}
        </VisuallyHidden>
        {open ? (
          <IconChevronUp size={20} stroke={1.7} aria-hidden />
        ) : (
          <IconChevronDown size={20} stroke={1.7} aria-hidden />
        )}
      </UnstyledButton>
      <div id={bodyId} className={classes.calendar}>
        <section
          aria-label={
            open
              ? t('transactions.calendar.daysOfMonth', { month: monthName })
              : t('transactions.calendar.daysOfWeek')
          }
        >
          <div className={classes.weekdays} aria-hidden="true">
            {(wide ? weekdayNames : weekdays).map((name, i) => (
              <span key={i}>{name}</span>
            ))}
          </div>
          <div className={classes.grid}>
            {Array.from({ length: grid.lead }, (_, i) => (
              <span key={`lead${String(i)}`} aria-hidden="true" />
            ))}
            {grid.days.map((day) => {
              const total = byDay.get(day);
              const after = day > now;
              return (
                <UnstyledButton
                  key={day}
                  className={classes.cell}
                  data-heat={heat(total?.spent ?? 0)}
                  data-today={day === now || undefined}
                  disabled={after}
                  aria-pressed={day === picked}
                  onClick={() => {
                    onPick(day === picked ? undefined : day);
                  }}
                >
                  <VisuallyHidden>{label(day, total)}</VisuallyHidden>
                  <span className={classes.cellTop} aria-hidden="true">
                    <span className={classes.dayNumber}>{dayjs(day).date()}</span>
                    {total && (total.received > 0 || total.transfers > 0) && (
                      <span className={classes.dots}>
                        {total.received > 0 && <span className={classes.incomeDot} />}
                        {total.transfers > 0 && <span className={classes.transferDot} />}
                      </span>
                    )}
                  </span>
                  <span className={classes.cellAmount} aria-hidden="true">
                    {total && total.spent > 0 ? shortAmount(total.spent) : ''}
                  </span>
                </UnstyledButton>
              );
            })}
            {Array.from({ length: grid.tail }, (_, i) => (
              <span key={`tail${String(i)}`} aria-hidden="true" />
            ))}
          </div>
          {open && (
            <div className={classes.legend} aria-hidden="true">
              <span>{t('transactions.calendar.less')}</span>
              {[1, 2, 3, 4].map((level) => (
                <i key={level} data-heat={level} />
              ))}
              <span className={classes.legendMore}>{t('transactions.calendar.more')}</span>
              <span className={classes.legendIncome}>{t('transactions.calendar.income')}</span>
              <span className={classes.legendTransfer}>{t('transactions.calendar.transfer')}</span>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
