import { QueryClient } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { AppProviders } from '../app/AppProviders';
import { routes } from '../app/routes';

function createTestQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

/** Renders the whole app at the given URL with all providers, as in the browser. */
export function renderApp(url = '/') {
  const router = createMemoryRouter(routes, { initialEntries: [url] });
  const queryClient = createTestQueryClient();

  const result = render(
    <AppProviders queryClient={queryClient} env="test">
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return { ...result, queryClient };
}
