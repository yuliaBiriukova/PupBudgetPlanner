import { Button } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { AuthLayout } from '../auth/AuthLayout';
import classes from './DeleteAccount.module.css';

/** After deleting one's account (F-027): signed out, on the sign-in frame, saying what that means. */
export function AccountDeletedPage() {
  const { t } = useTranslation();
  return (
    <AuthLayout withSwitch={false}>
      <div className={classes.deleted}>
        <h1 className={classes.deletedTitle}>{t('settings.deleted.title')}</h1>
        <p>{t('settings.deleted.text')}</p>
        <p className={classes.dim}>{t('settings.deleted.invite')}</p>
        <Button component={Link} to="/sign-in" variant="quiet" className={classes.signIn}>
          {t('settings.deleted.signIn')}
        </Button>
      </div>
    </AuthLayout>
  );
}
