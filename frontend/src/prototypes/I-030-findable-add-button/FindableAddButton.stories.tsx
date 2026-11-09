import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { sectionRoutes } from '../../app/routes';
import type { ShellUser } from '../../app/shell/sections';
import { MockFetch } from '../../test/mockFetch';
import { PROTOTYPE_ROUTES } from './fakeApi';
import { PrototypeShell, type AddVariant } from './PrototypeShell';

interface PrototypeProps {
  variant: AddVariant;
}

const olena: ShellUser = { name: 'Olena', email: 'olena@example.com' };

/** The app with its pages (Transactions, Accounts, Reports work with fake data) and the variant's Add on the phone. */
function Prototype({ variant }: PrototypeProps) {
  const [router] = useState(() =>
    createMemoryRouter(
      [{ element: <PrototypeShell variant={variant} user={olena} />, children: sectionRoutes }],
      { initialEntries: ['/transactions'] },
    ),
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

/** Variant 1 made full width (owner, round 1): "+ Add transaction" across the phone, a row of its own over the tabs. */
export const Variant4: Story = {
  name: 'Variant 4: Full-width Add transaction',
  args: { variant: 'wide' },
};

/** Variant 3 without names, with Transfer (owner, round 1): three round buttons, − + ⇄, in the types' colours. */
export const Variant5: Story = {
  name: 'Variant 5: Round Expense, Income and Transfer',
  args: { variant: 'rounds' },
};
