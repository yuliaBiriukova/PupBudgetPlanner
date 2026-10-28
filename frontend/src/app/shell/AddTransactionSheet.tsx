import { Modal, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '../../shared/ui/BottomSheet';
import classes from './AddTransactionSheet.module.css';

interface AddTransactionSheetProps {
  opened: boolean;
  onClose: () => void;
  /** A bottom sheet on the phone, a centred dialog on wider screens. */
  asSheet: boolean;
}

/** Where adding a transaction will happen; the form itself arrives with quick add (F-018). */
export function AddTransactionSheet({ opened, onClose, asSheet }: AddTransactionSheetProps) {
  const { t } = useTranslation();
  const content = <Text c="dimmed">{t('add.comingSoon')}</Text>;

  return asSheet ? (
    <BottomSheet opened={opened} onClose={onClose} title={t('shell.addTransaction')}>
      {content}
    </BottomSheet>
  ) : (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      size={440}
      radius="xl"
      padding="lg"
      title={t('shell.addTransaction')}
      classNames={{ title: classes.title }}
      closeButtonProps={{ 'aria-label': t('common.close') }}
    >
      {content}
    </Modal>
  );
}
