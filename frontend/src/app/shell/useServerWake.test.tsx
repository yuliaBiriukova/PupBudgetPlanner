import type { QueryClient } from '@tanstack/react-query';
import { act, screen } from '@testing-library/react';
import { delay } from 'msw';
import { http, HttpResponse } from 'msw/http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderApp } from '../../test/render';
import { server } from '../../test/server';

/** Makes the health check hang until `release()` is called, like a server waking up. */
function sleepingServer() {
  let release: () => void = () => undefined;
  const answered = new Promise<void>((resolve) => {
    release = resolve;
  });
  server.use(
    http.get('/api/health', async () => {
      await answered;
      return HttpResponse.json({ status: 'ok' });
    }),
  );
  return () => {
    release();
  };
}

/**
 * Waits until no request is running and the shell knows it. Requests run in real time, so the fake clock must
 * not move before this; TanStack Query tells the shell on a real `setTimeout(0)`, which the last step lets run.
 */
async function requestsFinished(queryClient: QueryClient) {
  await vi.waitFor(() => {
    expect(queryClient.isFetching()).toBe(0);
  });
  await act(
    () =>
      new Promise<void>((resolve) => {
        setTimeout(resolve, 0);
      }),
  );
}

describe('waking up the server', () => {
  beforeEach(() => {
    // Only the clock and the ticking interval: MSW and TanStack Query keep their real timers
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a pill with the seconds after 3 s without an answer, then says connected', async () => {
    const wake = sleepingServer();
    renderApp('/transactions');
    await screen.findByRole('heading', { level: 1, name: 'Transactions' });
    expect(screen.queryByText('Waking up the server…')).not.toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4200);
    });

    expect(screen.getByText('Waking up the server…')).toBeInTheDocument();
    expect(screen.getByText('4 s')).toBeInTheDocument();

    wake();

    expect(await screen.findByText('Connected')).toBeInTheDocument();
    expect(screen.queryByText('Waking up the server…')).not.toBeInTheDocument();
  });

  it('shows nothing when the server answers quickly', async () => {
    // A short real delay, like on a busy CI runner: the answer may come after the page is drawn
    server.use(
      http.get('/api/health', async () => {
        await delay(50);
        return HttpResponse.json({ status: 'ok' });
      }),
    );
    const { queryClient } = renderApp('/transactions');
    await screen.findByRole('heading', { level: 1, name: 'Transactions' });
    await requestsFinished(queryClient);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(screen.queryByText('Waking up the server…')).not.toBeInTheDocument();
    expect(screen.queryByText('Connected')).not.toBeInTheDocument();
  });
});
