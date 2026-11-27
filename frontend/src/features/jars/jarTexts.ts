import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { formatMoney } from '../../shared/format/money';
import { progress, reached } from './jars';
import type { Jar } from './jarsApi';

/** `2027-12` → `Dec 2027`. */
export const monthYear = (month: string) => dayjs(`${month}-01`).format('MMM YYYY');

/** `2026-11` → `November`. */
export const monthLong = (month: string) => dayjs(`${month}-01`).format('MMMM');

/** "45% of 400 000 ₴", "Goal reached", or "No goal". */
export function useGoalText() {
  const { t } = useTranslation();
  return (jar: Jar) => {
    if (jar.goal === null) return t('jars.goal.none');
    if (reached(jar, jar.saved)) return t('jars.goal.reached');
    return t('jars.goal.share', {
      share: Math.floor(progress(jar, jar.saved) * 100),
      goal: formatMoney(jar.goal, jar.currency),
    });
  };
}
