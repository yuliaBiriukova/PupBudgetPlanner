import type { Meta, StoryObj } from '@storybook/react-vite';
import { Brand, Logo } from './Logo';

const meta = {
  title: 'Shell/Logo',
  component: Logo,
  tags: ['autodocs'],
} satisfies Meta<typeof Logo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Mark: Story = {};

export const MarkDark: Story = {
  globals: { colorScheme: 'dark' },
};

export const WithName: Story = {
  render: () => <Brand />,
};

export const WithNameDark: Story = {
  globals: { colorScheme: 'dark' },
  render: () => <Brand />,
};
