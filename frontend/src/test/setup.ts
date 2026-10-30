import '@testing-library/jest-dom/vitest';
import '../shared/i18n/i18n';

import { notifications } from '@mantine/notifications';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';
import { setScreenWidth } from './screen';
import { server } from './server';

// jsdom lacks the browser APIs Mantine relies on; media queries answer for a phone unless a test says otherwise.
beforeEach(() => {
  setScreenWidth(375);
});

class ResizeObserverStub {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
window.ResizeObserver = ResizeObserverStub;
// jsdom has no layout, so nothing to scroll into view
Element.prototype.scrollIntoView = vi.fn();

// Every request must be mocked: an unexpected call fails the test.
beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  localStorage.clear();
  // Mantine keeps notifications in a global store that outlives the rendered app
  notifications.clean();
});

afterAll(() => {
  server.close();
});
