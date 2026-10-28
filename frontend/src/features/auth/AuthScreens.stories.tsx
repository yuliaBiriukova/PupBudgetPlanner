import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ReactNode } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { expect, userEvent, within } from 'storybook/test';
import type { AuthFailure } from './authApi';
import { WakeNote } from './AuthFormParts';
import { AuthLayout } from './AuthLayout';
import { SignInForm } from './SignInForm';
import { SignUpForm } from './SignUpForm';

interface AuthScreenProps {
  mode: 'sign-in' | 'sign-up';
  pending?: boolean;
  failure?: AuthFailure | null;
  waking?: boolean;
}

/** The sign-in or sign-up page as the app shows it, without the API: submitting does nothing. */
function AuthScreen({ mode, pending = false, failure = null, waking = false }: AuthScreenProps) {
  const notice: ReactNode = waking ? <WakeNote seconds={12} /> : null;
  const form =
    mode === 'sign-in' ? (
      <SignInForm onSubmit={() => undefined} pending={pending} failure={failure} notice={notice} />
    ) : (
      <SignUpForm onSubmit={() => undefined} pending={pending} failure={failure} notice={notice} />
    );
  const [router] = useState(() =>
    createMemoryRouter([{ path: '*', element: <AuthLayout>{form}</AuthLayout> }], {
      initialEntries: [`/${mode}`],
    }),
  );

  return <RouterProvider router={router} />;
}

const desktop = { viewport: { value: 'desktop', isRotated: false } };

const meta = {
  title: 'Auth/Sign in and create account',
  component: AuthScreen,
  parameters: { layout: 'fullscreen' },
  args: { mode: 'sign-in' },
} satisfies Meta<typeof AuthScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SignInPhone: Story = {};

export const SignInPhoneDark: Story = {
  globals: { colorScheme: 'dark' },
};

export const SignInDesktop: Story = {
  globals: desktop,
};

export const SignInDesktopDark: Story = {
  globals: { ...desktop, colorScheme: 'dark' },
};

export const SignInWrongPassword: Story = {
  args: { failure: 'credentials' },
};

export const SignInTooManyAttempts: Story = {
  args: { failure: 'tooMany' },
};

export const SignInBusy: Story = {
  args: { pending: true },
};

/** At night the first request wakes the server: the note above the button counts the seconds. */
export const SignInWakingUp: Story = {
  args: { waking: true },
};

export const SignInFieldErrors: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: 'Sign in' }));

    await expect(canvas.getByText('Enter your email.')).toBeInTheDocument();
    await expect(canvas.getByText('Enter your password.')).toBeInTheDocument();
  },
};

export const CreateAccountPhone: Story = {
  args: { mode: 'sign-up' },
};

export const CreateAccountDesktopDark: Story = {
  globals: { ...desktop, colorScheme: 'dark' },
  args: { mode: 'sign-up' },
};

/** A taken email: neutral, it doesn't say that an account exists (ADR 0012). */
export const CreateAccountEmailUnavailable: Story = {
  args: { mode: 'sign-up', failure: 'emailUnavailable' },
};

export const CreateAccountFieldErrors: Story = {
  args: { mode: 'sign-up' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(await canvas.findByLabelText('Email'), 'olena@example');
    await userEvent.type(canvas.getByLabelText('Password'), 'abc');
    await userEvent.type(canvas.getByLabelText('Confirm password'), 'abd');
    await userEvent.click(canvas.getByRole('button', { name: 'Create account' }));

    await expect(canvas.getByText('Enter your name.')).toBeInTheDocument();
    await expect(canvas.getByText('Enter an email like name@example.com.')).toBeInTheDocument();
    await expect(canvas.getByText('The passwords don’t match.')).toBeInTheDocument();
  },
};

export const CreateAccountNetworkError: Story = {
  args: { mode: 'sign-up', failure: 'network' },
};
