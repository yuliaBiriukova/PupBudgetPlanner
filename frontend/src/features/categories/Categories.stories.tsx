import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from '@mantine/core';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { MockFetch, type MockRoutes } from '../../test/mockFetch';
import { CategoriesPage } from './CategoriesPage';
import { fakeCategoriesRoutes } from './categoriesFakeApi';
import { DEFAULT_CATEGORIES, EDITED_CATEGORIES, NO_CATEGORIES } from './categoriesTestData';

interface ScreenProps {
  /**
   * `categories`: the default set; `edited`: with a hidden category (Netflix) and a hidden group (Car); `failing`:
   * every change answered with an error.
   */
  data?: 'categories' | 'edited' | 'failing' | 'empty' | 'loading' | 'error';
  /** Ids of the open groups on this device, the last one shown on the desktop; none stored: only the first. */
  open?: string[];
}

/** The Categories page with a fake API (F-015) that keeps the changes while the story is shown (F-029). */
function CategoriesScreen({ data = 'categories', open }: ScreenProps) {
  if (open) localStorage.setItem('pup.categories.open', JSON.stringify(open));
  else localStorage.removeItem('pup.categories.open');
  const [routes] = useState<MockRoutes>(() =>
    data === 'loading'
      ? { '/api/categories': 'pending' }
      : data === 'error'
        ? { '/api/categories': { status: 500 } }
        : fakeCategoriesRoutes(
            data === 'empty'
              ? NO_CATEGORIES
              : data === 'edited'
                ? EDITED_CATEGORIES
                : DEFAULT_CATEGORIES,
            { fail: data === 'failing' },
          ),
  );

  // In <main>, as in the app shell: the page's header isn't the document's banner. Full screen with the page's own
  // padding: Storybook's padded body moved the phone's sheets 16 px to the right
  return (
    <MockFetch routes={routes}>
      <Box component="main" p="md">
        <CategoriesPage />
      </Box>
    </MockFetch>
  );
}

const ALL_GROUPS = DEFAULT_CATEGORIES.groups.map((group) => group.id);
const tablet = { viewport: { value: 'tablet', isRotated: false } };
const desktop = { viewport: { value: 'desktop', isRotated: false } };

const meta = {
  title: 'Categories/Categories page',
  component: CategoriesScreen,
  parameters: { layout: 'fullscreen' },
  args: {},
} satisfies Meta<typeof CategoriesScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The first visit: every group folded but Income. */
export const Phone: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('33 categories in 7 groups')).toBeInTheDocument();
  },
};

export const PhoneDark: Story = { globals: { colorScheme: 'dark' } };

/** Opening another group: Income stays open too. */
export const PhoneOpenAnother: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const home = await canvas.findByRole('button', { name: /Home expenses/ });
    await userEvent.click(home);
    await expect(home).toHaveAttribute('aria-expanded', 'true');
    await expect(canvas.getByRole('button', { name: /Income/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  },
};

/** Health was picked on the desktop: only Health is open. */
export const PickedOnDesktop: Story = { args: { open: ['group-4'] } };

export const AllOpen: Story = { args: { open: ALL_GROUPS } };

export const AllFolded: Story = { args: { open: [] } };

export const Tablet: Story = { args: { open: ['group-1', 'group-4'] }, globals: tablet };

export const Desktop: Story = { globals: desktop };

export const DesktopDark: Story = { globals: { ...desktop, colorScheme: 'dark' } };

/** Another group picked in the list: its categories come in beside it. */
export const DesktopAnotherGroup: Story = {
  globals: desktop,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const index = await canvas.findByRole('navigation', { name: 'Category groups' });
    await userEvent.click(within(index).getByRole('button', { name: /^Home expenses/ }));
    await expect(canvas.getByRole('region', { name: 'Home expenses' })).toHaveTextContent(
      'Expenses, 9 categories',
    );
  },
};

/** Dialogs and sheets open in a portal on the page's body. */
const page = (canvasElement: HTMLElement) => within(canvasElement.ownerDocument.body);

/** A tap on a tag opens its sheet: name, group, place in the group, Hide at the end (F-029). */
export const CategorySheet: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole('button', { name: 'Gifts' }));
    await expect(
      await page(canvasElement).findByRole('dialog', { name: 'Edit category' }),
    ).toBeVisible();
  },
};

export const CategorySheetDark: Story = { ...CategorySheet, globals: { colorScheme: 'dark' } };

