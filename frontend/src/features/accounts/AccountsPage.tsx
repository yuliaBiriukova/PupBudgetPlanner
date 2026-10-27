import { useTranslation } from 'react-i18next';
import { PlaceholderPage } from '../../shared/ui/PlaceholderPage';

export function AccountsPage() {
  const { t } = useTranslation();

  return <PlaceholderPage title={t('nav.accounts')} description={t('placeholder.accounts')} />;
}
