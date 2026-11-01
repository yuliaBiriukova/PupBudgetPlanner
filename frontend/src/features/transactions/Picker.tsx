import { Popover, type PopoverProps } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import type { ReactElement, ReactNode } from 'react';
import { DESKTOP_QUERY } from '../../app/shell/sections';
import { BottomSheet } from '../../shared/ui/BottomSheet';
import { FadingScrollArea } from '../../shared/ui/FadingScrollArea';
import classes from './TransactionForm.module.css';

interface PickerProps {
  opened: boolean;
  onClose: () => void;
  /** The sheet's title on the phone, the dropdown's name on the desktop. */
  title: string;
  /** The button that opens it; the dropdown hangs under it. */
  target: ReactElement;
  children: ReactNode;
  /** Pinned over the list: a search. */
  top?: ReactNode;
  /** The dropdown's width: the target's, or at least this many pixels. */
  width?: number | 'target';
  position?: PopoverProps['position'];
  /** Turns up above the target when there is no room under it (the calendar is never cut off). */
  flip?: boolean;
  /** A sheet that keeps its height while its list is searched. */
  tall?: boolean;
  /**
   * A list: on the desktop it scrolls in the dropdown, as tall as its rows up to this height (the sheet scrolls by
   * itself on the phone).
   */
  listHeight?: number;
}

/**
 * A list or the calendar the form opens (F-018): a dropdown under its button on the desktop, over the dialog, as the
 * app's other dropdowns (the currency list, F-016); a sheet over the form on the phone. Its first control marked
 * `data-autofocus` (and `KEEP_FORM_OPEN`) takes the focus, so Escape closes the picker only.
 */
export function Picker({
  opened,
  onClose,
  title,
  target,
  children,
  top,
  width = 'target',
  position = 'bottom-start',
  flip = false,
  tall,
  listHeight,
}: PickerProps) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY, false, { getInitialValueInEffect: false });
  // Its controls are marked to keep the form open on Escape (KEEP_FORM_OPEN): the picker closes itself
  const content = (
    <div
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose();
      }}
    >
      {children}
    </div>
  );

  if (!isDesktop) {
    return (
      <>
        {target}
        <BottomSheet opened={opened} onClose={onClose} title={title} top={top} tall={tall}>
          {content}
        </BottomSheet>
      </>
    );
  }

  return (
    <Popover
      opened={opened}
      onChange={(next) => {
        if (!next) onClose();
      }}
      position={position}
      offset={8}
      middlewares={{ flip, shift: true, size: flip ? false : { padding: 16 } }}
      width={width}
      withinPortal
      // Its roles would give the button another id; the button says aria-expanded itself
      withRoles={false}
      // The focus goes into it (to its [data-autofocus]), so Escape closes the dropdown and not the form under it
      trapFocus
      returnFocus
      closeOnEscape
      classNames={{ dropdown: classes.dropdown }}
    >
      <Popover.Target>{target}</Popover.Target>
      <Popover.Dropdown
        aria-label={title}
        role="dialog"
        miw={typeof width === 'number' ? width : 320}
      >
        {top && <div className={classes.dropdownSearch}>{top}</div>}
        {listHeight ? (
          <FadingScrollArea
            autosize
            mah={listHeight}
            className={classes.listScroll}
            data-first={top ? undefined : true}
          >
            {content}
          </FadingScrollArea>
        ) : (
          content
        )}
      </Popover.Dropdown>
    </Popover>
  );
}
