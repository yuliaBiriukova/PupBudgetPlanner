import { useTranslation } from 'react-i18next';
import { PlaceholderPage } from '../../shared/ui/PlaceholderPage';

export function SettingsPage() {
  const { t } = useTranslation();

  return <PlaceholderPage title={t('nav.settings')} description={t('placeholder.settings')} />;
}
