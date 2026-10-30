import { Drawer, VisuallyHidden } from '@mantine/core';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import classes from './BottomSheet.module.css';
import { FadingScrollArea } from './FadingScrollArea';

interface BottomSheetProps {
  opened: boolean;
  onClose: () => void;
  /** The sheet's name; shown with a close button unless `hideTitle` (then only screen readers hear it). */
  title: string;
  hideTitle?: boolean;
  children: ReactNode;
  /** Buttons pinned under the content; a long content scrolls between the title and them (I-004). */
  footer?: ReactNode;
}

/** A sheet that slides up from the bottom of the phone screen; closes on the overlay, Escape or the button. */
export function BottomSheet({
  opened,
  onClose,
  title,
  hideTitle,
  children,
  footer,
}: BottomSheetProps) {
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
        <FadingScrollArea autosize className={classes.scroll}>
          <Drawer.Body
            className={classes.body}
            data-with-footer={footer ? true : undefined}
            data-without-title={hideTitle ? true : undefined}
          >
            {children}
          </Drawer.Body>
        </FadingScrollArea>
        {footer && <div className={classes.footer}>{footer}</div>}
      </Drawer.Content>
    </Drawer.Root>
  );
}
