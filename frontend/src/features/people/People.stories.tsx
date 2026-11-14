import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { MockFetch, type MockRoutes } from '../../test/mockFetch';
import type { Invitation, Person } from './peopleApi';
import { PeoplePage } from './PeoplePage';

const admin = {
  id: 'p-yulia',
  displayName: 'Yulia Biriukova',
  email: 'yulia@example.com',
  isAdmin: true,
};

const person = (
  id: string,
  displayName: string,
  email: string,
  extra: Partial<Person> = {},
): Person => ({
  id,
  displayName,
  email,
  joinedAt: '2026-11-06T10:00:00Z',
  isAdmin: false,
  isYou: false,
  invited: true,
  invitationNote: `For ${displayName.split(' ')[0] ?? ''}`,
  blockedAt: null,
  ...extra,
});

const PEOPLE: Person[] = [
  person(admin.id, admin.displayName, admin.email, {
    joinedAt: '2026-10-27T10:00:00Z',
    isAdmin: true,
    isYou: true,
    invited: false,
    invitationNote: null,
  }),
  person('p-andrii', 'Andrii Bondar', 'andrii.bondar@example.com', {
    joinedAt: '2026-11-08T10:00:00Z',
  }),
  person('p-dmytro', 'Dmytro Lysenko', 'd.lysenko@example.com', { invitationNote: 'For Dima' }),
  person('p-iryna', 'Iryna Melnyk', 'iryna.melnyk@example.com', { invitationNote: 'For Ira' }),
  person('p-max', 'Max', 'max.trial@example.com', {
    joinedAt: '2026-10-30T10:00:00Z',
    invited: false,
    invitationNote: null,
    blockedAt: '2026-11-10T10:00:00Z',
  }),
  person('p-oksana', 'Oksana Melnychuk', 'oksana.m@example.com'),
  person('p-vlad', 'Vlad', 'vlad@example.com', {
    joinedAt: '2026-10-28T10:00:00Z',
    invited: false,
    invitationNote: null,
  }),
];

const link = (
  id: string,
  note: string | null,
  status: Invitation['status'],
  extra: Partial<Invitation> = {},
): Invitation => ({
  id,
  note,
  status,
  createdAt: '2026-11-10T10:00:00Z',
  expiresAt: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
  usedAt: null,
  usedByName: null,
  cancelledAt: null,
  ...extra,
});

const LINKS: Invitation[] = [
  link('l-petro', 'For Petro', 'Waiting', {
    expiresAt: new Date(Date.now() + 6 * 24 * 3600 * 1000).toISOString(),
  }),
  link('l-mom', 'For Mom', 'Waiting'),
  link('l-ira', 'For Ira', 'Used', { usedAt: '2026-11-06T10:00:00Z', usedByName: 'Iryna Melnyk' }),
  link('l-dima', 'For Dima', 'Used', {
    usedAt: '2026-11-10T10:00:00Z',
    usedByName: 'Dmytro Lysenko',
  }),
  link('l-taras', 'For Taras', 'Expired', { expiresAt: '2026-11-09T10:00:00Z' }),
  link('l-test', null, 'Cancelled', { cancelledAt: '2026-11-04T10:00:00Z' }),
];

/** More people than one action takes (the dev database after many test runs). */
const MANY: Person[] = [
  ...PEOPLE,
  ...Array.from({ length: 205 }, (_, i) => {
    const n = String(i + 1).padStart(3, '0');
    return person(`p-test-${n}`, `Test ${n}`, `test-${n}@example.com`);
  }),
];

interface ScreenProps {
  tab: 'people' | 'links';
  people?: 'data' | 'loading' | 'error' | 'many';
  links?: 'data' | 'none' | 'loading' | 'error';
}

/** The links' fake API (I-006), keeping cancels and deletes while the story is shown. */
function linkRoutes(start: Invitation[]): MockRoutes {
  let links = [...start];
  const idsOf = (body: unknown) => (body as { ids?: string[] } | null)?.ids ?? [];
  return {
    '/api/admin/invitations': () => ({ json: links }),
    'POST /api/admin/invitations/cancel': (body) => {
      const ids = idsOf(body);
      const count = links.filter((l) => ids.includes(l.id) && l.status === 'Waiting').length;
      links = links.map((l) =>
        ids.includes(l.id) && l.status === 'Waiting'
          ? { ...l, status: 'Cancelled', cancelledAt: new Date().toISOString() }
          : l,
      );
      return { json: { count } };
    },
    'POST /api/admin/invitations/delete': (body) => {
      const ids = idsOf(body);
      const before = links.length;
      links = links.filter((l) => !ids.includes(l.id));
      return { json: { count: before - links.length } };
    },
  };
}

