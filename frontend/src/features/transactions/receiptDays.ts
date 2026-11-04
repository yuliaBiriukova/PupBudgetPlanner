import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { dayName, today } from './days';
import type { Transaction } from './transactionsApi';

/** "Today, 29 Oct", "Yesterday, 28 Oct", "Tuesday, 27 Oct", with the year when it isn't this year's. */
export function useDayTitle() {
  const { t } = useTranslation();
  return (day: string) => {
    const now = today();
    const d = dayjs(day);
    const date = d.format(d.year() === dayjs(now).year() ? 'D MMM' : 'D MMM YYYY');
    const name = dayName(day, now);
    return name === 'other'
      ? t('transactions.list.weekday', { weekday: d.format('dddd'), date })
      : t(`transactions.list.${name}`, { date });
  };
}

/** The transactions grouped by day, in the order the API sends them (newest first). */
export function byDay(items: Transaction[]): [string, Transaction[]][] {
  const days = new Map<string, Transaction[]>();
  for (const item of items) days.set(item.date, [...(days.get(item.date) ?? []), item]);
  return [...days];
}
