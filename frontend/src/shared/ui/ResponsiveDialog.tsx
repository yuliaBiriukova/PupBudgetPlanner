import { Modal } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { DESKTOP_QUERY } from '../../app/shell/sections';
import { BottomSheet } from './BottomSheet';

interface ResponsiveDialogProps {
  opened: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/** A dialog in the middle of the desktop screen and a sheet from the bottom on the phone (DESIGN_RULES corners: 24 px). */
export function ResponsiveDialog({ opened, onClose, title, children }: ResponsiveDialogProps) {
  const { t } = useTranslation();
  const isDesktop = useMediaQuery(DESKTOP_QUERY, false, { getInitialValueInEffect: false });

  if (!isDesktop) {
    return (
      <BottomSheet opened={opened} onClose={onClose} title={title}>
        {children}
      </BottomSheet>
    );
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title}
      centered
      radius="xl"
      size={480}
      padding="lg"
      closeButtonProps={{ 'aria-label': t('common.close'), size: 'xl', radius: 'xl' }}
      styles={{
        title: {
          fontFamily: 'var(--pup-font-display)',
          fontWeight: 300,
          fontSize: 20,
          lineHeight: 1.3,
        },
      }}
    >
      {children}
    </Modal>
  );
}
