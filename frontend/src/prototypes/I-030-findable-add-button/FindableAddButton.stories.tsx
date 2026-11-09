import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { sectionRoutes } from '../../app/routes';
import type { ShellUser } from '../../app/shell/sections';
import { MockFetch } from '../../test/mockFetch';
import { PROTOTYPE_ROUTES } from './fakeApi';
import { PrototypeShell } from './PrototypeShell';

const olena: ShellUser = { name: 'Olena', email: 'olena@example.com' };

/** The app with its pages (Transactions, Accounts, Reports work with fake data) and the new bottom on the phone. */
function Prototype() {
  const [router] = useState(() =>
    createMemoryRouter([{ element: <PrototypeShell user={olena} />, children: sectionRoutes }], {
      initialEntries: ['/transactions'],
    }),
  );
  return (
    <MockFetch routes={PROTOTYPE_ROUTES}>
      <RouterProvider router={router} />
    </MockFetch>
  );
}

const meta = {
  title: 'Prototypes/I-030 Findable add button',
  component: Prototype,
  parameters: { layout: 'fullscreen' },
  beforeEach: () => {
    localStorage.removeItem('pup.sidebar');
  },
} satisfies Meta<typeof Prototype>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Variant 8 with the owner's change (round 3): one + floating at the thumb's end opens ⇄ + − above it; the four named
 * places under it, the open one in the accent with no pill behind it.
 */
export const Final: Story = {
  name: 'Final prototype',
};
