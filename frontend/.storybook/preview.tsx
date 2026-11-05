import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/charts/styles.css';
import '@mantine/notifications/styles.css';
// Self-hosted fonts with Cyrillic (ADR 0011): Manrope for text, Unbounded for headings and amounts
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/500.css';
import '@fontsource/unbounded/300.css';
import '../src/shared/i18n/i18n';

import type { Decorator, Preview } from '@storybook/react-vite';
import { AppProviders } from '../src/app/AppProviders';
import { ColorSchemeSync, type ColorScheme } from './ColorSchemeSync';

/**
 * Wraps every story in the same providers and theme as the app. Keyed by story, so each story starts with a
 * fresh query cache and the toolbar's color scheme, whatever the previous story changed.
 */
const withAppProviders: Decorator = (Story, context) => {
  const colorScheme: ColorScheme = context.globals.colorScheme === 'dark' ? 'dark' : 'light';

  return (
    <AppProviders key={context.id}>
      <ColorSchemeSync colorScheme={colorScheme}>
        <Story />
      </ColorSchemeSync>
    </AppProviders>
  );
};

const preview: Preview = {
  decorators: [withAppProviders],
  globalTypes: {
    colorScheme: {
      description: 'Light or dark mode',
      toolbar: {
        title: 'Color scheme',
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    colorScheme: 'light',
    // Stories open in the mobile viewport first (CLAUDE.md, "Screens and design").
    viewport: { value: 'mobile', isRotated: false },
  },
  parameters: {
    layout: 'padded',
    // The design check's sizes (I-026). Storybook's own "Reset viewport" is the window's size, which a prototype
    // link opens with (`globals=viewport.value:!undefined`).
    viewport: {
      options: {
        mobile: { name: 'Phone', styles: { width: '375px', height: '812px' }, type: 'mobile' },
        tablet: { name: 'Tablet', styles: { width: '768px', height: '1024px' }, type: 'tablet' },
        desktop: { name: 'Desktop', styles: { width: '1440px', height: '900px' }, type: 'desktop' },
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // Report accessibility problems in the panel; CI enforcement comes with the test runner later.
      test: 'todo',
    },
  },
};

export default preview;
