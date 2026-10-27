import { useTranslation } from 'react-i18next';
import { PlaceholderPage } from '../../shared/ui/PlaceholderPage';

export function FamilyPage() {
  const { t } = useTranslation();

  return <PlaceholderPage title={t('nav.family')} description={t('placeholder.family')} />;
}
