import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { expect, within } from 'storybook/test';
import { MockFetch, type MockRoutes } from '../../test/mockFetch';
import { AuthLayout } from './AuthLayout';
import { InviteOnlyNotice, InvitePage } from './InvitePage';
import { SignInForm } from './SignInForm';
import type { AuthFailure } from './authApi';

interface InviteScreenProps {
  screen: 'invite' | 'gone' | 'loading' | 'inviteOnly' | 'signInBlocked' | 'signInGoogleNoInvite';
}

const FAILURES: Partial<Record<InviteScreenProps['screen'], AuthFailure>> = {
  signInBlocked: 'blocked',
  signInGoogleNoInvite: 'inviteOnly',
};

/** The invite page and the invite-only states of sign-in and create account (F-028), with a fake API. */
function InviteScreen({ screen }: InviteScreenProps) {
  const routes: MockRoutes = {
    '/api/auth/me': { status: 204 },
    '/api/invitations/good-token': {
      json: { inviterName: 'Yulia', expiresAt: '2026-11-19T10:00:00Z' },
    },
    '/api/invitations/loading-token': 'pending',
  };
  const token =
    screen === 'gone' ? 'used-token' : screen === 'loading' ? 'loading-token' : 'good-token';
  const failure = FAILURES[screen];
  const element = failure ? (
    <AuthLayout>
      <SignInForm onSubmit={() => undefined} failure={failure} />
    </AuthLayout>
  ) : screen === 'inviteOnly' ? (
    <AuthLayout>
      <InviteOnlyNotice />
    </AuthLayout>
  ) : (
    <AuthLayout withSwitch={false}>
      <InvitePage token={token} />
    </AuthLayout>
  );
  const [router] = useState(() =>
    createMemoryRouter(
      [
        { path: '/invite/:token', element },
        { path: '*', element },
      ],
      {
        initialEntries: [`/invite/${token}`],
      },
    ),
  );

  return (
    <MockFetch routes={routes}>
      <RouterProvider router={router} />
    </MockFetch>
  );
}

const desktop = { viewport: { value: 'desktop', isRotated: false } };

const meta = {
  title: 'Auth/Invite-only',
  component: InviteScreen,
  parameters: { layout: 'fullscreen' },
  args: { screen: 'invite' },
} satisfies Meta<typeof InviteScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

export const InvitePhone: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Yulia invited you to Pup Budget')).toBeInTheDocument();
    await expect(canvas.getByRole('link', { name: 'Continue with Google' })).toHaveAttribute(
      'href',
      '/api/auth/google?invite=good-token',
    );
  },
};

export const InvitePhoneDark: Story = { globals: { colorScheme: 'dark' } };

export const InviteDesktop: Story = { globals: desktop };

export const InviteDesktopDark: Story = { globals: { ...desktop, colorScheme: 'dark' } };

export const InviteLoading: Story = { args: { screen: 'loading' } };

/** A used, expired, cancelled or made-up link: one neutral page. */
export const InviteGone: Story = { args: { screen: 'gone' } };

export const InviteGoneDesktopDark: Story = {
  args: { screen: 'gone' },
  globals: { ...desktop, colorScheme: 'dark' },
};

/** Create account while sign-up is invite-only. */
export const CreateAccountInviteOnly: Story = { args: { screen: 'inviteOnly' } };

export const CreateAccountInviteOnlyDesktop: Story = {
  args: { screen: 'inviteOnly' },
  globals: desktop,
};

/** Back from Google with no account and no invite link. */
export const SignInGoogleNoInvite: Story = { args: { screen: 'signInGoogleNoInvite' } };

/** A blocked person after the right password or Google. */
export const SignInBlocked: Story = {
  args: { screen: 'signInBlocked' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('alert')).toHaveTextContent(
      'Your access to Pup Budget is turned off',
    );
  },
};
