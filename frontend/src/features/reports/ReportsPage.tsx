import { useTranslation } from 'react-i18next';
import { PlaceholderPage } from '../../shared/ui/PlaceholderPage';

export function ReportsPage() {
  const { t } = useTranslation();

  return <PlaceholderPage title={t('nav.reports')} description={t('placeholder.reports')} />;
}
