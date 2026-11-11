import { useMediaQuery } from '@mantine/hooks';
import { Notifications } from '@mantine/notifications';
import classes from './AppNotifications.module.css';
import { DESKTOP_QUERY } from './shell/sections';

/**
 * Where every toast in the app shows (B-013): bottom right on the desktop; on the phone at the top, under the
 * header, since at the bottom it lay over the tab bar and blended into it.
 */
export function AppNotifications() {
  const isDesktop = useMediaQuery(DESKTOP_QUERY, false, { getInitialValueInEffect: false });
  return (
    <Notifications
      position={isDesktop ? 'bottom-right' : 'top-center'}
      classNames={{ root: classes.root }}
    />
  );
}
