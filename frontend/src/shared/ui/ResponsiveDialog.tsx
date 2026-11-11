import { Modal, VisuallyHidden } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { DESKTOP_QUERY } from '../../app/shell/sections';
import { BottomSheet } from './BottomSheet';
import { FadingScrollArea } from './FadingScrollArea';
import { usePopupHistory } from './popupHistory';
import classes from './ResponsiveDialog.module.css';

interface ResponsiveDialogProps {
  opened: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Buttons pinned under the content; a long content scrolls between the title and them (I-004). */
  footer?: ReactNode;
  /** Shown in the title row in place of the title, which screen readers still hear as the name (F-018). */
  heading?: ReactNode;
  /** Buttons in the title row before the close button (F-018). */
  actions?: ReactNode;
  /** The desktop dialog's width; 480 px unless a form needs more room (F-018: 520 px). */
  size?: number;
}

/**
 * A dialog in the middle of the desktop screen and a sheet from the bottom on the phone (DESIGN_RULES corners:
 * 24 px). The title, the close button and the footer stay put; only the content scrolls (I-004). Back closes it on
 * both (I-015); the phone's sheet also closes with a swipe down.
 */
export function ResponsiveDialog({
  opened,
  onClose,
  title,
  children,
  footer,
  heading,
  actions,
  size = 480,
}: ResponsiveDialogProps) {
  const { t } = useTranslation();
  const isDesktop = useMediaQuery(DESKTOP_QUERY, false, { getInitialValueInEffect: false });
  // The phone's BottomSheet takes its own history step
  usePopupHistory(opened && isDesktop, onClose);

  if (!isDesktop) {
    return (
      <BottomSheet
        opened={opened}
        onClose={onClose}
        title={title}
        footer={footer}
        heading={heading}
        actions={actions}
      >
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
      size={size}
      padding="lg"
      classNames={{ content: classes.content }}
    >
      <Modal.Overlay />
      <Modal.Content>
        <Modal.Header className={classes.header} data-with-heading={heading ? true : undefined}>
          {heading ? (
            <>
              <VisuallyHidden>
                <Modal.Title>{title}</Modal.Title>
              </VisuallyHidden>
              <div className={classes.heading}>{heading}</div>
            </>
          ) : (
            <Modal.Title className={classes.title}>{title}</Modal.Title>
          )}
          {actions}
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
