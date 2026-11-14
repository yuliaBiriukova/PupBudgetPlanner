import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { expect, userEvent, within } from 'storybook/test';
import { AuthLayout } from '../auth/AuthLayout';
import { SignInForm } from '../auth/SignInForm';
import { PrivacyPolicyPage } from './PrivacyPolicyPage';

/**
 * The privacy policy (F-031) with Sign in behind it, as when it is opened from the sign-in page's link: Back returns
 * there. Storybook has no contact address set, so the page names the person who runs Pup Budget.
 */
function PrivacyScreen() {
  const [router] = useState(() =>
    createMemoryRouter(
      [
        {
          path: '/sign-in',
          element: (
            <AuthLayout>
              <SignInForm onSubmit={() => undefined} pending={false} failure={null} />
            </AuthLayout>
          ),
        },
        { path: '/privacy', element: <PrivacyPolicyPage /> },
      ],
      { initialEntries: ['/sign-in', '/privacy'], initialIndex: 1 },
    ),
  );
  return <RouterProvider router={router} />;
}

const desktop = { viewport: { value: 'desktop', isRotated: false } };

const meta = {
  title: 'Privacy/Privacy policy',
  component: PrivacyScreen,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof PrivacyScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

/** On the phone the contents fold under the intro; picking a section closes them. */
export const Phone: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { level: 1, name: 'Privacy policy' }),
    ).toBeVisible();
    // Only below the desktop's width: from there the contents stay beside the text instead
    const fold = canvas.queryByRole('button', { name: 'On this page' });
    if (!fold) return;
    await expect(fold).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(fold);
    await expect(fold).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(fold);
  },
};

export const PhoneDark: Story = {
  globals: { colorScheme: 'dark' },
};

/** On the desktop the contents stay beside the text and mark the section being read. */
export const Desktop: Story = {
  globals: desktop,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('heading', { level: 1, name: 'Privacy policy' });
    // The section being read is marked in the contents (beside the text from the desktop's width)
    await expect(canvasElement.querySelector('[aria-current="location"]')).toHaveTextContent(
      'What Pup Budget keeps',
    );
  },
};

export const DesktopDark: Story = {
  globals: { ...desktop, colorScheme: 'dark' },
};

/** Back returns to the page the policy was opened from (here Sign in). */
export const BackToSignIn: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: 'Back' }));
    await expect(await canvas.findByRole('button', { name: 'Sign in' })).toBeVisible();
  },
};
