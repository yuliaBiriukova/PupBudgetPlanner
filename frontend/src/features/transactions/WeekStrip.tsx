import { ActionIcon, Button, UnstyledButton, VisuallyHidden } from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { useMediaQuery } from '@mantine/hooks';
import { IconCalendar, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DESKTOP_QUERY } from '../../app/shell/sections';
import { cx } from '../../shared/ui/cx';
import { addDays, mondayOf, today, weekFrom, weekTitle } from './days';
import { Picker } from './Picker';
import { KEEP_FORM_OPEN } from './transactionForm';
import classes from './TransactionForm.module.css';

interface WeekStripProps {
  /** The picked day, `YYYY-MM-DD`. */
  value: string;
  onChange: (day: string) => void;
  /** The Monday of the week shown; ‹ › move it. */
  week: string;
  onWeekChange: (monday: string) => void;
}

/**
 * The day (F-018 final prototype): this week's days, Monday first, the picked day filled and today outlined; ‹ › for
 * the weeks before, the calendar for anything else. Nothing after today (owner, 2026-11-01).
 */
export function WeekStrip({ value, onChange, week, onWeekChange }: WeekStripProps) {
  const { t } = useTranslation();
  const headingId = useId();
  const [calendar, setCalendar] = useState(false);
  const now = today();
  const days = weekFrom(week);
  const lastDay = days[6] ?? week;

  return (
    <div className={classes.block}>
      <div className={classes.blockHead}>
        <h3 className={classes.label} id={headingId}>
          <VisuallyHidden>{t('transactions.form.dateLabel')}</VisuallyHidden>
          {weekTitle(week, now) ?? t('transactions.form.thisWeek')}
        </h3>
        <span className={classes.headButtons}>
          <ActionIcon
            variant="subtle"
            color="gray"
            size={44}
            radius="xl"
            className={classes.headButton}
            aria-label={t('transactions.form.weekBefore')}
            onClick={() => {
              onWeekChange(addDays(week, -7));
            }}
          >
            <IconChevronLeft size={20} stroke={1.7} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="gray"
            size={44}
            radius="xl"
            className={classes.headButton}
            aria-label={t('transactions.form.weekAfter')}
            disabled={lastDay >= now}
            onClick={() => {
              onWeekChange(addDays(week, 7));
            }}
          >
            <IconChevronRight size={20} stroke={1.7} />
          </ActionIcon>
          <Picker
            opened={calendar}
            onClose={() => {
              setCalendar(false);
            }}
            title={t('transactions.form.calendar')}
            position="bottom-end"
            width={336}
            flip
            target={
              <ActionIcon
                variant="subtle"
                color="gray"
                size={44}
                radius="xl"
                className={classes.headButton}
                aria-label={t('transactions.form.pickDay')}
                aria-haspopup="dialog"
                aria-expanded={calendar}
                onClick={() => {
                  setCalendar(!calendar);
                }}
              >
                <IconCalendar size={20} stroke={1.7} />
              </ActionIcon>
            }
          >
            <Calendar
              value={value}
              onPick={(day) => {
                onChange(day);
                onWeekChange(mondayOf(day));
                setCalendar(false);
              }}
            />
          </Picker>
        </span>
      </div>
      <div className={classes.week} role="radiogroup" aria-labelledby={headingId}>
        {days.map((day) => {
          const d = dayjs(day);
          return (
            <UnstyledButton
              key={day}
              role="radio"
              className={classes.day}
              aria-checked={day === value}
              aria-label={d.format('dddd, D MMM YYYY')}
              data-today={day === now || undefined}
              disabled={day > now}
              onClick={() => {
                onChange(day);
              }}
            >
              <small aria-hidden="true">{d.format('dd')}</small>
              <b aria-hidden="true">{d.date()}</b>
            </UnstyledButton>
          );
        })}
      </div>
    </div>
  );
}

/** Today and Yesterday, then the month: Mantine's calendar, Monday first, nothing after today. */
function Calendar({ value, onPick }: { value: string; onPick: (day: string) => void }) {
  const { t } = useTranslation();
  const isDesktop = useMediaQuery(DESKTOP_QUERY, false, { getInitialValueInEffect: false });
  const now = today();
  const yesterday = addDays(now, -1);

  return (
    <div className={cx(classes.calendar, !isDesktop && classes.sheetCalendar)}>
      <div className={classes.quickDays}>
        {[
          [now, t('transactions.form.today')],
          [yesterday, t('transactions.form.yesterday')],
        ].map(([day = '', label]) => (
          <Button
            key={day}
            variant="default"
            radius="xl"
            size="md"
            className={classes.quickDay}
            data-picked={day === value || undefined}
            aria-pressed={day === value}
            onClick={() => {
              onPick(day);
            }}
            {...KEEP_FORM_OPEN}
          >
            {label}
          </Button>
        ))}
      </div>
      <DatePicker
        value={value}
        defaultDate={value}
        maxDate={now}
        highlightToday
        size="md"
        onChange={(day) => {
          if (day) onPick(day);
        }}
        classNames={{
          calendarHeader: classes.calendarHeader,
          levelsGroup: classes.calendarFill,
          month: classes.calendarFill,
          day: classes.calendarDay,
        }}
        getDayProps={() => KEEP_FORM_OPEN}
        nextLabel={t('transactions.form.nextMonth')}
        previousLabel={t('transactions.form.previousMonth')}
      />
    </div>
  );
}
