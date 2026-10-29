import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router';
import { Logo } from '../../app/shell/Logo';
import { AuthSwitch } from './AuthFormParts';
import classes from './AuthLayout.module.css';

/**
 * The frame of the sign-in and sign-up pages (F-011 variant 4): on the desktop the name on a charcoal half beside
 * the form; on the phone a charcoal band with the form card overlapping it.
 */
export function AuthLayout({
  children,
  withSwitch = true,
}: {
  children?: ReactNode;
  /** The invite page has no Sign in / Create account switch (F-028). */
  withSwitch?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className={classes.root}>
      <header className={classes.hero}>
        <div className={classes.heroBody}>
          <Logo className={classes.logo} iconSize={24} />
          <p className={classes.wordmark}>{t('app.shortName')}</p>
          <p className={classes.about}>{t('auth.about')}</p>
        </div>
      </header>
      <main className={classes.formSide}>
        <div className={classes.formWrap}>
          {withSwitch && <AuthSwitch />}
          {children ?? <Outlet />}
        </div>
      </main>
    </div>
  );
}
