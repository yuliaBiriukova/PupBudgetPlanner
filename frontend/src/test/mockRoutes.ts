/** How a story's fake API answers one path: JSON, a status with no body, or never (loading forever). */
export type MockAnswer = { json: unknown; status?: number } | { status: number } | 'pending';

/**
 * `METHOD /path` → answer; a path without a method matches GET. A function gets the body and the query (F-020), and
 * the path's `{name}` parts (`PUT /api/categories/{id}`, F-029); a path written out wins over one with parts.
 */
export type MockRoutes = Record<
  string,
  | MockAnswer
  | ((body: unknown, query: URLSearchParams, params: Record<string, string>) => MockAnswer)
>;

/** The route for a request, with the values of its `{name}` parts. */
function routeOf(routes: MockRoutes, method: string, path: string) {
  const exact = routes[`${method} ${path}`] ?? (method === 'GET' ? routes[path] : undefined);
  if (exact) return { route: exact, params: {} };
  for (const [key, route] of Object.entries(routes)) {
    const [keyMethod, keyPath] = key.includes(' ') ? key.split(' ') : ['GET', key];
    if (keyMethod !== method || !keyPath?.includes('{')) continue;
    const names: string[] = [];
    const pattern = keyPath.replace(/\{(\w+)\}/g, (_, name: string) => {
      names.push(name);
      return '([^/]+)';
    });
    const match = new RegExp(`^${pattern}$`).exec(path);
    if (match)
      return {
        route,
        params: Object.fromEntries(names.map((name, index) => [name, match[index + 1] ?? ''])),
      };
  }
  return { route: undefined, params: {} };
}

/** The answer of `routes` to one request; the unit tests use it with MSW too (F-029). */
export function answer(
  routes: MockRoutes,
  method: string,
  url: URL,
  body: unknown,
): Promise<Response> {
  const { route, params } = routeOf(routes, method, url.pathname);
  const result = typeof route === 'function' ? route(body, url.searchParams, params) : route;
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
