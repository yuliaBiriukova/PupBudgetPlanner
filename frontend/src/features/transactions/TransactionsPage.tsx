import { useTranslation } from 'react-i18next';
import { PlaceholderPage } from '../../shared/ui/PlaceholderPage';

export function TransactionsPage() {
  const { t } = useTranslation();

  return (
    <PlaceholderPage title={t('nav.transactions')} description={t('placeholder.transactions')} />
  );
}
