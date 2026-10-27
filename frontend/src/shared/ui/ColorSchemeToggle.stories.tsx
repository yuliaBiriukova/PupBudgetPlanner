import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { ColorSchemeToggle } from './ColorSchemeToggle';

const meta = {
  title: 'Shared/ColorSchemeToggle',
  component: ColorSchemeToggle,
  tags: ['autodocs'],
} satisfies Meta<typeof ColorSchemeToggle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Light: Story = {
  globals: { colorScheme: 'light' },
};

export const Dark: Story = {
  globals: { colorScheme: 'dark' },
};

export const SwitchesToDark: Story = {
  globals: { colorScheme: 'light' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(await canvas.findByRole('button', { name: 'Switch to dark mode' }));

    await expect(
      await canvas.findByRole('button', { name: 'Switch to light mode' }),
    ).toBeInTheDocument();
  },
};
