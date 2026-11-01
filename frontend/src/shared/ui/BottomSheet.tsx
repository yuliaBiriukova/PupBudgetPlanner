import { Drawer, VisuallyHidden } from '@mantine/core';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import classes from './BottomSheet.module.css';
import { FadingScrollArea } from './FadingScrollArea';
import { usePopupHistory } from './popupHistory';
import { useSheetSwipe } from './useSheetSwipe';

interface BottomSheetProps {
  opened: boolean;
  onClose: () => void;
  /** The sheet's name; shown with a close button unless `hideTitle` (then only screen readers hear it). */
  title: string;
  hideTitle?: boolean;
  children: ReactNode;
  /** Buttons pinned under the content; a long content scrolls between the title and them (I-004). */
  footer?: ReactNode;
  /** Pinned between the title and the content, e.g. a search over a list (F-016's currency list). */
  top?: ReactNode;
  /** A set height (80 % of the screen) instead of the content's, so a list being searched doesn't jump. */
  tall?: boolean;
}

/**
 * A sheet that slides up from the bottom of the phone screen. It closes on the overlay, Escape or the button, with a
 * swipe down and with Back (I-015).
 */
export function BottomSheet({
  opened,
  onClose,
  title,
  hideTitle,
  children,
  footer,
  top,
  tall,
}: BottomSheetProps) {
  const { t } = useTranslation();
  usePopupHistory(opened, onClose);
  const { setContent, setOverlay, setScroller } = useSheetSwipe(onClose);

  // classNames, not className: Drawer.Content passes className to the full-screen inner box too
  return (
    <Drawer.Root
      opened={opened}
      onClose={onClose}
      position="bottom"
      classNames={{ content: classes.content }}
    >
      <Drawer.Overlay ref={setOverlay} />
      <Drawer.Content ref={setContent} data-tall={tall ? true : undefined}>
        {/* The handle and the title are where a swipe starts (data-sheet-drag) */}
        <div className={classes.grabZone} data-sheet-drag aria-hidden="true">
          <div className={classes.grab} />
        </div>
        {hideTitle ? (
          <Drawer.Title>
            <VisuallyHidden>{title}</VisuallyHidden>
          </Drawer.Title>
        ) : (
          <Drawer.Header className={classes.header} data-sheet-drag>
            <Drawer.Title className={classes.title}>{title}</Drawer.Title>
            <Drawer.CloseButton size="xl" aria-label={t('common.close')} />
          </Drawer.Header>
        )}
        {top && <div className={classes.top}>{top}</div>}
        <FadingScrollArea autosize className={classes.scroll} viewportRef={setScroller}>
          <Drawer.Body
            className={classes.body}
            data-with-footer={footer ? true : undefined}
            data-without-title={hideTitle ? true : undefined}
          >
            {children}
          </Drawer.Body>
        </FadingScrollArea>
        {footer && (
          <div className={classes.footer} data-sheet-footer>
            {footer}
          </div>
        )}
      </Drawer.Content>
    </Drawer.Root>
  );
}
