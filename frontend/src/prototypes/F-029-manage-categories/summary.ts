import { useTranslation } from 'react-i18next';
import type { ProtoGroup } from './protoData';
import { shownOf } from './useCategoryEdits';

/** '33 categories in 7 groups', as the page says it. */
export function useSummary(groups: ProtoGroup[]) {
  const { t } = useTranslation();
  const shown = groups.filter((g) => !g.hidden);
  const total = shown.reduce((sum, group) => sum + shownOf(group).length, 0);
  return t('categories.summary', {
    categories: t('categories.count', { count: total }),
    groups: t('categories.groupCount', { count: shown.length }),
  });
}
