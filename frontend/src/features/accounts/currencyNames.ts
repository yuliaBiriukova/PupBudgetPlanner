import { useTranslation } from 'react-i18next';
import en from '../../shared/i18n/locales/en.json';

type NamedCurrency = keyof typeof en.currencies;

const isNamed = (code: string): code is NamedCurrency => code in en.currencies;

/** A currency's name (`Polish zloty`); a code the app has no name for shows as itself. */
export function useCurrencyName() {
  const { t } = useTranslation();
  return (code: string) => (isNamed(code) ? t(`currencies.${code}`) : code);
}

/** A currency group's title: the hryvnia is just "Hryvnia", the rest go by their names. */
export function useCurrencyTitle() {
  const { t } = useTranslation();
  const name = useCurrencyName();
  return (code: string) => (code === 'UAH' ? t('accounts.hryvnia') : name(code));
}
