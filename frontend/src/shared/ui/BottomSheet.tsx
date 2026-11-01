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
  /** As tall as a sheet goes (90 % of the screen): a form with its own keys under it (F-018). */
  full?: boolean;
  /**
   * Shown in the title row in place of the title, which screen readers still hear as the sheet's name (the
   * transaction form's Expense / Income switch, F-018).
   */
  heading?: ReactNode;
  /** Buttons in the title row before the close button (the transaction form's Delete, F-018). */
  actions?: ReactNode;
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
  full,
  heading,
  actions,
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
      <Drawer.Content
        ref={setContent}
        data-tall={tall ? true : undefined}
        data-full={full ? true : undefined}
      >
        {/* The handle and the title are where a swipe starts (data-sheet-drag) */}
        <div className={classes.grabZone} data-sheet-drag aria-hidden="true">
          <div className={classes.grab} />
        </div>
        {hideTitle ? (
          <Drawer.Title>
            <VisuallyHidden>{title}</VisuallyHidden>
          </Drawer.Title>
        ) : (
          <Drawer.Header
            className={classes.header}
            data-sheet-drag
            data-with-heading={heading ? true : undefined}
          >
            {heading ? (
              <>
                <VisuallyHidden>
                  <Drawer.Title>{title}</Drawer.Title>
                </VisuallyHidden>
                <div className={classes.heading}>{heading}</div>
              </>
            ) : (
              <Drawer.Title className={classes.title}>{title}</Drawer.Title>
            )}
            {actions}
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
