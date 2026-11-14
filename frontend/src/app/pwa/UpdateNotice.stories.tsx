import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { UpdateNotice } from './UpdateNotice';
import { resetUpdateForTests, updateReady } from './updates';

/** After a release (F-025): the toast stays until Reload or × (top on the phone, bottom right on the desktop). */
const meta = {
  title: 'App/UpdateNotice',
  component: UpdateNotice,
  parameters: { layout: 'fullscreen' },
  beforeEach: () => {
    updateReady(() => undefined);
    return () => {
      resetUpdateForTests();
    };
  },
  play: async () => {
    await expect(
      await within(document.body).findByText('A new version is ready.'),
    ).toBeInTheDocument();
  },
} satisfies Meta<typeof UpdateNotice>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Phone: Story = {};

export const PhoneDark: Story = {
  globals: { colorScheme: 'dark' },
};

export const Desktop: Story = {
  globals: { viewport: { value: 'desktop', isRotated: false } },
};
