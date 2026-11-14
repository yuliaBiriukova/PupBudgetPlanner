import type { QueryClient, QueryKey } from '@tanstack/react-query';
import { act, waitFor } from '@testing-library/react';
import { expect } from 'vitest';
import { LOADED } from './render';

/**
 * Waits until the query has its answer and the components have been told (I-033). Use it before a "nothing there"
 * check that depends on an answer which draws nothing (an empty list, no family): only then does "nothing there" mean
 * there is none, and not that it hasn't come yet. TanStack Query tells the components on the next `setTimeout`, so
 * a `success` status alone is one tick too early.
 */
export async function queryAnswered(queryClient: QueryClient, queryKey: QueryKey) {
  await waitFor(() => {
    expect(queryClient.getQueryState(queryKey)?.status).toBe('success');
  }, LOADED);
  await act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));
}
