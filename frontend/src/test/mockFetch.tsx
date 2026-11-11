import { useState, type ReactNode } from 'react';
import { answer, type MockRoutes } from './mockRoutes';

export type { MockAnswer, MockRoutes } from './mockRoutes';

/**
 * Storybook has no API: this answers the app's requests from `routes` while the story is shown. It replaces
 * `fetch` before the children render, so their first query already gets the fake answers.
 */
export function MockFetch({ routes, children }: { routes: MockRoutes; children: ReactNode }) {
  useState(() => {
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = input instanceof Request ? input : new Request(input, init);
      const text = request.method === 'GET' ? '' : await request.text();
      return answer(
        routes,
        request.method,
        new URL(request.url),
        text ? (JSON.parse(text) as unknown) : undefined,
      );
    };
    return true;
  });
  return children;
}
