import { notifications } from '@mantine/notifications';
import { queryOptions, useIsFetching, useIsMutating, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../shared/api/client';

/** After this long without an answer the API is probably asleep (night-time cold start on the free plan). */
export const WAKE_THRESHOLD_MS = 3000;

/** Asked once at start-up, so a sleeping server starts waking before the first page needs data. */
export const healthQuery = queryOptions({
  queryKey: ['health'],
  queryFn: async ({ signal }) => {
    const { response } = await apiClient.GET('/api/health', { signal });
    if (!response.ok) throw new Error(`Health check failed: ${String(response.status)}`);
    return true;
  },
  // A cold start takes up to about a minute
  retry: 20,
  retryDelay: 3000,
  staleTime: Infinity,
});

/**
 * Whether the server seems to be waking up: some request has been running longer than the threshold.
 * When it finally answers, a short "Connected" notification follows.
 */
export function useServerWake(thresholdMs = WAKE_THRESHOLD_MS) {
  const { t } = useTranslation();
  useQuery(healthQuery);
  const busy = useIsFetching() + useIsMutating() > 0;
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!busy) return;
    const start = Date.now();
    let waking = false;
    const timer = setInterval(() => {
      const ms = Date.now() - start;
      waking ||= ms >= thresholdMs;
      setElapsed(ms);
    }, 250);
    return () => {
      clearInterval(timer);
      setElapsed(0);
      if (waking) notifications.show({ message: t('wake.connected'), autoClose: 2500 });
    };
  }, [busy, thresholdMs, t]);

  const waking = busy && elapsed >= thresholdMs;
  return { waking, seconds: Math.floor(elapsed / 1000) };
}