/** The People page with a fake API: who is signed in, the people and the links. */
function PeopleScreen({ tab, people = 'data', links = 'data' }: ScreenProps) {
  const [linkApi] = useState(() =>
    links === 'loading'
      ? { '/api/admin/invitations': 'pending' as const }
      : links === 'error'
        ? { '/api/admin/invitations': { status: 500 } }
        : linkRoutes(links === 'none' ? [] : LINKS),
  );
  const routes: MockRoutes = {
    ...linkApi,
    '/api/auth/me': { json: admin },
    '/api/health': { json: { status: 'Healthy' } },
    '/api/admin/people':
      people === 'loading'
        ? 'pending'
        : people === 'error'
          ? { status: 500 }
          : { json: people === 'many' ? MANY : PEOPLE },
    'POST /api/admin/invitations': {
      json: {
        id: 'l-new',
        token: 'q7Rk2mVx9pLw4TfZ8nHcWq7Rk2mVx9pLw4TfZ8nHcWq',
        note: 'For Olena',
        expiresAt: '2026-11-19T10:00:00Z',
      },
    },
  };
  const [router] = useState(() =>
    createMemoryRouter(
      [
        { path: '/people', element: <PeoplePage tab="people" /> },
        { path: '/people/links', element: <PeoplePage tab="links" /> },
      ],
      { initialEntries: [tab === 'people' ? '/people' : '/people/links'] },
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
  title: 'People/People page',
  component: PeopleScreen,
  args: { tab: 'people' },
} satisfies Meta<typeof PeopleScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

export const PeoplePhone: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Iryna Melnyk')).toBeInTheDocument();
    await expect(
      canvas.queryByRole('checkbox', { name: 'Pick Yulia Biriukova' }),
    ).not.toBeInTheDocument();
  },
};

export const PeoplePhoneDark: Story = { globals: { colorScheme: 'dark' } };

export const PeopleDesktop: Story = { globals: desktop };

export const PeopleDesktopDark: Story = { globals: { ...desktop, colorScheme: 'dark' } };

export const PeopleLoading: Story = { args: { people: 'loading' } };

export const PeopleError: Story = { args: { people: 'error' } };

/** Searching by part of a name; the count says how many match. */
export const PeopleSearch: Story = {
  globals: desktop,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(await canvas.findByLabelText('Search people'), 'melny');
    await expect(canvas.getByText('2 of 7')).toBeInTheDocument();
  },
};

export const PeopleNoMatch: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(await canvas.findByLabelText('Search people'), 'zoryana');
    await expect(
      canvas.getByRole('heading', { name: 'No one matches “zoryana”' }),
    ).toBeInTheDocument();
  },
};

/** Two people picked: the bar with Block and Delete for both. */
export const PeoplePicked: Story = {
  globals: desktop,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('checkbox', { name: 'Pick Iryna Melnyk' }));
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Pick Andrii Bondar' }));
    await expect(canvas.getByRole('region', { name: 'Picked people' })).toHaveTextContent(
      '2 picked',
    );
  },
};

/** Pick all shown with more than 200 people: picking stops at the most one action takes. */
export const PeopleAtMax: Story = {
  args: { people: 'many' },
  globals: desktop,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('checkbox', { name: 'Pick all shown' }));
    await expect(canvas.getByRole('region', { name: 'Picked people' })).toHaveTextContent(
      'That’s the most at once',
    );
  },
};

/**
 * The same on the phone. Its list has no header, so no Pick all shown to tap: the story clicks the hidden one
 * (picking 200 rows one by one would redraw the list 200 times).
 */
export const PeopleAtMaxPhone: Story = {
  args: { people: 'many' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(
      () => {
        canvasElement
          .querySelector<HTMLInputElement>('input[aria-label="Pick all shown"]')
          ?.click();
        // Throws until the bar is there, so waitFor tries again
        canvas.getByRole('region', { name: 'Picked people' });
      },
      { timeout: 10000 },
    );
    await expect(canvas.getByRole('region', { name: 'Picked people' })).toHaveTextContent(
      'That’s the most at once',
    );
  },
};

