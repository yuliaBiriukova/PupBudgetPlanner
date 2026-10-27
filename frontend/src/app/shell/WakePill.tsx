import { useTranslation } from 'react-i18next';
import classes from './WakePill.module.css';

interface WakePillProps {
  waking: boolean;
  seconds: number;
}

/** A dark pill at the top while the server wakes up: "Waking up the server… 12 s". */
export function WakePill({ waking, seconds }: WakePillProps) {
  const { t } = useTranslation();

  // The live region stays mounted, so screen readers announce the pill when it appears
  return (
    <div className={classes.region} role="status" aria-live="polite">
      {waking && (
        <span className={classes.pill}>
          {t('wake.message')}
          <span className={classes.seconds}>{t('wake.seconds', { seconds })}</span>
        </span>
      )}
    </div>
  );
}
