import { useMediaQuery } from '@mantine/hooks';
import { DESKTOP_QUERY } from '../../app/shell/sections';

/**
 * `data-autofocus` for a form's first field: the cursor is in it as the dialog opens on the desktop only. On the
 * phone that would bring the keyboard up over a form that has just opened, so the sheet opens from its top and the
 * keyboard waits for a tap on a field (I-029). A search sets `data-autofocus` itself: its sheet is opened to type.
 */
export function useDesktopAutofocus(): true | undefined {
  const isDesktop = useMediaQuery(DESKTOP_QUERY, false, { getInitialValueInEffect: false });
  return isDesktop ? true : undefined;
}
