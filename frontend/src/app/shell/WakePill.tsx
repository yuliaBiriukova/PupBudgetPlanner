import { IconWifiOff } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import classes from './WakePill.module.css';

interface WakePillProps {
  waking: boolean;
  seconds: number;
  /** No network (F-025): the pill says so instead of waiting for the server. */
  offline?: boolean;
}

/**
 * A dark pill at the top while the server wakes up: "Waking up the server… 12 s". Without a network it says that
 * instead: "No connection: you can look, not save".
 */
export function WakePill({ waking, seconds, offline = false }: WakePillProps) {
  const { t } = useTranslation();

  // The live region stays mounted, so screen readers announce the pill when it appears
  return (
    <div className={classes.region} role="status" aria-live="polite">
      {offline ? (
        <span className={classes.pill}>
          <IconWifiOff size={16} stroke={1.7} aria-hidden="true" />
          {t('wake.offline')}
        </span>
      ) : (
        waking && (
          <span className={classes.pill}>
            {t('wake.message')}
            <span className={classes.seconds}>{t('wake.seconds', { seconds })}</span>
          </span>
        )
      )}
    </div>
  );
}
