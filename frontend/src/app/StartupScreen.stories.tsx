import type { Meta, StoryObj } from '@storybook/react-vite';
import { useQueryClient } from '@tanstack/react-query';
import { healthQuery } from './shell/useServerWake';
import { StartupScreen } from './StartupScreen';

/** The API counts as awake, so the story makes no request. */
function AwakeStartupScreen(props: Parameters<typeof StartupScreen>[0]) {
  useQueryClient().setQueryData(healthQuery.queryKey, true);
  return <StartupScreen {...props} />;
}

const meta = {
  title: 'App/StartupScreen',
  component: AwakeStartupScreen,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof AwakeStartupScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

/** While the app asks who is signed in. */
export const Loading: Story = {};

/** The API didn't answer even after a minute of waking up. */
export const Failed: Story = {
  args: { failed: true, onRetry: () => undefined },
};

export const FailedDark: Story = {
  globals: { colorScheme: 'dark' },
  args: { failed: true, onRetry: () => undefined },
};
