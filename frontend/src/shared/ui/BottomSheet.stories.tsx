import {
  ActionIcon,
  Button,
  Center,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
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
    title: 'Account',
    children: <Text c="dimmed">Mono black, Privat card and Wallet would be listed here.</Text>,
  },
} satisfies Meta<typeof BottomSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithTitle: Story = {};

/**
 * The transaction form's (F-018): a switch in the title row in place of the title, which screen readers still hear.
 */
export const WithHeading: Story = {
  args: {
    title: 'Add expense',
    heading: (
      <SegmentedControl fullWidth radius="xl" data={['Expense', 'Income']} aria-label="Type" />
    ),
  },
};

/** A button in the title row before the close button: the transaction form's Delete (F-018). */
export const WithActions: Story = {
  args: {
    title: 'Edit expense',
    actions: (
      <ActionIcon
        variant="subtle"
        color="gray"
        size={44}
        radius="xl"
        aria-label="Delete this expense"
      >
        <IconTrash size={20} stroke={1.7} />
      </ActionIcon>
    ),
  },
};

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

/**
 * Longer than the screen: the sheet takes the whole screen, its corners square at the top (I-029); only the content
 * scrolls, between the title and the pinned buttons (I-004).
 */
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

/** The stand-in keyboard's height, as the E2E tests emulate it. */
const KEYBOARD = 300;

/**
 * Storybook has no phone keyboard: the visual viewport the sheet reads says the bottom 300 px are taken, as a phone
 * does while a field is typed (I-017). Set before the story renders, put back after it.
 */
function keyboardUp() {
  const viewport = Object.assign(new EventTarget(), {
    height: window.innerHeight - KEYBOARD,
    offsetTop: 0,
    scale: 1,
  });
  const follow = () => {
    viewport.height = window.innerHeight - KEYBOARD;
    viewport.dispatchEvent(new Event('resize'));
  };
  window.addEventListener('resize', follow);
  Object.defineProperty(window, 'visualViewport', { value: viewport, configurable: true });
  return () => {
    window.removeEventListener('resize', follow);
    Reflect.deleteProperty(window, 'visualViewport');
  };
}

/**
 * While the phone's keyboard is up (a stand-in here), the sheet sits on it and is at most as tall as what the keyboard
 * leaves: the field being typed and the buttons stay in sight, the rest scrolls (I-029).
 */
export const AboveTheKeyboard: Story = {
  args: {
    title: 'New account',
    footer: <SaveButtons />,
    children: (
      <Stack gap="md">
        <TextInput
          label="Name"
          description="As you call it: Mono black, Wallet, Dollars at home."
        />
        <TextInput label="Bank" description="Monobank, PrivatBank or any other." />
        <TextInput label="Note" description="Anything to remember about this account." />
      </Stack>
    ),
  },
  beforeEach: keyboardUp,
  render: (args) => (
    <>
      <BottomSheet {...args} />
      <Center
        pos="fixed"
        bottom={0}
        left={0}
        right={0}
        h={KEYBOARD}
        bg="var(--pup-color-rule)"
        style={{ zIndex: 1000 }}
        aria-hidden="true"
      >
        <Text c="dimmed" size="sm">
          Phone keyboard (stand-in)
        </Text>
      </Center>
    </>
  ),
};

export const AboveTheKeyboardDark: Story = {
  ...AboveTheKeyboard,
  globals: { colorScheme: 'dark' },
};

/** A long sheet above the keyboard: as tall as what the keyboard leaves, square at its top (I-029). */
export const LongAboveTheKeyboard: Story = {
  ...AboveTheKeyboard,
  args: {
    title: 'Categories to show',
    children: <LongCategoryList />,
    footer: <SaveButtons />,
  },
};
