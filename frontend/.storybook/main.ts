import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';

// Storybook reuses vite.config.ts, so stories build exactly like the app.
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: '@storybook/react-vite',
  core: {
    disableTelemetry: true,
  },
  // Storybook's own bundles (docs, axe) are large by design; only the app's chunks are worth warning about.
  viteFinal: (viteConfig) => mergeConfig(viteConfig, { build: { chunkSizeWarningLimit: 2000 } }),
};

export default config;
