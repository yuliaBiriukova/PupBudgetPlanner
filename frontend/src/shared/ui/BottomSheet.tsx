import { Drawer, VisuallyHidden } from '@mantine/core';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import classes from './BottomSheet.module.css';

interface BottomSheetProps {
  opened: boolean;
  onClose: () => void;
  /** The sheet's name; shown with a close button unless `hideTitle` (then only screen readers hear it). */
  title: string;
  hideTitle?: boolean;
  children: ReactNode;
}

/** A sheet that slides up from the bottom of the phone screen; closes on the overlay, Escape or the button. */
export function BottomSheet({ opened, onClose, title, hideTitle, children }: BottomSheetProps) {
  const { t } = useTranslation();

  // classNames, not className: Drawer.Content passes className to the full-screen inner box too
  return (
    <Drawer.Root
      opened={opened}
      onClose={onClose}
      position="bottom"
      classNames={{ content: classes.content }}
    >
      <Drawer.Overlay />
      <Drawer.Content>
        <div className={classes.grab} aria-hidden="true" />
        {hideTitle ? (
          <Drawer.Title>
            <VisuallyHidden>{title}</VisuallyHidden>
          </Drawer.Title>
        ) : (
          <Drawer.Header className={classes.header}>
            <Drawer.Title className={classes.title}>{title}</Drawer.Title>
            <Drawer.CloseButton size="xl" aria-label={t('common.close')} />
          </Drawer.Header>
        )}
        <Drawer.Body className={classes.body}>{children}</Drawer.Body>
      </Drawer.Content>
    </Drawer.Root>
  );
}
