import { IconCoins } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { cx } from '../../shared/ui/cx';
import classes from './Logo.module.css';

interface LogoProps {
  /** Sets a bigger circle (the sign-in screens); the icon follows `iconSize`. */
  className?: string;
  iconSize?: 20 | 24;
}

/** The coin-stack mark on a sky circle. */
export function Logo({ className, iconSize = 20 }: LogoProps) {
  return (
    <span className={cx(classes.logo, className)} aria-hidden="true">
      <IconCoins size={iconSize} stroke={1.7} />
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
