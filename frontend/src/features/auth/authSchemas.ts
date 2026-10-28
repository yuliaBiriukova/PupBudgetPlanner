import type { TFunction } from 'i18next';
import { z } from 'zod';

/** The same limits as the API's validators (backend `AuthLimits`). */
export const AUTH_LIMITS = {
  displayNameMax: 50,
  emailMax: 256,
  passwordMin: 8,
  passwordMax: 128,
} as const;

function email(t: TFunction) {
  // One message at a time: an empty field only says "Enter your email."
  return z
    .string()
    .trim()
    .min(1, t('auth.validation.emailRequired'))
    .pipe(z.email(t('auth.validation.emailInvalid')).max(AUTH_LIMITS.emailMax));
}

export function signInSchema(t: TFunction) {
  return z.object({
    email: email(t),
    password: z
      .string()
      .min(1, t('auth.validation.passwordRequired'))
      .max(AUTH_LIMITS.passwordMax, t('auth.validation.passwordTooLong')),
  });
}

export function signUpSchema(t: TFunction) {
  return z
    .object({
      displayName: z
        .string()
        .trim()
        .min(1, t('auth.validation.nameRequired'))
        .max(AUTH_LIMITS.displayNameMax, t('auth.validation.nameTooLong')),
      email: email(t),
      password: z
        .string()
        .min(AUTH_LIMITS.passwordMin, t('auth.validation.passwordTooShort'))
        .max(AUTH_LIMITS.passwordMax, t('auth.validation.passwordTooLong')),
      // No password reset until email exists (after the MVP): a typo here would lock the person out
      confirmPassword: z.string(),
    })
    .refine((values) => values.password === values.confirmPassword, {
      error: t('auth.validation.passwordsDiffer'),
      path: ['confirmPassword'],
      // Also when another field has a problem, so all the messages show at once
      when: () => true,
    });
}

export type SignInValues = z.input<ReturnType<typeof signInSchema>>;
export type SignUpValues = z.input<ReturnType<typeof signUpSchema>>;
