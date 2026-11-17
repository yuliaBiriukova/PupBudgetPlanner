import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { isIosSafari, isStandalone } from '../../app/pwa/install';
import { apiClient } from '../../shared/api/client';

/**
 * The budget reminder on the 1st on this device (F-033): a web push the server sends at 09:00 Kyiv to people who
 * haven't planned the month. Each device turns it on for itself; the browser asks to allow notifications.
 *
 * - `install-first`: an iPhone in Safari, where only the app on the home screen gets notifications;
 * - `unsupported`: no push in this browser, no service worker (the `vite` dev server) or no keys on the server;
 * - `blocked`: the person said no to notifications; only the browser's site settings can change it;
 * - `off` / `on`: this device's subscription.
 */
export type ReminderState = 'install-first' | 'unsupported' | 'blocked' | 'off' | 'on';

const reminderKey = ['reminder'] as const;

async function registration(): Promise<ServiceWorkerRegistration | undefined> {
  if (!('serviceWorker' in navigator)) return undefined;
  return navigator.serviceWorker.getRegistration();
}

/** The app's public key, or none when push isn't set up on the server. */
async function serverKey(signal?: AbortSignal): Promise<string | null> {
  const { data, response } = await apiClient.GET('/api/push/key', { signal });
  if (!response.ok || !data)
    throw new Error(`Couldn't load the push key: ${String(response.status)}`);
  return data.publicKey;
}

export const reminderQuery = queryOptions({
  queryKey: reminderKey,
  queryFn: async ({ signal }): Promise<ReminderState> => {
    if (isIosSafari(navigator.userAgent, navigator.maxTouchPoints) && !isStandalone())
      return 'install-first';
    if (!('PushManager' in window) || !('Notification' in window)) return 'unsupported';
    const worker = await registration();
    if (!worker || !(await serverKey(signal))) return 'unsupported';
    if (Notification.permission === 'denied') return 'blocked';
    return (await worker.pushManager.getSubscription()) ? 'on' : 'off';
  },
  staleTime: Infinity,
  retry: false,
});

const fromBase64Url = (text: string) => {
  const base64 = text.replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4)), (c) =>
    c.charCodeAt(0),
  );
};

/** The person said no in the browser's "Allow notifications?". */
export class NotificationsBlocked extends Error {}

/** Turns the reminder on (asking the browser first) or off for this device. */
export function useSetReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (on: boolean) => {
      const worker = await registration();
      if (!worker) throw new Error('No service worker');
      const current = await worker.pushManager.getSubscription();
      if (!on) {
        if (current) {
          await current.unsubscribe();
          await apiClient.POST('/api/push/subscription/remove', {
            body: { endpoint: current.endpoint },
          });
        }
        return;
      }

      if ((await Notification.requestPermission()) !== 'granted') throw new NotificationsBlocked();
      const key = await serverKey();
      if (!key) throw new Error('Push is not set up on the server');
      const subscription =
        current ??
        (await worker.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: fromBase64Url(key),
        }));
      const json = subscription.toJSON();
      const { response } = await apiClient.PUT('/api/push/subscription', {
        body: {
          endpoint: subscription.endpoint,
          p256dh: json.keys?.p256dh ?? '',
          auth: json.keys?.auth ?? '',
        },
      });
      if (!response.ok) {
        await subscription.unsubscribe();
        throw new Error(`Couldn't save the subscription: ${String(response.status)}`);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: reminderKey }),
  });
}

export function useReminder() {
  return useQuery(reminderQuery);
}

/** "Not now" on the Budget page's card hides it for good on this device; Settings keeps the switch. */
const CARD_KEY = 'pup.budgetReminderCard';

export function useReminderCard() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(CARD_KEY) === 'dismissed';
    } catch {
      return false;
    }
  });
  return {
    dismissed,
    dismiss: () => {
      try {
        localStorage.setItem(CARD_KEY, 'dismissed');
      } catch {
        // The card only hides for this visit
      }
      setDismissed(true);
    },
  };
}
