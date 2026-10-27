import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { expect, userEvent, within } from 'storybook/test';
import { routes } from '../routes';
import { AppLayout } from './AppLayout';
import type { ShellUser } from './sections';
import { healthQuery } from './useServerWake';

interface ShellStoryProps {
  path: string;
  user?: ShellUser;
}

/** A query cache where the API has already answered its health check. */
function awakeQueryClient() {
  const queryClient = new QueryClient();
  queryClient.setQueryData(healthQuery.queryKey, true);
  return queryClient;
}

/** The shell with the app's pages, at a given address; the API counts as awake, so no request is made. */
function ShellStory({ path, user }: ShellStoryProps) {
  const [router] = useState(() =>
    createMemoryRouter([{ element: <AppLayout user={user} />, children: routes[0]?.children }], {
      initialEntries: [path],
    }),
  );
  const [client] = useState(awakeQueryClient);

  return (
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

const yulia: ShellUser = { name: 'Yulia', email: 'yulia@example.com' };
const desktop = { viewport: { value: 'desktop', isRotated: false } };

const meta = {
  title: 'Shell/AppLayout',
  component: ShellStory,
  parameters: { layout: 'fullscreen' },
  args: { path: '/transactions' },
  // Each story starts with the sidebar's default state, not what the previous one left
  beforeEach: () => {
    localStorage.removeItem('pup.sidebar');
  },
} satisfies Meta<typeof ShellStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Phone: Story = {};

export const PhoneDark: Story = {
  globals: { colorScheme: 'dark' },
};

export const PhoneSignedIn: Story = {
  args: { user: yulia },
};

export const PhoneMoreOpen: Story = {
  args: { path: '/family', user: yulia },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: 'More' }));

    const sheet = await within(document.body).findByRole('dialog', { name: 'More' });
    await expect(within(sheet).getByRole('link', { name: 'Family' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  },
};

export const PhoneAddOpen: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: 'Add transaction' }));

    await expect(
      await within(document.body).findByRole('dialog', { name: 'Add transaction' }),
    ).toBeInTheDocument();
  },
};

export const Desktop: Story = {
  globals: desktop,
  args: { user: yulia },
};

export const DesktopDark: Story = {
  globals: { ...desktop, colorScheme: 'dark' },
  args: { user: yulia },
};

export const DesktopSignedOut: Story = {
  globals: desktop,
};

export const DesktopCollapsed: Story = {
  globals: desktop,
  args: { user: yulia },
  beforeEach: () => {
    localStorage.setItem('pup.sidebar', JSON.stringify({ width: 248, collapsed: true }));
  },
};

export const DesktopCollapsesAndExpands: Story = {
  globals: desktop,
  args: { user: yulia },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const handle = await canvas.findByRole('separator', { name: 'Resize sidebar' });

    await userEvent.click(canvas.getByRole('button', { name: 'Collapse sidebar' }));
    await expect(handle).toHaveAttribute('aria-valuetext', 'Collapsed');
    await expect(canvas.getByRole('button', { name: 'Expand sidebar' })).toHaveFocus();

    await userEvent.click(canvas.getByRole('button', { name: 'Expand sidebar' }));
    await expect(handle).toHaveAttribute('aria-valuetext', '248 pixels');
  },
};

export const NotFound: Story = {
  globals: desktop,
  args: { path: '/no-such-page' },
};
