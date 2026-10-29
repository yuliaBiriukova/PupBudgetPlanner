import { Text } from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { ResponsiveDialog } from './ResponsiveDialog';
import { LongCategoryList, SaveButtons } from './storyContent';

const meta = {
  title: 'Shared/ResponsiveDialog',
  component: ResponsiveDialog,
  parameters: { layout: 'fullscreen' },
  args: {
    opened: true,
    onClose: fn(),
    title: 'Categories to show',
    children: <LongCategoryList />,
    footer: <SaveButtons />,
  },
} satisfies Meta<typeof ResponsiveDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

const desktop = { viewport: { value: 'desktop', isRotated: false } };

/** On the phone: the bottom sheet. The content scrolls between the title and the pinned buttons (I-004). */
export const LongOnPhone: Story = {};

export const LongOnPhoneDark: Story = {
  globals: { colorScheme: 'dark' },
};

/** On the desktop: the centred dialog, scrolling the same way. */
export const LongOnDesktop: Story = {
  globals: desktop,
};

export const LongOnDesktopDark: Story = {
  globals: { ...desktop, colorScheme: 'dark' },
};

/** Short content: no scroll bar and no fades. */
export const Short: Story = {
  globals: desktop,
  args: {
    title: 'Block Iryna Melnyk?',
    children: (
      <Text>Iryna is signed out everywhere. Her data stays; you can unblock her later.</Text>
    ),
  },
};