/** A name in use in the group says so under the field. */
export const NameInUse: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(
      await within(canvasElement).findByRole('button', { name: 'Add a category to Income' }),
    );
    const sheet = await page(canvasElement).findByRole('dialog', { name: 'New category' });
    await userEvent.type(within(sheet).getByRole('textbox', { name: 'Name' }), 'salary');
    await expect(within(sheet).getByText('“Salary” is already in Income')).toBeVisible();
  },
};

/** A hidden category's name offers to show it again. */
export const HiddenNameInUse: Story = {
  args: { data: 'edited', open: ['group-7'] },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      await within(canvasElement).findByRole('button', {
        name: 'Add a category to Subscriptions',
      }),
    );
    const sheet = await page(canvasElement).findByRole('dialog', { name: 'New category' });
    await userEvent.type(within(sheet).getByRole('textbox', { name: 'Name' }), 'Netflix');
    await expect(within(sheet).getByRole('button', { name: 'Show it again' })).toBeVisible();
  },
};

/** Removing a category with transactions hides it: asked first, with what it keeps. */
export const HideAsked: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole('button', { name: 'Salary' }));
    const sheet = await page(canvasElement).findByRole('dialog', { name: 'Edit category' });
    await userEvent.click(within(sheet).getByRole('button', { name: 'Hide' }));
    await expect(
      await page(canvasElement).findByRole('dialog', { name: 'Hide “Salary”?' }),
    ).toBeVisible();
  },
};

/** Removing one nobody used deletes it: asked first. */
export const DeleteAsked: Story = {
  args: { open: ['group-2'] },
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole('button', { name: 'Tax' }));
    const sheet = await page(canvasElement).findByRole('dialog', { name: 'Edit category' });
    await userEvent.click(within(sheet).getByRole('button', { name: 'Delete' }));
    await expect(
      await page(canvasElement).findByRole('dialog', { name: 'Delete “Tax”?' }),
    ).toBeVisible();
  },
};

/** Hidden ones: Netflix dashed after + Add, the hidden group Car at the end of the expenses with Show. */
export const Hidden: Story = { args: { data: 'edited', open: ['group-7'] } };

export const HiddenDark: Story = { ...Hidden, globals: { colorScheme: 'dark' } };

/** A hidden category's sheet: what it keeps, and Show again. */
export const HiddenCategorySheet: Story = {
  args: { data: 'edited', open: ['group-7'] },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      await within(canvasElement).findByRole('button', { name: 'Netflix, hidden' }),
    );
    await expect(
      await page(canvasElement).findByRole('dialog', { name: '“Netflix” is hidden' }),
    ).toBeVisible();
  },
};

/** A group's sheet: its name, its place among the expense groups, and why it can't go yet. */
export const GroupSheet: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(
      await within(canvasElement).findByRole('button', { name: 'Edit the group Health' }),
    );
    await expect(
      await page(canvasElement).findByRole('dialog', { name: 'Edit group' }),
    ).toHaveTextContent('It still has 4 categories.');
  },
};

/** + Add expense group: the kind as pills, placed at the end of the expense groups. */
export const NewGroup: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(
      await within(canvasElement).findByRole('button', { name: 'Add expense group' }),
    );
    await expect(
      await page(canvasElement).findByRole('dialog', { name: 'New group' }),
    ).toBeVisible();
  },
};

/** On the desktop the sheet is a dialog; the name takes the cursor. */
export const DesktopCategorySheet: Story = {
  globals: desktop,
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole('button', { name: 'Salary' }));
    await expect(
      await page(canvasElement).findByRole('dialog', { name: 'Edit category' }),
    ).toBeVisible();
  },
};

export const DesktopGroupSheetDark: Story = {
  globals: { ...desktop, colorScheme: 'dark' },
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole('button', { name: 'Edit group' }));
    await expect(
      await page(canvasElement).findByRole('dialog', { name: 'Edit group' }),
    ).toBeVisible();
  },
};

/** A change that didn't go through: the sheet stays open and says so. */
export const SaveFailed: Story = {
  args: { data: 'failing' },
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole('button', { name: 'Gifts' }));
    const sheet = await page(canvasElement).findByRole('dialog', { name: 'Edit category' });
    await userEvent.click(within(sheet).getByRole('button', { name: 'Save' }));
    await expect(await within(sheet).findByRole('alert')).toBeVisible();
  },
};

export const Loading: Story = { args: { data: 'loading' } };

export const CouldNotLoad: Story = { args: { data: 'error' } };

export const Empty: Story = { args: { data: 'empty' } };
