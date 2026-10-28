import {
  Alert,
  Button,
  Loader,
  PasswordInput,
  TextInput,
  type PasswordInputProps,
  type TextInputProps,
} from '@mantine/core';
import { IconAlertCircle, IconEye, IconEyeOff, IconZzz } from '@tabler/icons-react';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, useLocation } from 'react-router';
import type { AuthFailure, AuthLocationState } from './authApi';
import classes from './AuthForm.module.css';

const fieldClassNames = {
  label: classes.label,
  input: classes.input,
  description: classes.description,
  error: classes.error,
};

/** Hints and errors go under the field; an error takes the hint's place. */
const ORDER: TextInputProps['inputWrapperOrder'] = ['label', 'input', 'description', 'error'];

function fieldMessages(error: ReactNode, description: ReactNode) {
  return {
    error: error ? (
      <>
        <IconAlertCircle size={16} stroke={1.7} aria-hidden="true" />
        {error}
      </>
    ) : undefined,
    description: error ? undefined : description,
  };
}

export function TextField({ error, description, ...props }: TextInputProps) {
  return (
    <TextInput
      {...props}
      {...fieldMessages(error, description)}
      classNames={fieldClassNames}
      inputWrapperOrder={ORDER}
    />
  );
}

/** A password with a 44 px show / hide button whose name says what it does now. */
export function PasswordField({ error, description, ...props }: PasswordInputProps) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  return (
    <PasswordInput
      {...props}
      {...fieldMessages(error, description)}
      visible={visible}
      onVisibilityChange={setVisible}
      visibilityToggleIcon={({ reveal }) =>
        reveal ? <IconEyeOff size={20} stroke={1.7} /> : <IconEye size={20} stroke={1.7} />
      }
      visibilityToggleButtonProps={{
        'aria-label': visible ? t('auth.fields.hidePassword') : t('auth.fields.showPassword'),
        // Mantine leaves it out of the tab order; everything must work with the keyboard (DESIGN_RULES §7)
        tabIndex: 0,
      }}
      rightSectionWidth={52}
      classNames={{
        ...fieldClassNames,
        innerInput: classes.innerInput,
        visibilityToggle: classes.toggle,
      }}
      inputWrapperOrder={ORDER}
    />
  );
}

/** Sign in / Create account: two links styled as a switch; the place the person came from travels along. */
export function AuthSwitch() {
  const { t } = useTranslation();
  const state = useLocation().state as AuthLocationState | null;

  return (
    <nav className={classes.switch} aria-label={t('auth.switchLabel')}>
      <NavLink to="/sign-in" state={state} className={classes.switchLink} replace>
        {t('auth.signIn')}
      </NavLink>
      <NavLink to="/sign-up" state={state} className={classes.switchLink} replace>
        {t('auth.createAccount')}
      </NavLink>
    </nav>
  );
}

/** Why the last attempt failed, in one banner above the fields. */
export function FailureBanner({ failure }: { failure: AuthFailure }) {
  const { t } = useTranslation();
  const state = useLocation().state as AuthLocationState | null;

  return (
    <Alert
      role="alert"
      icon={<IconAlertCircle size={20} stroke={1.7} />}
      classNames={{
        root: classes.banner,
        body: classes.bannerBody,
        message: classes.bannerMessage,
        icon: classes.bannerIcon,
      }}
    >
      {t(`auth.errors.${failure}`)}
      {failure === 'emailUnavailable' && (
        <>
          <br />
          <Link to="/sign-in" state={state} replace className={classes.bannerLink}>
            {t('auth.errors.signInWithEmail')}
          </Link>
        </>
      )}
    </Alert>
  );
}

/** At night the first request wakes the server; this says so right above the button. */
export function WakeNote({ seconds }: { seconds: number }) {
  const { t } = useTranslation();

  return (
    <p className={classes.wake}>
      <IconZzz size={16} stroke={1.7} aria-hidden="true" />
      <span>
        {t('wake.message')}{' '}
        <span className={classes.seconds}>{t('wake.seconds', { seconds })}</span>
        <br />
        {t('auth.wake.note')}
      </span>
    </p>
  );
}

interface SubmitButtonProps {
  pending: boolean;
  label: string;
  pendingLabel: string;
}

/** The form's button; while the request runs it keeps its place and says what is happening. */
export function SubmitButton({ pending, label, pendingLabel }: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      fullWidth
      className={classes.button}
      aria-busy={pending || undefined}
      aria-disabled={pending || undefined}
      leftSection={pending ? <Loader size={18} color="currentColor" aria-hidden="true" /> : null}
    >
      {pending ? pendingLabel : label}
    </Button>
  );
}
