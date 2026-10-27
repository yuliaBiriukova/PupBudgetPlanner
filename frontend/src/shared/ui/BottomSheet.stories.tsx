import { Text } from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { BottomSheet } from './BottomSheet';

const meta = {
  title: 'Shared/BottomSheet',
  component: BottomSheet,
  parameters: { layout: 'fullscreen' },
  args: {
    opened: true,
    onClose: fn(),
    title: 'Add transaction',
    children: <Text c="dimmed">Adding expenses, income and transfers is coming soon.</Text>,
  },
} satisfies Meta<typeof BottomSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithTitle: Story = {};

export const WithTitleDark: Story = {
  globals: { colorScheme: 'dark' },
};

/** Like the More menu: only the grab handle and the list; the title is for screen readers. */
export const HiddenTitle: Story = {
  args: {
    title: 'More',
    hideTitle: true,
    children: (
      <>
        <Text py="sm">Family</Text>
        <Text py="sm">Settings</Text>
      </>
    ),
  },
};
