import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { MockFetch, type MockRoutes } from '../../test/mockFetch';
import { CategoriesPage } from './CategoriesPage';
import { DEFAULT_CATEGORIES, NO_CATEGORIES } from './categoriesTestData';

interface ScreenProps {
  data?: 'categories' | 'empty' | 'loading' | 'error';
  /** Ids of the open groups on this device, the last one shown on the desktop; none stored: only the first. */
  open?: string[];
}

/** The Categories page with a fake API (F-015). */
function CategoriesScreen({ data = 'categories', open }: ScreenProps) {
  if (open) localStorage.setItem('pup.categories.open', JSON.stringify(open));
  else localStorage.removeItem('pup.categories.open');
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

const ALL_GROUPS = DEFAULT_CATEGORIES.groups.map((group) => group.id);
const tablet = { viewport: { value: 'tablet', isRotated: false } };
const desktop = { viewport: { value: 'desktop', isRotated: false } };

const meta = {
  title: 'Categories/Categories page',
  component: CategoriesScreen,
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
    await userEvent.click(within(index).getByRole('button', { name: /Home expenses/ }));
    await expect(canvas.getByRole('region', { name: 'Home expenses' })).toHaveTextContent(
      'Expenses, 9 categories',
    );
  },
};

export const Loading: Story = { args: { data: 'loading' } };

export const CouldNotLoad: Story = { args: { data: 'error' } };

export const Empty: Story = { args: { data: 'empty' } };
