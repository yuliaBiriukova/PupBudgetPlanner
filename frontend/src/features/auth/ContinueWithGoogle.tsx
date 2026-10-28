import { Button, Divider, Loader } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';
import { googleSignInUrl, type AuthLocationState } from './authApi';
import classes from './AuthForm.module.css';
import { GoogleLogo } from './GoogleLogo';

/**
 * "or", then "Continue with Google" (F-012). The button is a link: the API sends the person to Google and, once
 * they are signed in, back to the page they were going to.
 */
export function ContinueWithGoogle() {
  const { t } = useTranslation();
  const state = useLocation().state as AuthLocationState | null;
  const [leaving, setLeaving] = useState(false);

  // Back from Google with the browser's Back button: the page comes back as it was left
  useEffect(() => {
    const reset = (event: PageTransitionEvent) => {
      if (event.persisted) setLeaving(false);
    };
    window.addEventListener('pageshow', reset);
    return () => {
      window.removeEventListener('pageshow', reset);
    };
  }, []);

  return (
    <>
      <Divider
        label={t('auth.or')}
        labelPosition="center"
        classNames={{ root: classes.or, label: classes.orLabel }}
      />
      <Button
        component="a"
        href={googleSignInUrl(state?.from)}
        variant="default"
        fullWidth
        className={[classes.button, classes.google].join(' ')}
        aria-busy={leaving || undefined}
        leftSection={
          leaving ? <Loader size={18} color="currentColor" aria-hidden="true" /> : <GoogleLogo />
        }
        onClick={() => {
          setLeaving(true);
        }}
      >
        {leaving ? t('auth.openingGoogle') : t('auth.continueWithGoogle')}
      </Button>
    </>
  );
}
