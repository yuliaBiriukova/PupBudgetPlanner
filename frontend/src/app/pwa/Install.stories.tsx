import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { InstallCard, InstallSheet } from './InstallParts';
import type { InstallWay } from './install';

interface InstallStoryProps {
  /** Chrome or Edge (the browser's own dialog) or Safari on the iPhone (its three taps). */
  way: Exclude<InstallWay, null>;
}

/** The card as at the top of the page; its Install opens the sheet, Not now hides it (F-025). */
function InstallStory({ way }: InstallStoryProps) {
  const [sheet, setSheet] = useState(false);
  const [card, setCard] = useState(true);
  return (
    <>
      {card && (
        <InstallCard
          onInstall={() => {
            setSheet(true);
          }}
          onDismiss={() => {
            setCard(false);
          }}
        />
      )}
      <InstallSheet
        opened={sheet}
        way={way}
        onClose={() => {
          setSheet(false);
        }}
        onInstall={() => {
          setSheet(false);
        }}
      />
    </>
  );
}

const meta = {
  title: 'App/Install the app',
  component: InstallStory,
  parameters: { layout: 'fullscreen' },
  args: { way: 'prompt' },
} satisfies Meta<typeof InstallStory>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The card, once at the top of the page on the phone. */
export const Card: Story = {};

export const CardDark: Story = {
  globals: { colorScheme: 'dark' },
};

/** Chrome or Edge: what installing gives, Not now and Install. */
export const SheetChrome: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Install' }));
    const sheet = await within(document.body).findByRole('dialog', { name: 'Install the app' });
    await expect(within(sheet).getByRole('button', { name: 'Install' })).toBeVisible();
  },
};

/** Safari on the iPhone: the three taps and Got it. */
export const SheetIphone: Story = {
  args: { way: 'ios' },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Install' }));
    const sheet = await within(document.body).findByRole('dialog', { name: 'Install the app' });
    await expect(within(sheet).getByRole('list', { name: 'In Safari' })).toBeVisible();
  },
};

export const SheetIphoneDark: Story = {
  ...SheetIphone,
  globals: { colorScheme: 'dark' },
};
