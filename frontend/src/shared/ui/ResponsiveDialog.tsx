import { Modal } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { DESKTOP_QUERY } from '../../app/shell/sections';
import { BottomSheet } from './BottomSheet';
import { FadingScrollArea } from './FadingScrollArea';
import classes from './ResponsiveDialog.module.css';

interface ResponsiveDialogProps {
  opened: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Buttons pinned under the content; a long content scrolls between the title and them (I-004). */
  footer?: ReactNode;
}

/**
 * A dialog in the middle of the desktop screen and a sheet from the bottom on the phone (DESIGN_RULES corners:
 * 24 px). The title, the close button and the footer stay put; only the content scrolls (I-004).
 */
export function ResponsiveDialog({
  opened,
  onClose,
  title,
  children,
  footer,
}: ResponsiveDialogProps) {
  const { t } = useTranslation();
  const isDesktop = useMediaQuery(DESKTOP_QUERY, false, { getInitialValueInEffect: false });

  if (!isDesktop) {
    return (
      <BottomSheet opened={opened} onClose={onClose} title={title} footer={footer}>
        {children}
      </BottomSheet>
    );
  }

  return (
    <Modal.Root
      opened={opened}
      onClose={onClose}
      centered
      radius="xl"
      size={480}
      padding="lg"
      classNames={{ content: classes.content }}
    >
      <Modal.Overlay />
      <Modal.Content>
        <Modal.Header className={classes.header}>
          <Modal.Title className={classes.title}>{title}</Modal.Title>
          <Modal.CloseButton aria-label={t('common.close')} size="xl" radius="xl" />
        </Modal.Header>
        <FadingScrollArea autosize className={classes.scroll}>
          <Modal.Body className={classes.body} data-with-footer={footer ? true : undefined}>
            {children}
          </Modal.Body>
        </FadingScrollArea>
        {footer && <div className={classes.footer}>{footer}</div>}
      </Modal.Content>
    </Modal.Root>
  );
}
