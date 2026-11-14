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
  // A quieter toolbar for looking at a design (I-026): no grid and backgrounds, measure or outline buttons.
  features: {
    backgrounds: false,
    measure: false,
    outline: false,
  },
  // Storybook's own bundles (docs, axe) are large by design; only the app's chunks are worth warning about.
  // No service worker or manifest for Storybook's static site (F-025): the app's PWA plugins are left out.
  viteFinal: (viteConfig) =>
    mergeConfig(
      {
        ...viteConfig,
        plugins: (viteConfig.plugins ?? [])
          .flat()
          .filter(
            (plugin) =>
              !(
                plugin &&
                typeof plugin === 'object' &&
                'name' in plugin &&
                plugin.name.startsWith('vite-plugin-pwa')
              ),
          ),
      },
      { build: { chunkSizeWarningLimit: 2000 } },
    ),
};

export default config;
