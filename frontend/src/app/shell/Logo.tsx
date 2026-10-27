import { IconCoins } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { cx } from '../../shared/ui/cx';
import classes from './Logo.module.css';

/** The coin-stack mark on a sky circle. */
export function Logo() {
  return (
    <span className={classes.logo} aria-hidden="true">
      <IconCoins size={20} stroke={1.7} />
    </span>
  );
}

/** The app name in the display face. */
export function BrandName({ className }: { className?: string }) {
  const { t } = useTranslation();

  return <span className={cx(classes.name, className)}>{t('app.shortName')}</span>;
}

/** The mark with the app name, as in the phone top bar. */
export function Brand() {
  return (
    <span className={classes.brand}>
      <Logo />
      <BrandName />
    </span>
  );
}
