import { useState, type ReactNode } from 'react';

/** How a story's fake API answers one path: JSON, a status with no body, or never (loading forever). */
export type MockAnswer = { json: unknown; status?: number } | { status: number } | 'pending';

/** `METHOD /path` → answer; a path without a method matches GET. */
export type MockRoutes = Record<string, MockAnswer | ((body: unknown) => MockAnswer)>;

function answer(
  routes: MockRoutes,
  method: string,
  path: string,
  body: unknown,
): Promise<Response> {
  const route = routes[`${method} ${path}`] ?? (method === 'GET' ? routes[path] : undefined);
  const result = typeof route === 'function' ? route(body) : route;
  if (result === 'pending') return new Promise<Response>(() => undefined);
  if (!result) return Promise.resolve(new Response(null, { status: 404 }));
  if ('json' in result) {
    return Promise.resolve(
      new Response(JSON.stringify(result.json), {
        status: result.status ?? 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  }
  return Promise.resolve(new Response(null, { status: result.status }));
}

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
        new URL(request.url).pathname,
        text ? (JSON.parse(text) as unknown) : undefined,
      );
    };
    return true;
  });
  return children;
}
