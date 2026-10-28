import { VisuallyHidden } from '@mantine/core';
import { schemaResolver, useForm } from '@mantine/form';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { AuthFailure, RegisterRequest } from './authApi';
import classes from './AuthForm.module.css';
import { ContinueWithGoogle } from './ContinueWithGoogle';
import { FailureBanner, PasswordField, SubmitButton, TextField } from './AuthFormParts';
import { signUpSchema, type SignUpValues } from './authSchemas';

interface SignUpFormProps {
  onSubmit: (values: RegisterRequest) => void;
  pending?: boolean;
  failure?: AuthFailure | null;
  /** Shown right above the button (the waking-up note). */
  notice?: ReactNode;
  initialValues?: Partial<SignUpValues>;
}

export function SignUpForm({
  onSubmit,
  pending = false,
  failure,
  notice,
  initialValues,
}: SignUpFormProps) {
  const { t } = useTranslation();
  const form = useForm<SignUpValues>({
    initialValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
      ...initialValues,
    },
    validate: schemaResolver(signUpSchema(t), { sync: true }),
  });

  return (
    <>
      <VisuallyHidden component="h1">{t('auth.signUpTitle')}</VisuallyHidden>
      <form
        className={classes.form}
        noValidate
        onSubmit={form.onSubmit((values) => {
          if (pending) return;
          onSubmit({
            displayName: values.displayName.trim(),
            email: values.email.trim(),
            password: values.password,
          });
        })}
      >
        {failure && <FailureBanner failure={failure} />}
        <TextField
          label={t('auth.fields.name')}
          description={t('auth.fields.nameHint')}
          autoComplete="name"
          key={form.key('displayName')}
          {...form.getInputProps('displayName')}
        />
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
          description={t('auth.fields.passwordHint')}
          autoComplete="new-password"
          key={form.key('password')}
          {...form.getInputProps('password')}
        />
        <PasswordField
          label={t('auth.fields.confirmPassword')}
          autoComplete="new-password"
          key={form.key('confirmPassword')}
          {...form.getInputProps('confirmPassword')}
        />
        <div role="status" aria-live="polite" className={classes.live}>
          {notice}
        </div>
        <SubmitButton
          pending={pending}
          label={t('auth.createAccount')}
          pendingLabel={t('auth.creatingAccount')}
        />
        <ContinueWithGoogle />
      </form>
    </>
  );
}