/** The row's ⋯ menu for one person. */
export const PersonMenu: Story = {
  globals: desktop,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: 'Actions for Max' }));
    const body = within(canvasElement.ownerDocument.body);
    await expect(await body.findByRole('menuitem', { name: 'Unblock' })).toBeInTheDocument();
  },
};

/** Delete asks for the email before the button works. */
export const DeleteOne: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: 'Actions for Andrii Bondar' }));
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole('menuitem', { name: 'Delete account' }));
    await expect(await body.findByRole('button', { name: 'Delete account' })).toBeDisabled();
  },
};

export const LinksPhone: Story = { args: { tab: 'links' } };

export const LinksDesktopDark: Story = {
  args: { tab: 'links' },
  globals: { ...desktop, colorScheme: 'dark' },
};

/** No links at all: one line says how to make one, no groups (I-032). */
export const LinksNone: Story = { args: { tab: 'links', links: 'none' } };

export const LinksLoading: Story = { args: { tab: 'links', links: 'loading' } };

export const LinksError: Story = { args: { tab: 'links', links: 'error' } };

/** Every group starts as at first: Waiting open, the others folded (I-006, B-027). */
const freshFolds = () => {
  localStorage.removeItem('pup.people.links.open');
};

/** Used and Expired and cancelled opened. */
export const LinksAllOpen: Story = {
  args: { tab: 'links' },
  globals: desktop,
  beforeEach: freshFolds,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: /Used/ }));
    await userEvent.click(canvas.getByRole('button', { name: /Expired and cancelled/ }));
    await expect(canvas.getByText('For Taras')).toBeInTheDocument();
  },
};

/** A waiting link and the whole folded Used group picked: the bar has Cancel links and Delete (I-006). */
export const LinksPicked: Story = {
  args: { tab: 'links' },
  beforeEach: freshFolds,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('checkbox', { name: 'Pick For Mom' }));
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Select all used links' }));
    await expect(canvas.getByRole('region', { name: 'Picked links' })).toHaveTextContent(
      '3 picked',
    );
  },
};

/** Delete asks once, lists the links and says the waiting one stops working. */
export const LinksDeleteConfirm: Story = {
  args: { tab: 'links' },
  globals: desktop,
  beforeEach: freshFolds,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('checkbox', { name: 'Pick For Mom' }));
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Select all used links' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Delete' }));
    const body = within(canvasElement.ownerDocument.body);
    await expect(await body.findByRole('dialog', { name: 'Delete 3 links?' })).toBeInTheDocument();
  },
};

/** Cancel links asks once for the waiting ones only. */
export const LinksCancelConfirm: Story = {
  args: { tab: 'links' },
  beforeEach: freshFolds,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole('checkbox', { name: 'Select all waiting links' }),
    );
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Select all used links' }));
    const bar = canvas.getByRole('region', { name: 'Picked links' });
    await userEvent.click(within(bar).getByRole('button', { name: /Cancel/ }));
    const body = within(canvasElement.ownerDocument.body);
    await expect(await body.findByRole('dialog', { name: 'Cancel 2 links?' })).toBeInTheDocument();
  },
};

/** Expired and cancelled cleared with its Select all and Delete: the empty group goes away (I-032, B-027). */
export const LinksGroupCleared: Story = {
  args: { tab: 'links' },
  globals: desktop,
  beforeEach: freshFolds,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole('checkbox', { name: 'Select all expired and cancelled links' }),
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Delete' }));
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole('button', { name: 'Delete 2 links' }));
    await expect(await body.findByText('2 links deleted')).toBeInTheDocument();
    await waitFor(() =>
      expect(
        canvas.queryByRole('heading', { name: 'Expired and cancelled' }),
      ).not.toBeInTheDocument(),
    );
    await expect(canvas.getByRole('heading', { name: 'Used' })).toBeInTheDocument();
  },
};

/** New invite link: the note, then the link shown once with Copy link. */
export const NewLink: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: 'New invite link' }));
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.type(
      await body.findByLabelText('Who is it for? (optional, only you see it)'),
      'For Olena',
    );
    await userEvent.click(body.getByRole('button', { name: 'Create link' }));
    await expect(await body.findByRole('button', { name: 'Copy link' })).toBeInTheDocument();
  },
};
