import i18n from 'i18next';
import { describe, expect, it } from 'vitest';
import { signInSchema, signUpSchema } from './authSchemas';

const t = i18n.t.bind(i18n);

/** The messages per field, as the form shows them. */
function messages(result: {
  success: boolean;
  error?: { issues: { path: PropertyKey[]; message: string }[] };
}) {
  return Object.fromEntries(
    (result.error?.issues ?? []).map((i) => [String(i.path[0]), i.message]),
  );
}

const valid = {
  displayName: 'Olena',
  email: 'olena@example.com',
  password: 'kyiv-budget-26',
  confirmPassword: 'kyiv-budget-26',
};

describe('sign-up rules', () => {
  it('accepts a name, an email and a password typed twice', () => {
    expect(signUpSchema(t).safeParse(valid).success).toBe(true);
  });

  it('says what is missing, one message per field', () => {
    const result = signUpSchema(t).safeParse({
      displayName: ' ',
      email: '',
      password: '',
      confirmPassword: '',
    });

    expect(messages(result)).toEqual({
      displayName: 'Enter your name.',
      email: 'Enter your email.',
      password: 'Use at least 8 characters.',
    });
  });

  it('checks the email format and the password length', () => {
    const result = signUpSchema(t).safeParse({
      ...valid,
      email: 'olena@example',
      password: 'abc',
      confirmPassword: 'abc',
    });

    expect(messages(result)).toEqual({
      email: 'Enter an email like name@example.com.',
      password: 'Use at least 8 characters.',
    });
  });

  it('asks for the same password twice, also next to other problems', () => {
    expect(
      messages(signUpSchema(t).safeParse({ ...valid, confirmPassword: 'kyiv-budget-27' })),
    ).toEqual({
      confirmPassword: 'The passwords don’t match.',
    });
    expect(
      messages(signUpSchema(t).safeParse({ ...valid, password: 'abc', confirmPassword: 'abd' })),
    ).toEqual({
      password: 'Use at least 8 characters.',
      confirmPassword: 'The passwords don’t match.',
    });
  });

  it('asks for length only, not digits or symbols', () => {
    expect(
      signUpSchema(t).safeParse({ ...valid, password: 'abcdefgh', confirmPassword: 'abcdefgh' })
        .success,
    ).toBe(true);
  });
});

describe('sign-in rules', () => {
  it('needs an email and a password, but not the new-password rules', () => {
    expect(signInSchema(t).safeParse({ email: 'olena@example.com', password: 'x' }).success).toBe(
      true,
    );
    expect(messages(signInSchema(t).safeParse({ email: '', password: '' }))).toEqual({
      email: 'Enter your email.',
      password: 'Enter your password.',
    });
  });
});
