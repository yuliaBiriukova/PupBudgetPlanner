import { Button, Text } from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { BottomSheet } from './BottomSheet';
import { LongCategoryList, SaveButtons } from './storyContent';

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

/** Longer than the screen: only the content scrolls, between the title and the pinned buttons (I-004). */
export const LongWithButtons: Story = {
  args: {
    title: 'Categories to show',
    children: <LongCategoryList />,
    footer: <SaveButtons />,
  },
};

export const LongWithButtonsDark: Story = {
  ...LongWithButtons,
  globals: { colorScheme: 'dark' },
};

/**
 * Try it (I-015): drag the handle or the title down, or the list from its top; let go past a quarter of the height or
 * flick, and it closes; Back closes it too. "Open the sheet" brings it back.
 */
export const SwipeAndBack: Story = {
  args: {
    title: 'Categories to show',
    children: <LongCategoryList />,
    footer: <SaveButtons />,
  },
  render: function SwipeAndBackStory(args) {
    const [opened, setOpened] = useState(true);
    return (
      <>
        <Button
          m="md"
          onClick={() => {
            setOpened(true);
          }}
        >
          Open the sheet
        </Button>
        <BottomSheet
          {...args}
          opened={opened}
          onClose={() => {
            setOpened(false);
            args.onClose();
          }}
        />
      </>
    );
  },
};
