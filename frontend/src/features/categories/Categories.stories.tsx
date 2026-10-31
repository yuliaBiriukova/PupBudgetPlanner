import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { MockFetch, type MockRoutes } from '../../test/mockFetch';
import { CategoriesPage } from './CategoriesPage';
import { DEFAULT_CATEGORIES, NO_CATEGORIES } from './categoriesTestData';

interface ScreenProps {
  data?: 'categories' | 'empty' | 'loading' | 'error';
  /** Ids of the groups folded on this device (phone and tablet). */
  folded?: string[];
}

/** The Categories page with a fake API (F-015). */
function CategoriesScreen({ data = 'categories', folded = [] }: ScreenProps) {
  localStorage.setItem('pup.categories.folded', JSON.stringify(folded));
  const routes: MockRoutes = {
    '/api/categories':
      data === 'loading'
        ? 'pending'
        : data === 'error'
          ? { status: 500 }
          : { json: data === 'empty' ? NO_CATEGORIES : DEFAULT_CATEGORIES },
  };

  // In <main>, as in the app shell: the page's header isn't the document's banner
  return (
    <MockFetch routes={routes}>
      <main>
        <CategoriesPage />
      </main>
    </MockFetch>
  );
}

const tablet = { viewport: { value: 'tablet', isRotated: false } };
const desktop = { viewport: { value: 'desktop', isRotated: false } };

const meta = {
  title: 'Categories/Categories page',
  component: CategoriesScreen,
  args: {},
} satisfies Meta<typeof CategoriesScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Phone: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('33 categories in 7 groups')).toBeInTheDocument();
  },
};

export const PhoneDark: Story = { globals: { colorScheme: 'dark' } };

/** Folding a group: its first categories show in its row. */
export const PhoneFoldOne: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const home = await canvas.findByRole('button', { name: /Home expenses/ });
    await userEvent.click(home);
    await expect(home).toHaveTextContent('Rent, Bills, Home supplies and 6 more');
  },
};

export const SomeFolded: Story = { args: { folded: ['group-2', 'group-3', 'group-4'] } };

export const AllFolded: Story = {
  args: { folded: DEFAULT_CATEGORIES.groups.map((group) => group.id) },
};

export const Tablet: Story = { args: { folded: ['group-2', 'group-3'] }, globals: tablet };

export const Desktop: Story = { globals: desktop };

export const DesktopDark: Story = { globals: { ...desktop, colorScheme: 'dark' } };

/** Another group picked in the list: its categories come in beside it. */
export const DesktopAnotherGroup: Story = {
  globals: desktop,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const index = await canvas.findByRole('navigation', { name: 'Category groups' });
    await userEvent.click(within(index).getByRole('button', { name: /Home expenses/ }));
    await expect(canvas.getByRole('region', { name: 'Home expenses' })).toHaveTextContent(
      'Expenses, 9 categories',
    );
  },
};

export const Loading: Story = { args: { data: 'loading' } };

export const CouldNotLoad: Story = { args: { data: 'error' } };

export const Empty: Story = { args: { data: 'empty' } };
