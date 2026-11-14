import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/charts/styles.css';
import '@mantine/notifications/styles.css';
// Self-hosted fonts with Cyrillic (ADR 0011): Manrope for text, Unbounded for headings and amounts
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/500.css';
import '@fontsource/unbounded/300.css';
import './shared/i18n/i18n';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { listenForInstall } from './app/pwa/install';
import { registerServiceWorker } from './app/pwa/register';

// The installable app (F-025): Chrome's install offer can come before the first render
listenForInstall();
registerServiceWorker();

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element #root not found');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
