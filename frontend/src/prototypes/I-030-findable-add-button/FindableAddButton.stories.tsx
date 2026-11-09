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
  /** Variant 1: the words on the pill. */
  label?: string;
}

const olena: ShellUser = { name: 'Olena', email: 'olena@example.com' };

/** The app with its pages (Transactions, Accounts, Reports work with fake data) and the variant's Add on the phone. */
function Prototype({ variant, label }: PrototypeProps) {
  const [router] = useState(() =>
    createMemoryRouter(
      [
        {
          element: <PrototypeShell variant={variant} user={olena} label={label} />,
          children: sectionRoutes,
        },
      ],
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

/** Say it in words: a "+ Add transaction" pill floats over the page at the thumb's end; it folds to its + while the page goes down. */
export const Variant1: Story = {
  name: 'Variant 1: Add transaction pill',
  args: { variant: 'pill', label: 'Add transaction' },
  argTypes: { label: { control: 'radio', options: ['Add transaction', 'Add'] } },
};

/** Add is a place in the bar: every tab named, a raised + with "Add" under it in the middle. */
export const Variant2: Story = {
  name: 'Variant 2: Add in the middle of the bar',
  args: { variant: 'centre' },
};

/** As in Monefy: two named buttons in the types' colours, Expense and Income, each opening the form on its type. */
export const Variant3: Story = {
  name: 'Variant 3: Expense and Income buttons',
  args: { variant: 'types' },
};
