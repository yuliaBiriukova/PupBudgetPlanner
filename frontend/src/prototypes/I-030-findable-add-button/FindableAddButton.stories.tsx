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

/** Round 3: Expense, the most used, big and filled at the thumb's end; Income and Transfer small beside it. */
export const Variant6: Story = {
  name: 'Variant 6: Big Expense, small Income and Transfer',
  args: { variant: 'bigExpense' },
};

/** Round 3: one bar for everything, the four places as icons on the left and ⇄ + − on the right. */
export const Variant7: Story = {
  name: 'Variant 7: The three in the bar',
  args: { variant: 'inBar' },
};

/** Round 3: one charcoal + that opens ⇄ + − above it; the page stays clear until it is tapped. */
export const Variant8: Story = {
  name: 'Variant 8: One + that opens the three',
  args: { variant: 'dial' },
};

/** Round 3: the three in a row of their own over the named tabs, in the middle of the phone; nothing floats. */
export const Variant9: Story = {
  name: 'Variant 9: The three in a row over the tabs',
  args: { variant: 'row' },
};
