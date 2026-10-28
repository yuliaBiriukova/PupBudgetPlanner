import { VisuallyHidden } from '@mantine/core';
import { schemaResolver, useForm } from '@mantine/form';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { AuthFailure, SignInRequest } from './authApi';
import classes from './AuthForm.module.css';
import { FailureBanner, PasswordField, SubmitButton, TextField } from './AuthFormParts';
import { signInSchema, type SignInValues } from './authSchemas';

interface SignInFormProps {
  onSubmit: (values: SignInRequest) => void;
  pending?: boolean;
  failure?: AuthFailure | null;
  /** Shown right above the button (the waking-up note). */
  notice?: ReactNode;
  initialValues?: Partial<SignInValues>;
}

export function SignInForm({
  onSubmit,
  pending = false,
  failure,
  notice,
  initialValues,
}: SignInFormProps) {
  const { t } = useTranslation();
  const form = useForm<SignInValues>({
    initialValues: { email: '', password: '', ...initialValues },
    validate: schemaResolver(signInSchema(t), { sync: true }),
  });

  return (
    <>
      <VisuallyHidden component="h1">{t('auth.signInTitle')}</VisuallyHidden>
      <form
        className={classes.form}
        noValidate
        onSubmit={form.onSubmit((values) => {
          if (!pending) onSubmit({ email: values.email.trim(), password: values.password });
        })}
      >
        {failure && <FailureBanner failure={failure} />}
        <TextField
          label={t('auth.fields.email')}
          type="email"
          inputMode="email"
          autoComplete="email"
          key={form.key('email')}
          {...form.getInputProps('email')}
        />
        <PasswordField
          label={t('auth.fields.password')}
          autoComplete="current-password"
          key={form.key('password')}
          {...form.getInputProps('password')}
        />
        <div role="status" aria-live="polite" className={classes.live}>
          {notice}
        </div>
        <SubmitButton
          pending={pending}
          label={t('auth.signIn')}
          pendingLabel={t('auth.signingIn')}
        />
      </form>
    </>
  );
}
