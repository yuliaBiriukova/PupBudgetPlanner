import { useTranslation } from 'react-i18next';
import { FAMILY_NAME_MAX } from './familyApi';

/** The family's name: not empty, at most 40 characters once trimmed. Said once the field has been touched. */
export function useFamilyNameError() {
  const { t } = useTranslation();
  return (name: string, touched: boolean): string | undefined => {
    if (!touched) return undefined;
    if (!name.trim()) return t('family.nameErrors.required');
    if (name.trim().length > FAMILY_NAME_MAX)
      return t('family.nameErrors.tooLong', { max: FAMILY_NAME_MAX });
    return undefined;
  };
}

/** "Andriy and Iryna", "Andriy, Iryna, and Taras": in the app's language. */
export function useNamesList() {
  const { i18n } = useTranslation();
  return (names: string[]) =>
    new Intl.ListFormat(i18n.language, { type: 'conjunction' }).format(names);
}
