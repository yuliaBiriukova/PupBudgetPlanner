import type { Meta, StoryObj } from '@storybook/react-vite';
import { WakePill } from './WakePill';

const meta = {
  title: 'Shell/WakePill',
  component: WakePill,
  tags: ['autodocs'],
  // The pill is positioned at the top of its column
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', height: 140 }}>
        <Story />
      </div>
    ),
  ],
  args: { waking: true, seconds: 12 },
} satisfies Meta<typeof WakePill>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Waking: Story = {};

export const WakingDark: Story = {
  globals: { colorScheme: 'dark' },
};

export const JustStarted: Story = {
  args: { seconds: 3 },
};

/** The server answered: nothing is shown (the live region stays for screen readers). */
export const Awake: Story = {
  args: { waking: false, seconds: 0 },
};
