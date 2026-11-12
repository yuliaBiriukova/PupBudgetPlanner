import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { expect, within } from 'storybook/test';
import { MockFetch, type MockRoutes } from '../../test/mockFetch';
import type { MockAnswer } from '../../test/mockRoutes';
import { InviteRoute } from '../auth/InviteRoute';
import type { Family } from './familyApi';
import { fakeFamilyRoutes } from './familyFakeApi';
import { FamilyPage } from './FamilyPage';
import { fakePrivacyRoutes, NOTHING_KEPT, OLENA_KEEPS } from './privacyFakeApi';
import {
  KOVALENKO_PREVIEW,
  KOVALENKO_TOKEN,
  membersFamily,
  otherFamily,
  ownersFamily,
} from './familyTestData';

const OLENA = {
  id: '01a181d1-df7b-7855-98c6-a2e2bc4c26bb',
  displayName: 'Olena',
  email: 'olena@example.com',
  isAdmin: false,
};

interface ScreenProps {
  /** Whose family the page opens with; every change is kept while the story is shown. */
  family?: 'owner' | 'member' | 'none' | 'other';
  /** The page waits for the API, or the API fails. */
  data?: 'loaded' | 'loading' | 'error';
  /** Open Andriy's link to the Kovalenko family instead of the Family page. */
  link?: 'signed-in' | 'someone-new';
  /** What Olena keeps from the family when the page opens (F-030); every change is kept while it is shown. */
  kept?: 'nothing' | 'some';
}

const FAMILIES: Record<NonNullable<ScreenProps['family']>, () => Family | null> = {
  owner: ownersFamily,
  member: membersFamily,
  none: () => null,
  other: otherFamily,
};

/** The Family page (F-023) or a family's invite link, with a fake API that keeps every change. */
function FamilyScreen({ family = 'owner', data = 'loaded', link, kept = 'nothing' }: ScreenProps) {
  const [routes] = useState<MockRoutes>(() => {
    const fake = fakeFamilyRoutes(FAMILIES[family](), {
      links: { [KOVALENKO_TOKEN]: KOVALENKO_PREVIEW },
    });
    // Olena's accounts and categories, and what the family sees of them (F-030)
    const privacy = fakePrivacyRoutes(kept === 'some' ? OLENA_KEEPS : NOTHING_KEPT);
    const familyOf = fake['/api/family'] as () => MockAnswer;
    return {
      ...fake,
      ...privacy.routes,
      '/api/auth/me': link === 'someone-new' ? { status: 204 } : { json: OLENA },
      '/api/family':
        data === 'loading'
          ? 'pending'
          : data === 'error'
            ? { status: 500 }
            : () => {
                const answer = familyOf();
                return typeof answer === 'object' && 'json' in answer
                  ? { json: privacy.withMine(answer.json as Family) }
                  : answer;
              },
    };
  });
  const [router] = useState(() =>
    createMemoryRouter(
      [
        // In <main>, as in the app shell: the page's header isn't the document's banner
        {
          path: '/family',
          element: (
            <main>
              <FamilyPage />
            </main>
          ),
        },
        { path: '/invite/:token', element: <InviteRoute /> },
        { path: '*', element: <main /> },
      ],
      { initialEntries: [link ? `/invite/${KOVALENKO_TOKEN}` : '/family'] },
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
  title: 'Family/Family page',
  component: FamilyScreen,
  args: {},
} satisfies Meta<typeof FamilyScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Olena owns Kovalenko: rename, invite, cancel the waiting link, remove, leave naming the next owner. */
export const Owner: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole('textbox', { name: 'Family name' })).toHaveValue(
      'Kovalenko',
    );
    await expect(canvas.getByText('For Mom')).toBeInTheDocument();
  },
};

export const OwnerDark: Story = { globals: { colorScheme: 'dark' } };

export const OwnerDesktop: Story = { globals: desktop };

export const OwnerDesktopDark: Story = { globals: { ...desktop, colorScheme: 'dark' } };

/** Olena joined Andriy's family: the name as text, no menus, no invite links; she can leave. */
export const Member: Story = {
  args: { family: 'member' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('The family’s owner can change it.')).toBeInTheDocument();
  },
};

export const MemberDesktop: Story = { args: { family: 'member' }, globals: desktop };

/** In no family: start one, or ask for a link. */
export const NoFamily: Story = {
  args: { family: 'none' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole('button', { name: 'Start a family' })).toBeVisible();
  },
};

export const NoFamilyDesktop: Story = { args: { family: 'none' }, globals: desktop };

export const NoFamilyDesktopDark: Story = {
  args: { family: 'none' },
  globals: { ...desktop, colorScheme: 'dark' },
};

export const Loading: Story = { args: { data: 'loading' } };

export const LoadError: Story = {
  args: { data: 'error' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Couldn’t load your family.')).toBeInTheDocument();
  },
};

/** Olena, in no family, opens Andriy's link: who is in it, what joining means, Join family. */
export const JoinLink: Story = {
  args: { family: 'none', link: 'signed-in' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: 'Join the Kovalenko family?' }),
    ).toBeInTheDocument();
  },
};

export const JoinLinkDesktop: Story = {
  args: { family: 'none', link: 'signed-in' },
  globals: desktop,
};

export const JoinLinkDesktopDark: Story = {
  args: { family: 'none', link: 'signed-in' },
  globals: { ...desktop, colorScheme: 'dark' },
};

/** Olena is in Melnyk when Andriy's link reaches her: leave it first. */
export const JoinLinkInAnotherFamily: Story = {
  args: { family: 'other', link: 'signed-in' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: 'You’re already in a family' }),
    ).toBeInTheDocument();
  },
};

/** Someone without an account opens the link: F-028's sign-up, which joins the family too. */
export const JoinLinkSomeoneNew: Story = {
  args: { family: 'none', link: 'someone-new' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText('Andriy invites you to the Kovalenko family'),
    ).toBeInTheDocument();
  },
};

export const JoinLinkSomeoneNewDesktop: Story = {
  args: { family: 'none', link: 'someone-new' },
  globals: desktop,
};

/**
 * What the family sees (F-030): Olena keeps her dollars at home hidden, her Privat card at balance only and Gifts
 * private. The three rows start folded, each with what is set now; every change is kept while the story is shown.
 */
export const WhatTheFamilySees: Story = {
  name: 'What the family sees',
  args: { kept: 'some' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const accounts = await canvas.findByRole('button', { name: /Your accounts/ });
    await expect(accounts).toHaveAttribute('aria-expanded', 'false');
    await expect(await canvas.findByText(/1 balance only, 1 hidden/)).toBeInTheDocument();
  },
};

export const WhatTheFamilySeesDark: Story = {
  name: 'What the family sees, dark',
  args: { kept: 'some' },
  globals: { colorScheme: 'dark' },
};

export const WhatTheFamilySeesDesktop: Story = {
  name: 'What the family sees, desktop',
  args: { kept: 'some' },
  globals: desktop,
};

export const WhatTheFamilySeesDesktopDark: Story = {
  name: 'What the family sees, desktop dark',
  args: { kept: 'some' },
  globals: { ...desktop, colorScheme: 'dark' },
};
