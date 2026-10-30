import { Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { ResponsiveDialog } from '../../shared/ui/ResponsiveDialog';

interface AddTransactionSheetProps {
  opened: boolean;
  onClose: () => void;
}

/**
 * Where adding a transaction will happen: a bottom sheet on the phone, a centred dialog on wider screens. The form
 * itself arrives with quick add (F-018).
 */
export function AddTransactionSheet({ opened, onClose }: AddTransactionSheetProps) {
  const { t } = useTranslation();

  return (
    <ResponsiveDialog opened={opened} onClose={onClose} title={t('shell.addTransaction')}>
      <Text c="dimmed">{t('add.comingSoon')}</Text>
    </ResponsiveDialog>
  );
}
