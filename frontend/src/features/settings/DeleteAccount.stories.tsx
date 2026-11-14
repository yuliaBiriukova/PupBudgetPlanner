import { Box } from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { expect, screen, userEvent, within } from 'storybook/test';
import { MockFetch, type MockRoutes } from '../../test/mockFetch';
import { OVERVIEW } from '../accounts/accountsTestData';
import { membersFamily, ownersFamily } from '../family/familyTestData';
import { AccountDeletedPage } from './AccountDeletedPage';
import type { DeletionSummary } from './deleteAccountApi';
import { SettingsPage } from './SettingsPage';

interface ScreenProps {
  /** How the person confirms: their password, Google (back from it confirmed), or the admin, who can't delete. */
  who?: 'password' | 'google' | 'google-confirmed' | 'admin';
  /** The family's owner with others (picks who looks after it next), a member, or in no family. */
  family?: 'owner' | 'member' | 'none';
  /** What Delete for good gets: the account deleted, an answer that never comes, a wrong password, a failure. */
  answer?: 'deleted' | 'pending' | 'wrong-password' | 'fails';
  /** Opens on the page after deleting instead of Settings. */
  page?: 'settings' | 'deleted';
}

const SUMMARY: DeletionSummary = {
  accounts: 9,
  transactions: 1284,
  categories: 46,
  hasPassword: true,
  canDelete: true,
  googleConfirmed: false,
};

/** Settings with Delete account (F-027) and the page after it, on a fake API. */
function DeleteAccountScreen({
  who = 'password',
  family = 'none',
  answer = 'deleted',
  page = 'settings',
}: ScreenProps) {
  const routes: MockRoutes = {
    '/api/auth/me': {
      json: {
        id: 'olena',
        displayName: 'Olena',
        email: 'olena@example.com',
        isAdmin: who === 'admin',
      },
    },
    '/api/settings': {
      json: { displayName: 'Olena', email: 'olena@example.com', reportCurrency: 'UAH' },
    },
    '/api/accounts': { json: OVERVIEW },
    '/api/accounts/total': { status: 503 },
    '/api/me/deletion': {
      json: {
        ...SUMMARY,
        hasPassword: who === 'password' || who === 'admin',
        canDelete: who !== 'admin',
        googleConfirmed: who === 'google-confirmed',
      },
    },
    '/api/family':
      family === 'owner'
        ? { json: ownersFamily() }
        : family === 'member'
          ? { json: membersFamily() }
          : { status: 204 },
    'POST /api/me/delete': () =>
      answer === 'pending'
        ? 'pending'
        : answer === 'wrong-password'
          ? { status: 400, json: { errors: { password: ['That password isn’t right.'] } } }
          : answer === 'fails'
            ? { status: 500 }
            : { status: 204 },
  };

  const [router] = useState(() =>
    createMemoryRouter(
      [
        { path: '/account-deleted', element: <AccountDeletedPage /> },
        {
          path: '*',
          // In <main> with the shell's 16 px gutter (Mantine's md), as in the app
          element: (
            <Box component="main" p="md">
              <SettingsPage />
            </Box>
          ),
        },
      ],
      {
        initialEntries: [
          page === 'deleted'
            ? '/account-deleted'
            : who === 'google-confirmed'
              ? '/settings?delete=google'
              : '/settings',
        ],
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

const openDialog = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement);
  await userEvent.click(await canvas.findByRole('button', { name: 'Delete account' }));
  const dialog = await screen.findByRole('dialog', { name: 'Delete your account?' });
  await within(dialog).findByText(/^9 accounts/);
  return dialog;
};

const fillIn = async (dialog: HTMLElement) => {
  await userEvent.type(within(dialog).getByLabelText('Your password'), 'correct horse');
  await userEvent.type(within(dialog).getByLabelText('Type DELETE to confirm'), 'DELETE');
};

const meta = {
  title: 'Settings/Delete account',
  component: DeleteAccountScreen,
  parameters: { layout: 'fullscreen' },
  args: {},
} satisfies Meta<typeof DeleteAccountScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The section at the end of Settings. */
export const Section: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = await canvas.findByRole('button', { name: 'Delete account' });
    button.scrollIntoView({ block: 'center' });
    await expect(button).toBeVisible();
  },
};

/** The sheet on the phone, as the family's owner: what goes, who looks after the family, the password, the word. */
export const DialogPhone: Story = {
  args: { family: 'owner' },
  play: async ({ canvasElement }) => {
    const dialog = await openDialog(canvasElement);
    await expect(within(dialog).getByRole('radiogroup')).toBeVisible();
  },
};

export const DialogDesktop: Story = {
  args: { family: 'owner' },
  globals: desktop,
  play: async ({ canvasElement }) => {
    await openDialog(canvasElement);
  },
};

export const DialogDesktopDark: Story = {
  args: { family: 'member' },
  globals: { ...desktop, colorScheme: 'dark' },
  play: async ({ canvasElement }) => {
    await openDialog(canvasElement);
  },
};

/** Nothing filled in: each part says what it needs. */
export const Errors: Story = {
  args: { family: 'owner' },
  play: async ({ canvasElement }) => {
    const dialog = await openDialog(canvasElement);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete for good' }));
    await expect(within(dialog).getByText('Type DELETE to confirm.')).toBeVisible();
  },
};

/** Someone with only Google, before confirming with it. */
export const Google: Story = {
  args: { who: 'google' },
  play: async ({ canvasElement }) => {
    const dialog = await openDialog(canvasElement);
    await expect(within(dialog).getByRole('link', { name: 'Confirm with Google' })).toBeVisible();
  },
};

/** Back from Google: the dialog opens again, confirmed. */
export const GoogleConfirmed: Story = {
  args: { who: 'google-confirmed' },
  globals: desktop,
  play: async () => {
    const dialog = await screen.findByRole('dialog', { name: 'Delete your account?' });
    await expect(
      await within(dialog).findByText('Confirmed with Google as olena@example.com'),
    ).toBeVisible();
  },
};

/** The admin can't delete their account: a line why, no button. */
export const Admin: Story = {
  args: { who: 'admin' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText(/You look after Pup Budget/)).toBeVisible();
  },
};

/** Deleting: the red button's loader. */
export const Deleting: Story = {
  args: { answer: 'pending' },
  globals: desktop,
  play: async ({ canvasElement }) => {
    const dialog = await openDialog(canvasElement);
    await fillIn(dialog);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete for good' }));
  },
};

export const WrongPassword: Story = {
  args: { answer: 'wrong-password' },
  play: async ({ canvasElement }) => {
    const dialog = await openDialog(canvasElement);
    await fillIn(dialog);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete for good' }));
    await expect(await within(dialog).findByText('That password isn’t right.')).toBeVisible();
  },
};

export const CouldNotDelete: Story = {
  args: { answer: 'fails' },
  globals: desktop,
  play: async ({ canvasElement }) => {
    const dialog = await openDialog(canvasElement);
    await fillIn(dialog);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete for good' }));
    await expect(
      await within(dialog).findByText('That didn’t go through. Try again in a moment.'),
    ).toBeVisible();
  },
};

/** After deleting: signed out, on the sign-in frame. */
export const AccountDeletedPhone: Story = { args: { page: 'deleted' } };

export const AccountDeletedDesktopDark: Story = {
  args: { page: 'deleted' },
  globals: { ...desktop, colorScheme: 'dark' },
};
