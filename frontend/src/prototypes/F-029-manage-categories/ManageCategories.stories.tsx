import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { sectionRoutes } from '../../app/routes';
import { AppLayout } from '../../app/shell/AppLayout';
import type { ShellUser } from '../../app/shell/sections';
import { MockFetch } from '../../test/mockFetch';
import { PROTOTYPE_ROUTES } from './fakeApi';
import { ManageCategoriesPage } from './ManageCategoriesPage';

const olena: ShellUser = { name: 'Olena', email: 'olena@example.com' };

/** The app opened on Categories, with the prototype's page in place of the real one; the other pages work too. */
function Prototype() {
  const [router] = useState(() =>
    createMemoryRouter(
      [
        {
          element: <AppLayout user={olena} />,
          children: sectionRoutes.map((route) =>
            route.path === 'categories' ? { ...route, element: <ManageCategoriesPage /> } : route,
          ),
        },
      ],
      { initialEntries: ['/categories'] },
    ),
  );
  return (
    <MockFetch routes={PROTOTYPE_ROUTES}>
      <RouterProvider router={router} />
    </MockFetch>
  );
}

const meta = {
  title: 'Prototypes/F-029 Manage categories',
  component: Prototype,
  parameters: { layout: 'fullscreen' },
  beforeEach: () => {
    localStorage.removeItem('pup.sidebar');
  },
} satisfies Meta<typeof Prototype>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Variant 2, "Tap a tag" (picked 2026-11-11): a tag opens its own sheet (name, group, place, Hide or Delete); a dashed
 * + Add ends each group's tags; a group's pencil opens the group's sheet.
 */
export const Final: Story = {
  name: 'Final prototype',
};
