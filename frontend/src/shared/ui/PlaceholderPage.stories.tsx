import type { Meta, StoryObj } from '@storybook/react-vite';
import { PlaceholderPage } from './PlaceholderPage';

const meta = {
  title: 'Shared/PlaceholderPage',
  component: PlaceholderPage,
  tags: ['autodocs'],
  args: {
    title: 'Accounts',
    description: 'Your accounts and their balances will be shown here.',
  },
} satisfies Meta<typeof PlaceholderPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Light: Story = {};

export const Dark: Story = {
  globals: { colorScheme: 'dark' },
};
